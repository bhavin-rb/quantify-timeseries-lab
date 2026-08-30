import { useState, useCallback } from "react";
import { apiGet, downloadCsv, formatNum, formatPct, formatUsd } from "../api.js";
import PriceChart from "../components/PriceChart.jsx";
import HistogramKdeChart from "../components/HistogramKdeChart.jsx";
import QqPlot, { RollingChart } from "../components/QqPlot.jsx";
import CorrelationHeatmap from "../components/CorrelationHeatmap.jsx";
import DataPreview from "../components/DataPreview.jsx";
import TickerSearch from "../components/TickerSearch.jsx";
import AdvancedInsightsTab from "./AdvancedInsightsTab.jsx";
import RiskManagementTab from "./RiskManagementTab.jsx";
import SubTabs from "../components/SubTabs.jsx";
import InsightsPanel from "../components/InsightsPanel.jsx";
import { FiAlertTriangle, FiDownload, FiRotateCcw, FiTrendingUp, FiLink, FiEye, FiShield } from "react-icons/fi";

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

function SingleTickerTab({ tickers, setTickers, startDate, setStartDate, endDate, setEndDate, window, setWindow, resetAll, onAnalyzed }) {
  const ticker = tickers.split(",")[0]?.trim() || "";
  const setTicker = (v) => setTickers(v);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [eda, setEda] = useState(null);
  const [view, setView] = useState("analysis");

  const run = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ ticker, window: String(window) });
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const data = await apiGet(`/eda?${params.toString()}`);
      setEda(data);
      onAnalyzed?.();
    } catch (e) {
      setError(e.message);
      setEda(null);
    } finally {
      setLoading(false);
    }
  }, [ticker, startDate, endDate, window, onAnalyzed]);

  const summary = eda?.summary;

  const singleTickerInsights = summary
    ? [
        { metric: "Mean Daily Return (%)", explanation: "Average daily gain/loss. Positive means growth, negative means decline.", value: formatPct(summary.meanReturn) },
        { metric: "Annual Volatility (%)", explanation: "How much the stock price swings in a year. Higher = riskier.", value: formatPct(summary.volatility) },
        { metric: "Skewness", explanation: "Shows if returns lean more to gains or losses. Negative skew = more downside risk.", value: formatNum(summary.skewness, 3) },
        { metric: "Excess Kurtosis", explanation: "Measures “fat tails.” High kurtosis = more extreme ups/downs than normal.", value: formatNum(summary.kurtosis, 3) },
        { metric: "Total Return (%)", explanation: "Overall growth over the period.", value: formatPct(summary.totalReturnPct / 100, 2) },
        { metric: "Return OBS", explanation: "Number of return observations used in the analysis.", value: summary.returnObservations },
      ]
    : [];

  return (
    <>
      <div className="controls">
        <div className="control-field">
          <label>Ticker</label>
          <TickerSearch
            value={ticker}
            onChange={setTicker}
            placeholder="Type company name or ticker (e.g. Apple, AAPL)"
            maxLength={10}
          />
        </div>
        <div className="control-field">
          <label>Start date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="control-field">
          <label>End date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="control-field">
          <label>Rolling window</label>
          <input
            type="number"
            min={2}
            max={250}
            value={window}
            onChange={(e) => setWindow(Number(e.target.value))}
          />
        </div>
        <button className="btn btn-primary" onClick={run} disabled={loading || !ticker}>
          {loading ? "Analyzing…" : "Analyze"}
        </button>
        <button className="btn btn-reset" onClick={resetAll}>
          <FiRotateCcw size={14} /> Reset
        </button>
      </div>

      {error && <div className="error-banner"><FiAlertTriangle size={16} /> {error}</div>}
      {loading && <Loading text="Fetching data from Tiingo and computing EDA…" />}

      {eda && summary && (
        <>
          <div className="subtab-row">
            <SubTabs view={view} setView={setView} />
          </div>

          {view === "insights" && (
            <div className="card">
              <InsightsPanel
                title={`Single Ticker Insights — ${summary.ticker}`}
                items={singleTickerInsights}
              />
            </div>
          )}

          {view === "analysis" && (
          <>
          <div className="section-title">
            <h2>Summary statistics — {summary.ticker}</h2>
            <span className="hint">
              {summary.startDate} → {summary.endDate} · {summary.observations} days
            </span>
          </div>
          <SummaryGrid
            items={[
              { label: "Mean daily return", value: formatPct(summary.meanReturn), tone: summary.meanReturn >= 0 ? "positive" : "negative" },
              { label: "Ann. volatility", value: formatPct(summary.volatility) },
              { label: "Skewness", value: formatNum(summary.skewness, 3), tone: summary.skewness > 0 ? "positive" : "negative" },
              { label: "Excess kurtosis", value: formatNum(summary.kurtosis, 3) },
              { label: "Total return", value: formatPct(summary.totalReturnPct / 100, 2), tone: summary.totalReturnPct >= 0 ? "positive" : "negative" },
              { label: "Min / Max close", value: `${formatUsd(summary.min)} / ${formatUsd(summary.max)}` },
              { label: "Last close", value: formatUsd(summary.lastClose) },
              { label: "Return obs", value: summary.returnObservations },
            ]}
          />

          <div className="section-title">
            <h2>Close price history</h2>
            <span className="hint">Cleaned daily closes</span>
          </div>
          <div className="card">
            <PriceChart data={eda.series} series={[{ key: "close", name: "Close", color: "var(--primary)" }]} tall />
            <div style={{ marginTop: 14, textAlign: "right" }}>
              <button
                className="btn btn-ghost"
                onClick={() =>
                  downloadCsv(`${summary.ticker.toLowerCase()}-cleaned.csv`, ["date", "close"], eda.series)
                }
              >
                <FiDownload size={16} /> Export cleaned CSV ({eda.series.length} rows)
              </button>
            </div>
          </div>

          <div className="grid grid-2">
            <div className="card">
              <h3>Return distribution</h3>
              <p className="sub">Histogram of daily log returns with Gaussian KDE overlay</p>
              <HistogramKdeChart histogram={eda.histogram} kde={eda.kde} />
            </div>
            <div className="card">
              <h3>Q-Q plot vs normal</h3>
              <p className="sub">Log-return quantiles against theoretical normal quantiles</p>
              <QqPlot qq={eda.qq} />
            </div>
          </div>

          <div className="grid grid-2">
            <div className="card">
              <h3>Rolling mean return</h3>
              <p className="sub">Window: {eda.rollingWindow} trading days</p>
              <RollingChart
                data={eda.rolling}
                series={[{ key: "mean", name: "Mean", color: "var(--accent)" }]}
                xLabel="Date"
                yLabel="Rolling Mean Return"
              />
            </div>
            <div className="card">
              <h3>Rolling annualized volatility</h3>
              <p className="sub">Window: {eda.rollingWindow} trading days</p>
              <RollingChart
                data={eda.rolling}
                series={[{ key: "volatility", name: "Volatility", color: "var(--danger)" }]}
                xLabel="Date"
                yLabel="Rolling Annualized Volatility"
              />
            </div>
          </div>
          </>
          )}
        </>
      )}

      {!eda && !loading && !error && (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <p className="sub" style={{ fontSize: "1rem" }}>
            Enter a ticker and click <strong>Analyze</strong> to run single-ticker EDA.
          </p>
        </div>
      )}
    </>
  );
}

