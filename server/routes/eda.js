import { Router } from "express";
import { fetchDailyPrices } from "../services/tiingo.js";
import { cleanDailySeries, toLogReturns } from "../services/cleaning.js";
import {
  mean,
  skewness,
  kurtosis,
  quantile,
  minMax,
  annualizedVolatility,
  histogram,
  kdeAtPoints,
  qqPlotData,
  rollingStats,
} from "../services/stats.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { ticker, startDate, endDate } = req.query;
    let window = parseInt(req.query.window, 10);
    if (!Number.isFinite(window) || window < 2) window = 30;

    if (!ticker) {
      return res.status(400).json({ error: "Missing required query parameter: ticker" });
    }

    const rows = await fetchDailyPrices({ ticker, startDate, endDate });
    const { cleaned, stats } = cleanDailySeries(rows);

    if (cleaned.length < 5) {
      return res.status(404).json({
        error: `Not enough data points for ${ticker.toUpperCase()} to run EDA`,
      });
    }

    const closes = cleaned.map((r) => r.close);
    const returns = toLogReturns(closes);
    const sortedReturns = [...returns].sort((a, b) => a - b);

    const summary = {
      ticker: ticker.toUpperCase(),
      observations: cleaned.length,
      returnObservations: returns.length,
      startDate: cleaned[0].date,
      endDate: cleaned[cleaned.length - 1].date,
      meanReturn: mean(returns),
      volatility: annualizedVolatility(returns),
      skewness: skewness(returns),
      kurtosis: kurtosis(returns),
      min: minMax(closes).min,
      max: minMax(closes).max,
      lastClose: closes[closes.length - 1],
      firstClose: closes[0],
      totalReturnPct: ((closes[closes.length - 1] / closes[0]) - 1) * 100,
      percentiles: {
        q1: quantile(sortedReturns, 0.25),
        median: quantile(sortedReturns, 0.5),
        q3: quantile(sortedReturns, 0.75),
      },
    };

    const hist = histogram(returns);
    // Evaluate the KDE at the histogram bin centers so both are
    // aligned on the same x and y (density) scale.
    const kde = kdeAtPoints(returns, hist.bins);
    const qq = qqPlotData(returns);
    const rolling = rollingStats(returns, window).map((r, i) => ({
      date: cleaned[i + window - 1].date,
      mean: r.mean,
      volatility: r.volatility,
    }));

    res.json({
      ticker: summary.ticker,
      summary,
      cleaningStats: stats,
      series: cleaned,
      returns: returns.map((r, i) => ({ date: cleaned[i + 1].date, value: r })),
      histogram: hist.bins.map((b, i) => ({ bin: b, density: hist.density[i] })),
      kde,
      qq,
      rolling,
      rollingWindow: window,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
