// server.js (ESM)
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import geminiRouter from "./gemini-proxy.js";

dotenv.config();

const app = express();

// Body parser BEFORE routes
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(cors());

// Mount the Gemini router at /api/gemini
app.use("/api/gemini", geminiRouter);

// Static serve (optional) — adjust 'dist' if your build output differs
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, "dist");
app.use(express.static(distDir));

// Use a RegExp to serve index.html for SPA routes (avoids wildcard parsing issues)
app.get(/^\/.*$/, (req, res) => {
  res.sendFile(path.join(distDir, "index.html"), (err) => {
    if (err) {
      console.error("Error sending index.html:", err);
      res.status(500).send("Server error");
    }
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
