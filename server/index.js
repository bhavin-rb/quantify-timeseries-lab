import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import dataRouter from "./routes/data.js";
import edaRouter from "./routes/eda.js";
import portfolioRouter from "./routes/portfolio.js";
import insightsRouter from "./routes/insights.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "TimeSeries Lab API",
    time: new Date().toISOString(),
  });
});

app.use("/api/data", dataRouter);
app.use("/api/eda", edaRouter);
app.use("/api/portfolio", portfolioRouter);
app.use("/api/insights", insightsRouter);

app.use("/api", (req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

const distPath = path.resolve(__dirname, "../client/dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`TimeSeries Lab API listening on http://localhost:${PORT}`);
});
