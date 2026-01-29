import dotenv from "dotenv";
import { ethers } from "ethers";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

/* ===== CONFIG ===== */

const ABI = [
  "function resolveRound(uint256 roundId, uint8 result) external"
];

const COLOR_MAP = {
  RED: 0,
  GREEN: 1,
  VIOLET: 2
};

const COLORS = ["RED", "GREEN", "VIOLET"];

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  ABI,
  wallet
);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/* ===== RESULT LOGIC ===== */

function generateResult() {
  const r = Math.random();
  if (r < 0.45) return "RED";
  if (r < 0.9) return "GREEN";
  return "VIOLET";
}

/* ===== CORE ENGINE ===== */

async function resolveCurrentRound() {
  const { data, error } = await supabase
    .from("rounds")
    .select("*")
    .eq("status", "CLOSED")
    .order("id", { ascending: true })
    .limit(1);

  if (error) {
    console.error("❌ Supabase error:", error);
    return;
  }

  if (!data || !data.length) {
    console.log("⏳ No round to resolve");
    return;
  }

  const round = data[0];
  const color = generateResult();

  console.log(`🟣 Resolving round ${round.id} → ${color}`);

  /* ⛓️ Resolve on-chain */
  const tx = await contract.resolveRound(
    round.id,
    COLOR_MAP[color]
  );
  await tx.wait();

  console.log("⛓️ Blockchain resolved");

  /* 📢 Update rounds table */
  await supabase
    .from("rounds")
    .update({
      status: "RESOLVED",
      result_color: color
    })
    .eq("id", round.id);

  /* 🧾 Insert history */
  await supabase
    .from("round_results_history")
    .insert({
      round_id: round.id,
      color: color
    });

  console.log("📢 Supabase updated + history inserted");
}

resolveCurrentRound().catch(console.error);
