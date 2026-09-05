import { Router } from "express";
import { searchTickers } from "../services/tiingo.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query || !String(query).trim()) {
      return res.status(400).json({ error: "Missing required query parameter: query" });
    }
    const results = await searchTickers(query);
    res.json(results);
  } catch (err) {
    next(err);
  }
});

export default router;