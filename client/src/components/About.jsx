import { useReveal } from "../hooks.js";

const FEATURES = [
  { icon: "🗂️", label: "Automatic cleaning & dedup" },
  { icon: "📊", label: "Summary statistics & returns" },
  { icon: "📈", label: "Rolling volatility diagnostics" },
  { icon: "🔗", label: "Portfolio correlation heatmap" },
  { icon: "🌗", label: "Dark & light themes" },
  { icon: "⬇️", label: "One-click CSV export" },
];

export default function About() {
  const ref = useReveal();

  return (
    <section className="about" id="about" ref={ref}>
      <div className="about-grid">
        <div className="about-image-wrap reveal">
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