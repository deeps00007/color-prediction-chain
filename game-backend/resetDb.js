import { supabase } from "./supabase.js";

async function resetDatabase() {
  console.log("🗑️ Clearing database...");

  // 1. Delete round history
  const { error: err1 } = await supabase
    .from("round_results_history")
    .delete()
    .gt("id", 0); // Delete all rows where id > 0

  if (err1) console.error("❌ Error clearing history:", err1.message);
  else console.log("✅ Cleared round_results_history");

  // 2. Delete rounds
  const { error: err2 } = await supabase
    .from("rounds")
    .delete()
    .gt("id", 0);

  if (err2) console.error("❌ Error clearing rounds:", err2.message);
  else console.log("✅ Cleared rounds");
  
  console.log("✨ Database reset complete!");
  process.exit(0);
}

resetDatabase();