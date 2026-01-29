import { supabase } from "./supabase.js";
import { generateColor } from "./probabilities.js";

const ROUND_DURATION = Number(process.env.ROUND_DURATION_SECONDS);

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

  console.log("🟣 Round resolved:", roundId, "→", result);
}
