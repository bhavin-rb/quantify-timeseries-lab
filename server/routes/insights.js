import { Router } from "express";
import { fetchDailyPrices } from "../services/tiingo.js";
import { cleanDailySeries } from "../services/cleaning.js";
import {
  mean,
  std,
  annualizedVolatility,
  cumulativeReturns,
  cumulativeReturnPct,
  drawdownCurve,
  maxDrawdown,
  sortinoRatio,
  beta,
  rollingSharpe,
  rollingStats,
  contributionToVolatility,
} from "../services/stats.js";

const router = Router();

const MAX_TICKERS = 8;
const BENCHMARK_TICKER = "SPY";

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

    const tickersWithBench = [...new Set([...tickers, BENCHMARK_TICKER])];

    const rawByTicker = {};
    for (const t of tickersWithBench) {
      const rows = await fetchDailyPrices({ ticker: t, startDate, endDate });
      rawByTicker[t] = cleanDailySeries(rows);
    }

    const cleanedByTicker = {};
    for (const t of tickersWithBench) cleanedByTicker[t] = rawByTicker[t].cleaned;

    const dates = intersectDates(cleanedByTicker);
    if (dates.length < 5) {
      return res.status(404).json({
        error: "Not enough overlapping trading dates across the selected tickers",
      });
    }

    const priceByDate = {};
    for (const d of dates) {
      priceByDate[d] = {};
      for (const t of tickersWithBench) {
        const row = cleanedByTicker[t].find((r) => r.date === d);
        priceByDate[d][t] = row ? row.close : null;
      }
    }

    const returnsSeries = dates
      .filter((_, i) => i > 0)
      .map((d, i) => {
        const prev = priceByDate[dates[i]];
        const cur = priceByDate[d];
        const point = { date: d };
        for (const t of tickersWithBench) {
          point[t] =
            prev[t] && cur[t] && prev[t] > 0 ? Math.log(cur[t] / prev[t]) : null;
        }
        return point;
      });

    const returnsByTicker = {};
    for (const t of tickersWithBench) {
      returnsByTicker[t] = returnsSeries.map((p) => p[t]).filter((v) => v !== null);
    }

    const portfolioReturns = returnsSeries.map((p) => {
      const vals = tickers.map((t) => p[t]).filter((v) => v !== null);
      return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
    }).filter((v) => v !== null);

    const benchmarkReturns = returnsSeries.map((p) => p[BENCHMARK_TICKER]).filter((v) => v !== null);
    const commonLen = Math.min(portfolioReturns.length, benchmarkReturns.length);
    const pRet = portfolioReturns.slice(0, commonLen);
    const bRet = benchmarkReturns.slice(0, commonLen);

    const cumReturns = cumulativeReturns(portfolioReturns);
    const cumReturnPct = cumulativeReturnPct(portfolioReturns);
    const dd = drawdownCurve(portfolioReturns);
    const mdd = maxDrawdown(portfolioReturns);
    const sortino = sortinoRatio(portfolioReturns);
    const betaVal = beta(pRet, bRet);

    const rolling = rollingStats(portfolioReturns, window);
    const rollingSharpeData = [];
    for (let i = 0; i < portfolioReturns.length; i += 1) {
      if (i + 1 < window) continue;
      const slice = portfolioReturns.slice(i - window + 1, i + 1);
      const m = mean(slice);
      const s = std(slice);
      const annReturn = m * 252;
      const annVol = s * Math.sqrt(252);
      rollingSharpeData.push({
        date: returnsSeries[i + 1]?.date || "",
        sharpe: annVol === 0 ? 0 : annReturn / annVol,
      });
    }

    const rollingVolData = rolling.map((r, i) => ({
      date: returnsSeries[i + window]?.date || "",
      volatility: r.volatility,
    }));

    const cumReturnCurve = cumReturns.slice(1).map((v, i) => ({
      date: returnsSeries[i]?.date || "",
      cumulative: (v - 1) * 100,
    }));

    const drawdownCurveData = dd.slice(1).map((v, i) => ({
      date: returnsSeries[i]?.date || "",
      drawdown: v * 100,
    }));

    const benchCumReturns = cumulativeReturns(benchmarkReturns);
    const benchCumReturnCurve = benchCumReturns.slice(1).map((v, i) => ({
      date: returnsSeries[i + 1]?.date || "",
      cumulative: (v - 1) * 100,
    }));

    const contributionData = contributionToVolatility(
      Object.fromEntries(tickers.map((t) => [t, returnsByTicker[t]])),
      window
    );
    const contributionWithDates = contributionData.map((c, i) => ({
      date: returnsSeries[i + window]?.date || "",
      ...c.contributions,
    }));

    res.json({
      tickers,
      benchmark: BENCHMARK_TICKER,
      summary: {
        maxDrawdown: mdd,
        cumulativeReturn: cumReturnPct,
        sortino,
        beta: betaVal,
        observations: portfolioReturns.length,
      },
      cumulativeReturnCurve: cumReturnCurve,
      benchmarkCumulativeReturnCurve: benchCumReturnCurve,
      drawdownCurve: drawdownCurveData,
      rollingSharpe: rollingSharpeData,
      rollingVolatility: rollingVolData,
      contributionToVolatility: contributionWithDates,
      rollingWindow: window,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
