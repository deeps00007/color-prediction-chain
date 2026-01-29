import dotenv from "dotenv";
import { ethers } from "ethers";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

/* ===== CONFIG ===== */

const ABI = [
  "function resolveRound(uint256 roundId, uint8 result) external"
];

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

/* ===== COLOR LOGIC ===== */

function generateResult() {
  const rand = Math.random();
  if (rand < 0.45) return 0; // RED
  if (rand < 0.9) return 1;  // GREEN
  return 2;                  // VIOLET
}

/* ===== CORE ENGINE ===== */

async function resolveCurrentRound() {
  const { data, error } = await supabase
    .from("rounds")
    .select("*")
    .eq("status", "CLOSED")
    .order("id", { ascending: false })
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
  const result = generateResult();

  console.log(`🟣 Resolving round ${round.id} → ${result}`);

  // ⛓️ Resolve on-chain
  const tx = await contract.resolveRound(round.id, result);
  await tx.wait();

  console.log("⛓️ Blockchain resolved");

  // 📢 Update Supabase
  await supabase
    .from("rounds")
    .update({
      status: "RESOLVED",
      result: result
    })
    .eq("id", round.id);

  console.log("📢 Supabase updated");
}

resolveCurrentRound().catch(console.error);
