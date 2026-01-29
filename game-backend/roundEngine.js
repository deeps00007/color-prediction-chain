import { supabase } from "./supabase.js";
import { generateColor } from "./probabilities.js";
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

const ROUND_DURATION = Number(process.env.ROUND_DURATION_SECONDS);

/* ===== BLOCKCHAIN SETUP ===== */

const ABI = [
  "function resolveRound(uint256 roundId, uint8 result) external"
];

const COLOR_MAP = {
  RED: 0,
  GREEN: 1,
  VIOLET: 2
};

let provider, wallet, contract;

try {
  provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    ABI,
    wallet
  );
  console.log("⛓️ Blockchain connected");
} catch (err) {
  console.error("❌ Blockchain setup failed:", err.message);
}

/* ===== ROUND ENGINE ===== */

export async function runRoundEngine() {
  const now = new Date();

  const { data: rounds, error } = await supabase
    .from("rounds")
    .select("*")
    .order("id", { ascending: false })
    .limit(1);

  const currentRound = rounds?.[0];

  // 1️⃣ If no round exists → create first round ONCE
  if (!currentRound) {
    await createNewRound();
    return;
  }

  // 2️⃣ OPEN → CLOSED
  if (
    currentRound.status === "OPEN" &&
    now >= new Date(currentRound.end_time)
  ) {
    await closeRound(currentRound.id);
    return;
  }

  // 3️⃣ CLOSED → RESOLVED
  if (currentRound.status === "CLOSED") {
    await resolveRound(currentRound.id);
    return;
  }

  // 4️⃣ RESOLVED → NEW ROUND
  if (currentRound.status === "RESOLVED") {
    await createNewRound();
    return;
  }
}

// ---- STATE TRANSITIONS ----

async function createNewRound() {
  const start = new Date();
  const end = new Date(start.getTime() + ROUND_DURATION * 1000);

  await supabase.from("rounds").insert({
    status: "OPEN",
    start_time: start,
    end_time: end
  });

  console.log("🟢 New round started");
}

async function closeRound(roundId) {
  await supabase
    .from("rounds")
    .update({ status: "CLOSED" })
    .eq("id", roundId);

  console.log("🔴 Round closed:", roundId);
}

async function resolveRound(roundId) {
  const result = generateColor();

  console.log(`🎲 Resolving round ${roundId} → ${result}`);

  // 1️⃣ Resolve on blockchain FIRST (this pays winners!)
  try {
    if (contract) {
      const tx = await contract.resolveRound(roundId, COLOR_MAP[result]);
      await tx.wait();
      console.log("⛓️ Blockchain resolved, winners paid!");
    }
  } catch (err) {
    console.error("❌ Blockchain resolution failed:", err.message);
  }

  // 2️⃣ Update Supabase
  await supabase
    .from("rounds")
    .update({
      status: "RESOLVED",
      result_color: result
    })
    .eq("id", roundId);

  await supabase.from("round_results_history").insert({
    round_id: roundId,
    color: result
  });

  console.log("🟣 Round resolved in Supabase");
}
