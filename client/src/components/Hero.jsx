import { useReveal, useParallax } from "../hooks.js";
import { FiArrowRight, FiArrowDown } from "react-icons/fi";

export default function Hero({ navigate }) {
  const revealRef = useReveal();
  const parallaxRef = useParallax(0.22);

  return (
    <section className="hero" ref={revealRef}>
      <div
        className="hero-bg"
        ref={parallaxRef}
        style={{ backgroundImage: "url(/images/hero_image_wide.jpg)" }}
      />
      <div className="hero-overlay" />
      <div className="hero-content">
        <span className="hero-badge">
          <img src="/images/logo_main_new.png" alt="Quantify" className="hero-logo" />
        </span>
        <h1>
          <span className="hero-tagline">Prepare. Clean. Explore.</span>
          <br />
          <span className="gradient-text">Financial Time Series.</span>
        </h1>
        <p className="lead">
          An intuitive laboratory for financial data: ingest daily market data,
          clean it automatically, and dive into returns, volatility, and
          correlations — all in your browser.
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary" onClick={() => navigate("/dashboard")}>
            Launch Dashboard <FiArrowRight size={16} />
          </button>
          <a className="btn btn-ghost" href="#about">
            Learn more
          </a>
        </div>
        <div className="hero-stats">
          <div className="stat-chip">
            <strong>10+</strong> EDA metrics
          </div>
          <div className="stat-chip">
            <strong>14</strong> interactive charts
          </div>
          <div className="stat-chip">
            <strong>1-click</strong> CSV export
          </div>
        </div>
      </div>
      <span className="hero-scroll">Scroll <FiArrowDown size={14} /></span>
    </section>
  );
}
