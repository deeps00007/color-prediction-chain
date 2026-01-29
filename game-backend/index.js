import { runRoundEngine } from "./roundEngine.js";

console.log("🎮 Color game engine started");

setInterval(async () => {
  try {
    await runRoundEngine();
  } catch (err) {
    console.error("Engine error:", err);
  }
}, 1000);
