import { Router } from "express";
import { fetchDailyPrices } from "../services/tiingo.js";
import { cleanDailySeries, toLogReturns } from "../services/cleaning.js";
import {
  mean,
  std,
  annualizedVolatility,
  pearsonCorrelation,
  correlationMatrix,
  rollingStats,
} from "../services/stats.js";

const router = Router();

const MAX_TICKERS = 8;

function intersectDates(seriesByTicker) {
  const tickers = Object.keys(seriesByTicker);
  const dates = new Set(seriesByTicker[tickers[0]].map((r) => r.date));
  for (const t of tickers.slice(1)) {
    const set = new Set(seriesByTicker[t].map((r) => r.date));
    for (const d of dates) {
      if (!set.has(d)) dates.delete(d);
    }
  }
  return [...dates].sort();
}

router.get("/", async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    let window = parseInt(req.query.window, 10);
    if (!Number.isFinite(window) || window < 2) window = 30;

    const rawTickers = String(req.query.tickers || "")
      .split(",")
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean);

    if (rawTickers.length < 2) {
      return res.status(400).json({
        error: "Missing required query parameter: tickers (comma-separated, at least 2)",
      });
    }
    if (rawTickers.length > MAX_TICKERS) {
      return res.status(400).json({ error: `Maximum ${MAX_TICKERS} tickers allowed` });
    }
    const tickers = [...new Set(rawTickers)];

    const rawByTicker = {};
    for (const t of tickers) {
      const rows = await fetchDailyPrices({ ticker: t, startDate, endDate });
      rawByTicker[t] = cleanDailySeries(rows);
    }

    const cleanedByTicker = {};
    for (const t of tickers) cleanedByTicker[t] = rawByTicker[t].cleaned;

    const dates = intersectDates(cleanedByTicker);
    if (dates.length < 5) {
      return res.status(404).json({
        error: "Not enough overlapping trading dates across the selected tickers",
      });
    }

    const priceByDate = {};
    for (const d of dates) {
      priceByDate[d] = {};
      for (const t of tickers) {
        const row = cleanedByTicker[t].find((r) => r.date === d);
        priceByDate[d][t] = row ? row.close : null;
      }
    }

    const prices = dates.map((d) => ({ date: d, ...priceByDate[d] }));
    const returnsSeries = dates
      .filter((_, i) => i > 0)
      .map((d, i) => {
        const prev = priceByDate[dates[i]];
        const cur = priceByDate[d];
        const point = { date: d };
        for (const t of tickers) {
          point[t] =
            prev[t] && cur[t] && prev[t] > 0 ? Math.log(cur[t] / prev[t]) : null;
        }
        return point;
      });

    const returnsByTicker = {};
    for (const t of tickers) {
      returnsByTicker[t] = returnsSeries.map((p) => p[t]).filter((v) => v !== null);
    }

    const corr = correlationMatrix(returnsByTicker);

    const rollingCorrelation = [];
    for (let a = 0; a < tickers.length; a += 1) {
      for (let b = a + 1; b < tickers.length; b += 1) {
        const ra = returnsByTicker[tickers[a]];
        const rb = returnsByTicker[tickers[b]];
        const rs = rollingStats(ra, window);
        const points = rs.map((_, i) => ({
          date: returnsSeries[i + window - 1].date,
          value: pearsonCorrelation(
            ra.slice(i, i + window),
            rb.slice(i, i + window)
          ),
        }));
        rollingCorrelation.push({ pair: `${tickers[a]}-${tickers[b]}`, points });
      }
    }

    const portfolioReturns = returnsSeries.map((p, i) => {
      const vals = tickers.map((t) => p[t]).filter((v) => v !== null);
      return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
    });

    const validPortfolioReturns = portfolioReturns.filter((v) => v !== null);
    const portfolioVolatility = rollingStats(validPortfolioReturns, window).map(
      (r, i) => ({
        date: returnsSeries[i + window - 1].date,
        volatility: r.volatility,
        mean: r.mean,
      })
    );

    const portfolioStats = {
      observations: dates.length,
      meanReturn: mean(validPortfolioReturns),
      volatility: annualizedVolatility(validPortfolioReturns),
      sharpe: mean(validPortfolioReturns) / (std(validPortfolioReturns) || 1),
    };

    res.json({
      tickers,
      prices,
      returns: returnsSeries,
      correlation: corr,
      rollingCorrelation,
      portfolioVolatility,
      portfolioStats,
      rollingWindow: window,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
