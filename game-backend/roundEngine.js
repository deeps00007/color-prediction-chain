import { supabase } from "./supabase.js";
import { generateColor } from "./probabilities.js";

const ROUND_DURATION = Number(process.env.ROUND_DURATION_SECONDS);

export async function runRoundEngine() {
  const now = new Date();

  // 1️⃣ Check if there is an active round
  const { data: currentRound } = await supabase
    .from("rounds")
    .select("*")
    .order("id", { ascending: false })
    .limit(1)
    .single();

  // 2️⃣ If no round exists → create first round
  if (!currentRound) {
    await createNewRound();
    return;
  }

  // 3️⃣ Handle OPEN → CLOSED
  if (
    currentRound.status === "OPEN" &&
    now >= new Date(currentRound.end_time)
  ) {
    await closeRound(currentRound.id);
    return;
  }

  // 4️⃣ Handle CLOSED → RESOLVED
  if (currentRound.status === "CLOSED") {
    await resolveRound(currentRound.id);
    return;
  }

  // 5️⃣ Handle RESOLVED → NEW ROUND
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
