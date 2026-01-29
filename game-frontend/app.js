import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://zskfvqfszulwuhshzuxa.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2Z2cWZzenVsd3Voc2h6dXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MDE4NDYsImV4cCI6MjA4NTE3Nzg0Nn0.wAWewC_OZmLUK9DZmJy-YB63l_OA5sTn_Lu0yxY5r2U";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentRound = null;

// ---- LOAD CURRENT ROUND ----
async function loadCurrentRound() {
  const { data } = await supabase
    .from("rounds")
    .select("*")
    .order("id", { ascending: false })
    .limit(1);

  if (!data || data.length === 0) return;

  currentRound = data[0];
  render();
}

// ---- LOAD HISTORY ----
async function loadHistory() {
  const { data } = await supabase
    .from("round_results_history")
    .select("*")
    .order("id", { ascending: false })
    .limit(10);

  const history = document.getElementById("history");
  history.innerHTML = "";

  if (!data) return;

  data.reverse().forEach(r => {
    const dot = document.createElement("span");
    dot.style.background =
      r.color === "RED" ? "red" :
      r.color === "GREEN" ? "green" : "violet";
    history.appendChild(dot);
  });
}

// ---- TIMER ----
setInterval(() => {
  if (!currentRound || currentRound.status !== "OPEN") {
    document.getElementById("timer").innerText = "-";
    return;
  }

  const end = new Date(currentRound.end_time).getTime();
  const left = Math.max(0, Math.floor((end - Date.now()) / 1000));
  document.getElementById("timer").innerText = left;
}, 1000);

// ---- RENDER ----
function render() {
  document.getElementById("roundId").innerText = currentRound.id;
  document.getElementById("status").innerText = currentRound.status;
  document.getElementById("result").innerText =
    currentRound.result_color ?? "-";
}

// ---- REALTIME ----
// ---- REALTIME: ROUNDS ----
supabase
  .channel("rounds-realtime")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "rounds",
    },
    async () => {
      console.log("🔄 Rounds changed → reloading current round");
      await loadCurrentRound();
    }
  )
  .subscribe();

// ---- REALTIME: HISTORY ----
supabase
  .channel("history-realtime")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "round_results_history",
    },
    () => {
      console.log("🟣 History update");
      loadHistory();
    }
  )
  .subscribe();
// ---- INIT ----
loadCurrentRound();
loadHistory();
