import { runRoundEngine } from "./roundEngine.js";
import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

console.log("🎮 Color game engine started");

// Health check endpoint for Render
app.get("/", (req, res) => {
  res.json({ 
    status: "running", 
    message: "Color Prediction Game Backend - Round Engine Active"
  });
});

app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Start HTTP server (required for Render Web Service)
app.listen(PORT, () => {
  console.log(`🌐 HTTP server listening on port ${PORT}`);
});

// Game round engine loop
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
