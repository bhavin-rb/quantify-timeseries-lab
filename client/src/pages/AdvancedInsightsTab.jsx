import { useState, useCallback } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { apiGet, downloadCsv, formatNum } from "../api.js";
import ChartTooltip from "../components/ChartTooltip.jsx";
import { RollingChart } from "../components/QqPlot.jsx";
import { FiAlertTriangle, FiDownload, FiRotateCcw } from "react-icons/fi";

const TICKER_COLORS = ["#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b", "#f43f5e", "#14b8a6", "#e879f9", "#94a3b8"];

function Loading({ text }) {
  return (
    <div className="loading">
      <div className="spinner" />
      <span>{text}</span>
    </div>
  );
}

function SummaryGrid({ items }) {
  return (
    <div className="summary-grid">
      {items.map((item) => (
        <div className="summary-item" key={item.label}>
          <div className="label">{item.label}</div>
          <div className={`value ${item.tone || ""}`}>{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function CustomYLabel({ label }) {
  return ({ viewBox }) => {
    const { x, y, height } = viewBox;
    const cy = y + height / 2;
    return (
      <text x={x} y={cy} textAnchor="middle" fill="var(--text-muted)" fontSize={12} transform={`rotate(-90, ${x}, ${cy})`}>
        {label}
      </text>
    );
  };
}

function CumulativeReturnChart({ data, benchmarkData, tickers, benchmark }) {
  const merged = data.map((d) => {
    const b = benchmarkData?.find((bd) => bd.date === d.date);
    return { ...d, benchmark: b?.cumulative ?? null };
  });

  return (
    <div className="chart-wrap tall">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={merged} margin={{ top: 8, right: 16, bottom: 72, left: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.45} />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={42} stroke="var(--text-muted)"
            label={{ value: "Date", position: "insideBottom", offset: -8, fill: "var(--text-muted)", fontSize: 12 }} />
          <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted)" width={64}
            label={CustomYLabel({ label: "Cumulative Return (%)" })} />
          <Tooltip content={<ChartTooltip formatter={(v) => `${Number(v).toFixed(2)}%`} />} />
          <Legend wrapperStyle={{ fontSize: "0.8rem", paddingTop: 14 }} />
          <Line type="monotone" dataKey="cumulative" name="Portfolio" stroke="var(--primary)" strokeWidth={2} dot={false} animationDuration={700} />
          {benchmarkData && (
            <Line type="monotone" dataKey="benchmark" name={benchmark} stroke="var(--text-muted)" strokeWidth={1.5} dot={false} strokeDasharray="5 5" animationDuration={700} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function DrawdownChart({ data }) {
  return (
    <div className="chart-wrap tall">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 24, left: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.45} />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={42} stroke="var(--text-muted)"
            label={{ value: "Date", position: "insideBottom", offset: -8, fill: "var(--text-muted)", fontSize: 12 }} />
          <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted)" width={64}
            label={CustomYLabel({ label: "Drawdown (%)" })} />
          <Tooltip content={<ChartTooltip formatter={(v) => `${Number(v).toFixed(2)}%`} />} />
          <Area type="monotone" dataKey="drawdown" name="Drawdown" stroke="var(--danger)" fill="var(--danger)" fillOpacity={0.25} strokeWidth={1.5} dot={false} animationDuration={700} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function RollingSharpeChart({ data }) {
  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 24, left: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.45} />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={42} stroke="var(--text-muted)"
            label={{ value: "Date", position: "insideBottom", offset: -8, fill: "var(--text-muted)", fontSize: 12 }} />
          <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted)" width={64}
            label={CustomYLabel({ label: "Sharpe Ratio" })} />
          <Tooltip content={<ChartTooltip formatter={(v) => Number(v).toFixed(3)} />} />
          <Line type="monotone" dataKey="sharpe" name="Rolling Sharpe" stroke="var(--accent)" strokeWidth={2} dot={false} animationDuration={700} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ContributionChart({ data, tickers }) {
  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 72, left: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.45} />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={42} stroke="var(--text-muted)"
            label={{ value: "Date", position: "insideBottom", offset: -8, fill: "var(--text-muted)", fontSize: 12 }} />
          <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted)" width={64}
            label={CustomYLabel({ label: "Vol. Contribution" })} />
          <Tooltip content={<ChartTooltip formatter={(v) => Number(v).toFixed(4)} />} />
          <Legend wrapperStyle={{ fontSize: "0.8rem", paddingTop: 14 }} />
          {tickers.map((t, i) => (
            <Bar key={t} dataKey={t} name={t} stackId="a" fill={TICKER_COLORS[i % TICKER_COLORS.length]} fillOpacity={0.85} animationDuration={700} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function AdvancedInsightsTab({ tickers, startDate, endDate, window, resetAll }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ tickers, window: String(window) });
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const result = await apiGet(`/insights?${params.toString()}`);
      setData(result);
    } catch (e) {
      setError(e.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tickers, startDate, endDate, window]);

  const benchData = data?.benchmarkCumulativeReturnCurve
    ? data.benchmarkCumulativeReturnCurve.map((d) => ({
        date: d.date,
        cumulative: d.cumulative,
      }))
    : null;

  return (
    <>
      <div className="controls" style={{ justifyContent: "center" }}>
        <button className="btn btn-primary" onClick={run} disabled={loading || !tickers || tickers.split(",").filter((t) => t.trim()).length < 2}>
          {loading ? "Analyzing..." : "Analyze Insights"}
        </button>
        <button className="btn btn-reset" onClick={resetAll}>
          <FiRotateCcw size={14} /> Reset
        </button>
      </div>

      {error && <div className="error-banner"><FiAlertTriangle size={16} /> {error}</div>}
      {loading && <Loading text="Fetching data and computing advanced metrics..." />}

      {data && (
        <>
          <div className="section-title">
            <h2>Advanced Portfolio Insights — {data.tickers.join(", ")}</h2>
            <span className="hint">
              vs {data.benchmark} · {data.summary.observations} days · Rolling {data.rollingWindow}d
            </span>
          </div>
          <SummaryGrid
            items={[
              { label: "Max Drawdown", value: `${data.summary.maxDrawdown.toFixed(2)}%`, tone: "negative" },
              { label: "Cumulative Return", value: `${data.summary.cumulativeReturn.toFixed(2)}%`, tone: data.summary.cumulativeReturn >= 0 ? "positive" : "negative" },
              { label: "Sortino Ratio", value: formatNum(data.summary.sortino, 3) },
              { label: `Beta vs ${data.benchmark}`, value: formatNum(data.summary.beta, 3) },
            ]}
          />

          <div className="section-title">
            <h2>Cumulative Return Curve</h2>
            <span className="hint">Growth of $1 — portfolio vs {data.benchmark}</span>
          </div>
          <div className="card">
            <CumulativeReturnChart data={data.cumulativeReturnCurve} benchmarkData={benchData} tickers={data.tickers} benchmark={data.benchmark} />
          </div>

          <div className="section-title">
            <h2>Drawdown Curve</h2>
            <span className="hint">Peak-to-trough decline over time</span>
          </div>
          <div className="card">
            <DrawdownChart data={data.drawdownCurve} />
          </div>

          <div className="grid grid-2">
            <div className="card">
              <h3>Rolling Sharpe Ratio</h3>
              <p className="sub">Window: {data.rollingWindow} trading days</p>
              <RollingSharpeChart data={data.rollingSharpe} />
            </div>
            <div className="card">
              <h3>Portfolio Rolling Volatility</h3>
              <p className="sub">Annualized, window {data.rollingWindow} days</p>
              <RollingChart
                data={data.rollingVolatility}
                series={[{ key: "volatility", name: "Volatility", color: "var(--danger)" }]}
                xLabel="Date"
                yLabel="Rolling Volatility (Annualized)"
              />
            </div>
          </div>

          {data.contributionToVolatility.length > 0 && (
            <>
              <div className="section-title">
                <h2>Contribution to Volatility</h2>
                <span className="hint">Equal-weight portfolio — marginal risk contribution per ticker</span>
              </div>
              <div className="card">
                <ContributionChart data={data.contributionToVolatility} tickers={data.tickers} />
              </div>
            </>
          )}

          <div className="card" style={{ marginTop: 14, textAlign: "right" }}>
            <button
              className="btn btn-ghost"
              onClick={() =>
                downloadCsv("advanced-insights.csv", ["date", "cumulative", "drawdown", "sharpe", "volatility", ...data.tickers], data.cumulativeReturnCurve.map((d, i) => ({
                  date: d.date,
                  cumulative: d.cumulative,
                  drawdown: data.drawdownCurve[i]?.drawdown ?? "",
                  sharpe: data.rollingSharpe[i]?.sharpe ?? "",
                  volatility: data.rollingVolatility[i]?.volatility ?? "",
                  ...Object.fromEntries(data.tickers.map((t) => [t, data.contributionToVolatility[i]?.[t] ?? ""])),
                })))
              }
            >
              <FiDownload size={16} /> Export insights CSV
            </button>
          </div>
        </>
      )}

      {!data && !loading && !error && (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <p className="sub" style={{ fontSize: "1rem" }}>
            Enter tickers in the <strong>Portfolio</strong> tab, then click <strong>Analyze Insights</strong> here.
          </p>
        </div>
      )}
    </>
  );
}