function PortfolioTab({ tickers, setTickers, startDate, setStartDate, endDate, setEndDate, window, setWindow, resetAll, onAnalyzed }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [view, setView] = useState("analysis");

  const run = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ tickers, window: String(window) });
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const result = await apiGet(`/portfolio?${params.toString()}`);
      setData(result);
      onAnalyzed?.();
    } catch (e) {
      setError(e.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tickers, startDate, endDate, window, onAnalyzed]);

  const priceSeries = data
    ? data.tickers.map((t, i) => ({
        key: t,
        name: t,
        color: TICKER_COLORS[i % TICKER_COLORS.length],
      }))
    : [];

  const portfolioInsights = data
    ? [
        { metric: "Mean Daily Return (%)", explanation: "Average daily portfolio gain/loss.", value: formatPct(data.portfolioStats.meanReturn) },
        { metric: "Portfolio Annual Volatility (%)", explanation: "How much the portfolio fluctuates yearly. Lower volatility = smoother ride.", value: formatPct(data.portfolioStats.volatility) },
        { metric: "Sharpe Ratio (Daily)", explanation: "Risk-adjusted return. >1 is strong, <1 means returns don’t justify the risk.", value: formatNum(data.portfolioStats.sharpe, 3) },
      ]
    : [];

  return (
    <>
      <div className="controls">
        <div className="control-field">
          <label>Tickers (comma-separated)</label>
          <TickerSearch
            value={tickers}
            onChange={setTickers}
            placeholder="Type company name or ticker (e.g. Apple, AAPL)"
          />
        </div>
        <div className="control-field">
          <label>Start date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="control-field">
          <label>End date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="control-field">
          <label>Rolling window</label>
          <input
            type="number"
            min={2}
            max={250}
            value={window}
            onChange={(e) => setWindow(Number(e.target.value))}
          />
        </div>
        <button className="btn btn-primary" onClick={run} disabled={loading}>
          {loading ? "Analyzing…" : "Analyze"}
        </button>
        <button className="btn btn-reset" onClick={resetAll}>
          <FiRotateCcw size={14} /> Reset
        </button>
      </div>

      {error && <div className="error-banner"><FiAlertTriangle size={16} /> {error}</div>}
      {loading && <Loading text="Merging tickers and computing correlations…" />}

      {data && (
        <>
          <div className="subtab-row">
            <SubTabs view={view} setView={setView} />
          </div>

          {view === "insights" && (
            <div className="card">
              <InsightsPanel
                title={`Portfolio Overview Insights — ${data.tickers.join(", ")}`}
                items={portfolioInsights}
              />
            </div>
          )}

          {view === "analysis" && (
          <>
          <div className="section-title">
            <h2>Portfolio overview — {data.tickers.join(", ")}</h2>
            <span className="hint">
              {data.prices[0]?.date} → {data.prices.at(-1)?.date} · {data.prices.length} overlapping days
            </span>
          </div>
          <SummaryGrid
            items={[
              { label: "Tickers", value: data.tickers.length },
              { label: "Mean daily return", value: formatPct(data.portfolioStats.meanReturn), tone: data.portfolioStats.meanReturn >= 0 ? "positive" : "negative" },
              { label: "Portfolio ann. vol.", value: formatPct(data.portfolioStats.volatility) },
              { label: "Sharpe (daily)", value: formatNum(data.portfolioStats.sharpe, 3) },
            ]}
          />

          <div className="card">
            <h3>Merged close prices (equal-weight portfolio)</h3>
            <p className="sub">Intersected trading dates only</p>
            <PriceChart data={data.prices} series={priceSeries} tall />
            <div style={{ marginTop: 4, textAlign: "right" }}>
              <button
                className="btn btn-ghost"
                onClick={() =>
                  downloadCsv("portfolio-prices.csv", ["date", ...data.tickers], data.prices)
                }
              >
                <FiDownload size={16} /> Export prices CSV ({data.prices.length} rows)
              </button>
            </div>
          </div>

          <div className="grid grid-2">
            <div className="card">
              <h3>Correlation matrix</h3>
              <p className="sub">Pearson correlation of daily log returns</p>
              <CorrelationHeatmap tickers={data.tickers} matrix={data.correlation.matrix} />
            </div>
            <div className="card">
              <h3>Portfolio rolling volatility</h3>
              <p className="sub">Equal-weight, window {data.rollingWindow} days</p>
              <RollingChart
                data={data.portfolioVolatility}
                series={[{ key: "volatility", name: "Volatility", color: "var(--danger)" }]}
                xLabel="Date"
                yLabel="Rolling Volatility (Annualized)"
              />
            </div>
          </div>

          {data.rollingCorrelation.length > 0 && (
            <div className="card">
              <h3>Rolling pair correlations</h3>
              <p className="sub">Window {data.rollingWindow} trading days</p>
              <RollingChart
                data={data.rollingCorrelation[0].points.map((p, i) => {
                  const row = { date: p.date };
                  for (const pc of data.rollingCorrelation) {
                    row[pc.pair] = pc.points[i]?.value;
                  }
                  return row;
                })}
                series={data.rollingCorrelation.map((pc, i) => ({
                  key: pc.pair,
                  name: pc.pair,
                  color: TICKER_COLORS[(i + 2) % TICKER_COLORS.length],
                }))}
                xLabel="Date"
                yLabel="Correlation Coefficient"
              />
            </div>
          )}

          </>
          )}
        </>
      )}

      {!data && !loading && !error && (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <p className="sub" style={{ fontSize: "1rem" }}>
            Enter 2+ tickers and click <strong>Analyze</strong> for portfolio correlation analysis.
          </p>
        </div>
      )}
    </>
  );
}

