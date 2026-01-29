import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_PUBLIC_ANON_KEY";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentRound = null;

// ---- FETCH CURRENT ROUND ----
async function loadCurrentRound() {
  const { data } = await supabase
    .from("rounds")
    .select("*")
    .order("id", { ascending: false })
    .limit(1);

  if (!data || data.length === 0) return;

  currentRound = data[0];
  renderRound();
}

// ---- FETCH HISTORY ----
async function loadHistory() {
  const { data } = await supabase
    .from("round_results_history")
    .select("*")
    .order("id", { ascending: false })
    .limit(10);

  const historyEl = document.getElementById("history");
  historyEl.innerHTML = "";

  data.reverse().forEach(r => {
    const dot = document.createElement("span");
    dot.style.background =
      r.color === "RED" ? "red" :
      r.color === "GREEN" ? "green" : "violet";
    historyEl.appendChild(dot);
  });
}

// ---- TIMER ----
function startTimer() {
  setInterval(() => {
    if (!currentRound) return;

    if (currentRound.status !== "OPEN") {
      document.getElementById("timer").innerText = "-";
      return;
    }

    const end = new Date(currentRound.end_time).getTime();
    const now = Date.now();
    const left = Math.floor((end - now) / 1000);

    document.getElementById("timer").innerText =
      left > 0 ? left : 0;
  }, 1000);
}

// ---- RENDER ----
function renderRound() {
  document.getElementById("roundId").innerText = currentRound.id;
  document.getElementById("status").innerText = currentRound.status;
  document.getElementById("result").innerText =
    currentRound.result_color ?? "-";
}

// ---- REALTIME LISTENERS ----
supabase
  .channel("rounds-updates")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "rounds" },
    payload => {
      currentRound = payload.new;
      renderRound();
    }
  )
  .subscribe();

supabase
  .channel("history-updates")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "round_results_history" },
    loadHistory
  )
  .subscribe();

// ---- INIT ----
loadCurrentRound();
loadHistory();
startTimer();
