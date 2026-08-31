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

// Places the annotation text directly on top of the reference line, centered
// horizontally. `viewBox.y` is the pixel position of the line, so the label
// tracks the line automatically when Stop-Loss / Target are overridden.
function LineAnnotation({ viewBox, text, color }) {
  if (!viewBox) return null;
  const cx = viewBox.x + viewBox.width / 2;
  return (
    <text
      className="risk-line-label"
      x={cx}
      y={viewBox.y}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={10.5}
      fontWeight={700}
      letterSpacing={0.2}
      fill={color}
      stroke="var(--bg-card)"
      strokeWidth={5}
      strokeLinejoin="round"
      paintOrder="stroke"
      style={{ userSelect: "none", pointerEvents: "none" }}
    >
      {text}
    </text>
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
            label={<LineAnnotation text={`Sell if price ≤ ${formatUsd(stopLoss)}`} color="var(--danger)" />}
          />
          <ReferenceLine
            y={target}
            stroke="var(--success)"
            strokeDasharray="6 4"
            strokeWidth={1.5}
            label={<LineAnnotation text={`Take profit if price ≥ ${formatUsd(target)}`} color="var(--success)" />}
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

function RiskCardBody({ item, input, levels, onUpdate, onToggleMode }) {
  return (
    <>
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
              onChange={(e) => onUpdate(item.ticker, "stop", e.target.value)}
            />
            {input?.mode === "pct" && <span className="risk-suffix">%</span>}
          </div>
        </div>

        <div className="risk-toggle" role="group" aria-label="Input mode">
          <button
            className={`${input?.mode === "pct" ? "active" : ""}`}
            onClick={onToggleMode}
            aria-pressed={input?.mode === "pct"}
          >
            %
          </button>
          <button
            className={`${input?.mode === "price" ? "active" : ""}`}
            onClick={onToggleMode}
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
              onChange={(e) => onUpdate(item.ticker, "target", e.target.value)}
            />
            {input?.mode === "pct" && <span className="risk-suffix">%</span>}
          </div>
        </div>
      </div>

      <div className="risk-summary">
        <span className="risk-chip risk-stop">
          <span className="risk-dot stop" /> Stop-Loss {formatUsd(levels.stopPrice)}
        </span>
        <span className="risk-chip risk-target">
          <span className="risk-dot target" /> Target {formatUsd(levels.targetPrice)}
        </span>
        <span className="risk-chip risk-rr">
          Risk/Reward {levels.riskReward != null ? `1 : ${levels.riskReward.toFixed(2)}` : "—"}
        </span>
      </div>
    </>
  );
}

function RiskExplanation({ item, levels }) {
  const { latestPrice, ticker } = item;
  const { stopPrice, targetPrice, riskReward } = levels;

  return (
    <details className="risk-explanation">
      <summary>What do these levels mean for {ticker}?</summary>
      <div className="risk-explanation-body">
        <p>
          The current price of <strong>{ticker}</strong> is{" "}
          <strong>{formatUsd(latestPrice)}</strong>.
        </p>

        <div className="risk-explanation-item">
          <span className="risk-explanation-dot stop" />
          <p>
            <strong>Stop-Loss ({formatUsd(stopPrice)}):</strong> If price falls to{" "}
            {formatUsd(stopPrice)} or lower, you should sell to avoid bigger losses.
          </p>
        </div>

        <div className="risk-explanation-item">
          <span className="risk-explanation-dot target" />
          <p>
            <strong>Target ({formatUsd(targetPrice)}):</strong> If price rises to{" "}
            {formatUsd(targetPrice)} or higher, you can take profit and lock in gains.
          </p>
        </div>

        <p>
          <strong>Risk / Reward:</strong>{" "}
          {riskReward != null
            ? `For every $1 you risk, you aim to make $${riskReward.toFixed(2)}.`
            : "The target is currently set below your entry price — adjust your levels to get a meaningful ratio."}
        </p>

        <p>
          <strong>Hold / Sell:</strong> Hold as long as price stays between the
          stop-loss and target. Sell if it hits either boundary.
        </p>

        <p>
          <strong>Short selling:</strong> For short positions, reverse the logic —
          profit if price falls below the stop-loss, cut losses if it rises above
          the target.
        </p>
      </div>
    </details>
  );
}

export default function RiskManagementTab({
  tickers,
  startDate,
  endDate,
  resetAll,
  mode = "single",
  analyzedSingle = false,
  analyzedPortfolio = false,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [inputs, setInputs] = useState({});

  const tickerList = parseTickers(tickers);
  const isSingle = mode === "single";
  // Sync with the active mode: Single Ticker mode only manages the first ticker,
  // Portfolio mode manages every ticker. Risk Management never shows data from a
  // mode that has not been analyzed in the dashboard yet.
  const activeTickers = isSingle ? tickerList.slice(0, 1) : tickerList;
  const canRun = (isSingle ? analyzedSingle : analyzedPortfolio) && activeTickers.length > 0;

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
    if (!canRun) {
      setData(null);
      setInputs({});
      setError("");
      setLoading(false);
      return;
    }
    run(activeTickers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTickers.join(","), startDate, endDate, canRun]);

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

  const renderBodyRow = (item) => {
    const input = inputs[item.ticker];
    const levels = computeLevels(item, input);
    return (
      <RiskCardBody
        item={item}
        input={input}
        levels={levels}
        onUpdate={update}
        onToggleMode={() => toggleMode(item, input)}
      />
    );
  };

  const renderExplanation = (item) => {
    const input = inputs[item.ticker];
    const levels = computeLevels(item, input);
    return <RiskExplanation item={item} levels={levels} />;
  };

  const singleLayout = data && data.items.length === 1;

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
        singleLayout ? (
          (() => {
            const item = data.items[0];
            const input = inputs[item.ticker];
            const levels = computeLevels(item, input);
            return (
              <div className="risk-single">
                <div className="card risk-card">{renderBodyRow(item)}</div>
                <div className="card risk-chart-card">
                  <RiskChart
                    series={item.series}
                    stopLoss={levels.stopPrice}
                    target={levels.targetPrice}
                  />
                  {renderExplanation(item)}
                </div>
              </div>
            );
          })()
        ) : (
          <div className="grid grid-2 risk-grid">
            {data.items.map((item) => {
              const input = inputs[item.ticker];
              const levels = computeLevels(item, input);
              return (
                <div className="card risk-card" key={item.ticker}>
                  {renderBodyRow(item)}
                  <RiskChart
                    series={item.series}
                    stopLoss={levels.stopPrice}
                    target={levels.targetPrice}
                  />
                  {renderExplanation(item)}
                </div>
              );
            })}
          </div>
        )
      )}

      {!data && !loading && !error && (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <p className="sub" style={{ fontSize: "1rem" }}>
            No <strong>{isSingle ? "single ticker" : "portfolio"}</strong> to manage. Run an analysis
            in the <strong>{isSingle ? "Single Ticker" : "Portfolio"}</strong> tab first, then return
            here to configure stop-loss &amp; target levels.
          </p>
        </div>
      )}
    </>
  );
}