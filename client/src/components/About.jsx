import { useReveal } from "../hooks.js";
import { FiFilter, FiBarChart, FiActivity, FiGrid, FiSun, FiMoon, FiDownload } from "react-icons/fi";

const FEATURES = [
  { icon: <FiFilter size={16} />, label: "Automatic cleaning & dedup" },
  { icon: <FiBarChart size={16} />, label: "Summary statistics & returns" },
  { icon: <FiActivity size={16} />, label: "Rolling volatility diagnostics" },
  { icon: <FiGrid size={16} />, label: "Portfolio correlation heatmap" },
  { icon: <><FiSun size={14} /><FiMoon size={14} /></>, label: "Dark & light themes" },
  { icon: <FiDownload size={16} />, label: "One-click CSV export" },
];

export default function About() {
  const ref = useReveal();

  return (
    <section className="about" id="about" ref={ref}>
      <div className="about-grid">
        <div className="about-image-wrap reveal reveal-left">
          <img src="/images/about_image.jpg" alt="About TimeSeries Lab" loading="lazy" />
        </div>
        <div className="reveal">
          <h2>Why TimeSeries <span className="gradient-text">Lab?</span></h2>
          <p>
            Raw financial data is messy — missing values, duplicate dates, and
            inconsistent schemas get in the way of analysis. TimeSeries Lab
            standardizes everything into a clean <code>Date · Close · Volume</code>{" "}
            schema before you even look at it.
          </p>
          <p>
            Then it turns raw prices into insight: log returns, annualized
            volatility, skewness and kurtosis diagnostics, normality checks via
            Q-Q plots, and rolling windows that update as you drag a slider.
            For portfolios, it computes the full correlation matrix with an
            interactive heatmap and rolling pair correlations.
          </p>
          <p>
            And now, with dedicated Insights tabs, TimeSeries Lab goes beyond raw
            numbers. Each mode — Single Ticker, Portfolio Overview, and Advanced
            Insights — includes plain-language explanations of the metrics, so you
            can understand what values like Sharpe, Sortino, or Beta really mean
            for your portfolio. This makes the dashboard useful not only for
            analysts, but for anyone who wants clear, actionable interpretations
            right alongside the data — no finance degree required.
          </p>
          <div className="about-features">
            {FEATURES.map((f) => (
              <div className="feature-item" key={f.label}>
                <span className="feature-icon">{f.icon}</span>
                {f.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