export default function Dashboard() {
  const [tab, setTab] = useState("single");
  const [riskFrom, setRiskFrom] = useState("single");
  const [analyzedSingle, setAnalyzedSingle] = useState(false);
  const [analyzedPortfolio, setAnalyzedPortfolio] = useState(false);
  const [tickers, setTickers] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [window, setWindow] = useState(30);
  const [resetKey, setResetKey] = useState(0);

  const handleSingleAnalyzed = useCallback(() => setAnalyzedSingle(true), []);
  const handlePortfolioAnalyzed = useCallback(() => setAnalyzedPortfolio(true), []);

  const openRisk = useCallback((from) => {
    setRiskFrom(from);
    setTab("riskmgmt");
  }, []);

  const resetAll = useCallback(() => {
    setTickers("");
    setStartDate("");
    setEndDate("");
    setWindow(30);
    setAnalyzedSingle(false);
    setAnalyzedPortfolio(false);
    setRiskFrom("single");
    setResetKey((k) => k + 1);
    setTab((t) => (t === "insights" || t === "riskmgmt" ? "portfolio" : t));
  }, []);

  const riskInMiddle =
    tab === "single" || (tab === "riskmgmt" && riskFrom === "single");
  const riskInEnd =
    tab === "portfolio" || (tab === "riskmgmt" && riskFrom === "portfolio");
  const showRiskMiddle =
    riskInMiddle && (tab === "riskmgmt" || analyzedSingle);
  const showRiskEnd =
    riskInEnd && (tab === "riskmgmt" || analyzedPortfolio);
  const showAdvanced =
    tab === "portfolio" || (tab === "riskmgmt" && riskFrom === "portfolio");

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <h1>Analysis Dashboard</h1>
        <p>Explore single-ticker EDA or portfolio correlations with live Tiingo data.</p>
      </header>

      <div className="tabs">
        <button
          className={`tab-btn ${tab === "single" ? "active" : ""}`}
          onClick={() => setTab("single")}
        >
          <FiTrendingUp size={16} /> Single Ticker
        </button>
        {showRiskMiddle && (
          <button
            className={`tab-btn ${tab === "riskmgmt" ? "active" : ""}`}
            onClick={() => openRisk("single")}
          >
            <FiShield size={16} /> Risk Management
          </button>
        )}
        <button
          className={`tab-btn ${tab === "portfolio" ? "active" : ""}`}
          onClick={() => setTab("portfolio")}
        >
          <FiLink size={16} /> Portfolio
        </button>
        {showAdvanced && (
          <button
            className={`tab-btn ${tab === "insights" ? "active" : ""}`}
            onClick={() => setTab("insights")}
          >
            <FiEye size={16} /> Advanced Insights
          </button>
        )}
        {showRiskEnd && (
          <button
            className={`tab-btn ${tab === "riskmgmt" ? "active" : ""}`}
            onClick={() => openRisk("portfolio")}
          >
            <FiShield size={16} /> Risk Management
          </button>
        )}
      </div>

      {tab === "single" && (
        <SingleTickerTab
          key={`single-${resetKey}`}
          tickers={tickers} setTickers={setTickers}
          startDate={startDate} setStartDate={setStartDate}
          endDate={endDate} setEndDate={setEndDate}
          window={window} setWindow={setWindow}
          resetAll={resetAll}
          onAnalyzed={handleSingleAnalyzed}
        />
      )}
      {tab === "portfolio" && (
        <PortfolioTab
          key={`portfolio-${resetKey}`}
          tickers={tickers} setTickers={setTickers}
          startDate={startDate} setStartDate={setStartDate}
          endDate={endDate} setEndDate={setEndDate}
          window={window} setWindow={setWindow}
          resetAll={resetAll}
          onAnalyzed={handlePortfolioAnalyzed}
        />
      )}
      {tab === "insights" && (
        <AdvancedInsightsTab
          key={`insights-${resetKey}`}
          tickers={tickers}
          startDate={startDate}
          endDate={endDate}
          window={window}
          resetAll={resetAll}
        />
      )}
      {tab === "riskmgmt" && (
        <RiskManagementTab
          key={`risk-${resetKey}`}
          tickers={tickers}
          startDate={startDate}
          endDate={endDate}
          resetAll={resetAll}
        />
      )}
    </main>
  );
}
