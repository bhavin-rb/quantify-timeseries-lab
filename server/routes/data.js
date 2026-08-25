import { Router } from "express";
import { fetchDailyPrices } from "../services/tiingo.js";
import { cleanDailySeries } from "../services/cleaning.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { ticker, startDate, endDate } = req.query;
    if (!ticker) {
      return res.status(400).json({ error: "Missing required query parameter: ticker" });
    }

    const rows = await fetchDailyPrices({ ticker, startDate, endDate });
    const { cleaned, stats } = cleanDailySeries(rows);

    if (cleaned.length === 0) {
      return res.status(404).json({
        error: `No usable price data found for ${ticker.toUpperCase()} in the requested range`,
      });
    }

    const schema = Object.keys(cleaned[0]);
    res.json({
      ticker: ticker.toUpperCase(),
      rawCount: stats.totalRaw,
      schema,
      stats,
      cleaned,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
