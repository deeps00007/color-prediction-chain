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
  let blockchainSuccess = false;
  try {
    if (contract) {
      console.log(`   Calling blockchain contract.resolveRound(${roundId}, ${COLOR_MAP[result]})...`);
      
      // Get current gas price and add 20% buffer for faster confirmation
      const feeData = await provider.getFeeData();
      const maxFeePerGas = (feeData.maxFeePerGas * 120n) / 100n;
      const maxPriorityFeePerGas = (feeData.maxPriorityFeePerGas * 120n) / 100n;
      
      const tx = await contract.resolveRound(roundId, COLOR_MAP[result], {
        maxFeePerGas,
        maxPriorityFeePerGas
      });
      console.log(`   Transaction sent: ${tx.hash}`);
      
      // Wait for confirmation with timeout
      const receipt = await tx.wait(1, 30000); // Wait 1 confirmation, 30s timeout
      console.log(`⛓️ Blockchain resolved in block ${receipt.blockNumber}, winners paid!`);
      blockchainSuccess = true;
    } else {
      console.error("❌ Contract not initialized!");
    }
  } catch (err) {
    console.error("❌ Blockchain resolution failed:", err.shortMessage || err.message);
    console.log("⚠️  Round will only be marked in Supabase, NO PAYOUTS SENT!");
  }

  // 2️⃣ Update Supabase
  const { error: updateError } = await supabase
    .from("rounds")
    .update({
      status: "RESOLVED",
      result_color: result
    })
    .eq("id", roundId);

  if (updateError) console.error("❌ Supabase update error:", updateError);

  const { error: historyError } = await supabase.from("round_results_history").insert({
    round_id: roundId,
    color: result
  });

  if (historyError) console.error("❌ Supabase history insert error:", historyError);

  // 3️⃣ Additional history save attempt (Robustness)
  // Sometimes single inserts fail if table triggers are weird.
  // We log success here.
  if(!historyError) console.log("✅ History saved to Supabase");

  if (blockchainSuccess) {
    console.log("✅ Round fully resolved (Blockchain + Supabase)");
  } else {
    console.log("🟡 Round resolved in Supabase only (NO BLOCKCHAIN PAYOUTS)");
  }
}
