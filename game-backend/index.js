import { runRoundEngine } from "./roundEngine.js";

console.log("🎮 Color game engine started");

let isProcessing = false;

setInterval(async () => {
  if (isProcessing) return;
  isProcessing = true;
  
  try {
    await runRoundEngine();
  } catch (err) {
    console.error("Engine error:", err);
  } finally {
    isProcessing = false;
  }
}, 1000);
