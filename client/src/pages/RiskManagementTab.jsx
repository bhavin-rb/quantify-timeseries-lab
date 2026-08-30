import { useState, useCallback, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { apiGet, formatUsd, formatPct } from "../api.js";
import ChartTooltip from "../components/ChartTooltip.jsx";
import { FiAlertTriangle, FiRotateCcw, FiShield } from "react-icons/fi";

function parseTickers(value) {
  return String(value || "")
    .split(",")
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);
}

function Loading({ text }) {
  return (
    <div className="loading">
      <div className="spinner" />
      <span>{text}</span>
    </div>
  );
}

function RiskChart({ series, stopLoss, target }) {
  const prices = series.map((d) => d.close);
  let lo = Math.min(...prices, stopLoss, target);
  let hi = Math.max(...prices, stopLoss, target);
  if (!Number.isFinite(lo)) lo = 0;
  if (!Number.isFinite(hi)) hi = 1;
  const pad = (hi - lo) * 0.08 || 1;

  return (
    <div className="chart-wrap risk-chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series} margin={{ top: 26, right: 16, bottom: 52, left: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.45} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            minTickGap={42}
            stroke="var(--text-muted)"
            label={{ value: "Date", position: "insideBottom", offset: -8, fill: "var(--text-muted)", fontSize: 12 }}
          />
          <YAxis
            domain={[lo - pad, hi + pad]}
            tick={{ fontSize: 11 }}
            stroke="var(--text-muted)"
            width={64}
            tickFormatter={(v) => `$${Number(v).toFixed(2)}`}
            label={{ value: "Price (USD)", angle: -90, position: "insideLeft", offset: 10, fill: "var(--text-muted)", fontSize: 12 }}
          />
          <Tooltip content={<ChartTooltip formatter={(v) => `$${Number(v).toFixed(2)}`} />} />
          <ReferenceLine
            y={stopLoss}
            stroke="var(--danger)"
            strokeDasharray="6 4"
            strokeWidth={1.5}
            label={{ value: `Sell if price ≤ ${formatUsd(stopLoss)}`, position: "left", fill: "var(--danger)", fontSize: 11 }}
          />
          <ReferenceLine
            y={target}
            stroke="var(--success)"
            strokeDasharray="6 4"
            strokeWidth={1.5}
            label={{ value: `Take profit if price ≥ ${formatUsd(target)}`, position: "right", fill: "var(--success)", fontSize: 11 }}
          />
          <Line
            type="monotone"
            dataKey="close"
            name="Close"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={false}
            animationDuration={700}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function computeLevels(item, input) {
  const last = item.latestPrice;
  let stopPrice;
  let targetPrice;

  if (!input) {
    stopPrice = item.stopLossPrice;
    targetPrice = item.targetPrice;
  } else if (input.mode === "price") {
    const s = Number(input.stop);
    const t = Number(input.target);
    stopPrice = Number.isFinite(s) ? s : item.stopLossPrice;
    targetPrice = Number.isFinite(t) ? t : item.targetPrice;
  } else {
    const sp = Number(input.stop);
    const tp = Number(input.target);
    const stopPct = Number.isFinite(sp) ? sp : item.defaultStopLossPct * 100;
    const targetPct = Number.isFinite(tp) ? tp : item.defaultTargetPct * 100;
    stopPrice = last * (1 - stopPct / 100);
    targetPrice = last * (1 + targetPct / 100);
  }

  const riskReward =
    last > stopPrice && targetPrice > last
      ? (targetPrice - last) / (last - stopPrice)
      : null;

  return { stopPrice, targetPrice, riskReward };
}

export default function RiskManagementTab({ tickers, startDate, endDate, resetAll }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [inputs, setInputs] = useState({});

  const tickerList = parseTickers(tickers);

  const run = useCallback(
    async (list) => {
      if (!list.length) return;
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ tickers: list.join(",") });
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
        const result = await apiGet(`/risk?${params.toString()}`);
        setData(result);
        const next = {};
        for (const it of result.items) {
          next[it.ticker] = {
            mode: "pct",
            stop: (it.defaultStopLossPct * 100).toFixed(1),
            target: (it.defaultTargetPct * 100).toFixed(1),
          };
        }
        setInputs(next);
      } catch (e) {
        setError(e.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [startDate, endDate]
  );

  useEffect(() => {
    run(tickerList);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickers, startDate, endDate]);

  const update = useCallback((ticker, field, value) => {
    setInputs((prev) => ({ ...prev, [ticker]: { ...prev[ticker], [field]: value } }));
  }, []);

  const toggleMode = useCallback(
    (item, input) => {
      const nextMode = input.mode === "pct" ? "price" : "pct";
      const nStop = Number(input.stop);
      const nTarget = Number(input.target);
      let stopVal;
      let targetVal;

      if (nextMode === "price") {
        const stopPct = Number.isFinite(nStop) ? nStop : item.defaultStopLossPct * 100;
        const targetPct = Number.isFinite(nTarget) ? nTarget : item.defaultTargetPct * 100;
        stopVal = (item.latestPrice * (1 - stopPct / 100)).toFixed(2);
        targetVal = (item.latestPrice * (1 + targetPct / 100)).toFixed(2);
      } else {
        stopVal = Number.isFinite(nStop)
          ? ((1 - nStop / item.latestPrice) * 100).toFixed(1)
          : (item.defaultStopLossPct * 100).toFixed(1);
        targetVal = Number.isFinite(nTarget)
          ? ((nTarget / item.latestPrice - 1) * 100).toFixed(1)
          : (item.defaultTargetPct * 100).toFixed(1);
      }

      update(item.ticker, "mode", nextMode);
      update(item.ticker, "stop", stopVal);
      update(item.ticker, "target", targetVal);
    },
    [update]
  );

  return (
    <>
      <div className="controls" style={{ justifyContent: "center" }}>
        <span className="risk-hint">
          <FiShield size={14} /> Stop-loss &amp; target levels per ticker — defaults auto-calculated from
          price and volatility. Override anytime.
        </span>
        <button className="btn btn-reset" onClick={resetAll}>
          <FiRotateCcw size={14} /> Reset
        </button>
      </div>

      {error && <div className="error-banner"><FiAlertTriangle size={16} /> {error}</div>}
      {loading && <Loading text="Computing stop-loss and target levels…" />}

      {data && data.items.length > 0 && (
        <div className="grid grid-2 risk-grid">
          {data.items.map((item) => {
            const input = inputs[item.ticker];
            const { stopPrice, targetPrice, riskReward } = computeLevels(item, input);
            return (
              <div className="card risk-card" key={item.ticker}>
                <div className="risk-header">
                  <span className="risk-ticker">{item.ticker}</span>
                  <span className="risk-meta">
                    Last {formatUsd(item.latestPrice)} · Ann. vol {formatPct(item.volatility)}
                  </span>
                </div>

                <div className="risk-controls">
                  <div className="risk-field">
                    <label>Stop-Loss 🔴</label>
                    <div className="risk-input-wrap">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={input?.stop ?? ""}
                        placeholder={formatUsd(item.stopLossPrice)}
                        onChange={(e) => update(item.ticker, "stop", e.target.value)}
                      />
                      {input?.mode === "pct" && <span className="risk-suffix">%</span>}
                    </div>
                  </div>

                  <div className="risk-toggle" role="group" aria-label="Input mode">
                    <button
                      className={`${input?.mode === "pct" ? "active" : ""}`}
                      onClick={() => toggleMode(item, input)}
                      aria-pressed={input?.mode === "pct"}
                    >
                      %
                    </button>
                    <button
                      className={`${input?.mode === "price" ? "active" : ""}`}
                      onClick={() => toggleMode(item, input)}
                      aria-pressed={input?.mode === "price"}
                    >
                      $
                    </button>
                  </div>

                  <div className="risk-field">
                    <label>Target 🟢</label>
                    <div className="risk-input-wrap">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={input?.target ?? ""}
                        placeholder={formatUsd(item.targetPrice)}
                        onChange={(e) => update(item.ticker, "target", e.target.value)}
                      />
                      {input?.mode === "pct" && <span className="risk-suffix">%</span>}
                    </div>
                  </div>
                </div>

                <div className="risk-summary">
                  <span className="risk-chip risk-stop">
                    <span className="risk-dot stop" /> Stop-Loss {formatUsd(stopPrice)}
                  </span>
                  <span className="risk-chip risk-target">
                    <span className="risk-dot target" /> Target {formatUsd(targetPrice)}
                  </span>
                  <span className="risk-chip risk-rr">
                    Risk/Reward {riskReward != null ? `1 : ${riskReward.toFixed(2)}` : "—"}
                  </span>
                </div>

                <RiskChart
                  series={item.series}
                  stopLoss={stopPrice}
                  target={targetPrice}
                />
              </div>
            );
          })}
        </div>
      )}

      {!data && !loading && !error && (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <p className="sub" style={{ fontSize: "1rem" }}>
            No tickers to manage. Run an analysis in the <strong>Single Ticker</strong> or{" "}
            <strong>Portfolio</strong> tab first.
          </p>
        </div>
      )}
    </>
  );
}