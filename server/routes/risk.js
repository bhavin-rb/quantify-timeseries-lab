import { Router } from "express";
import { fetchDailyPrices } from "../services/tiingo.js";
import { cleanDailySeries, toLogReturns } from "../services/cleaning.js";
import { annualizedVolatility } from "../services/stats.js";

const router = Router();

const MAX_TICKERS = 8;

router.get("/", async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const rawTickers = String(req.query.tickers || "")
      .split(",")
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean);

    if (rawTickers.length === 0) {
      return res.status(400).json({
        error: "Missing required query parameter: tickers (comma-separated)",
      });
    }
    if (rawTickers.length > MAX_TICKERS) {
      return res.status(400).json({ error: `Maximum ${MAX_TICKERS} tickers allowed` });
    }
    const tickers = [...new Set(rawTickers)];

    const items = [];
    for (const t of tickers) {
      const rows = await fetchDailyPrices({ ticker: t, startDate, endDate });
      const { cleaned } = cleanDailySeries(rows);
      if (cleaned.length < 5) {
        const err = new Error(`Not enough price data for ${t} in the requested range`);
        err.status = 404;
        throw err;
      }
      const closes = cleaned.map((r) => r.close);
      const latestPrice = closes[closes.length - 1];
      const vol = annualizedVolatility(toLogReturns(closes));
      // Stop-loss: 10% below current price or 1x annualized volatility (whichever is larger).
      const defaultStopLossPct = Math.max(0.1, vol);
      // Target: 20% above current price or 2x the stop-loss distance (whichever is larger).
      const defaultTargetPct = Math.max(0.2, 2 * defaultStopLossPct);
      items.push({
        ticker: t,
        latestPrice,
        volatility: vol,
        defaultStopLossPct,
        defaultTargetPct,
        stopLossPrice: latestPrice * (1 - defaultStopLossPct),
        targetPrice: latestPrice * (1 + defaultTargetPct),
        series: cleaned,
      });
    }

    res.json({ tickers, items });
  } catch (err) {
    next(err);
  }
});

export default router;