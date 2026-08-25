import { useEffect, useState } from "react";

export default function Navbar({ theme, onToggleTheme, route, navigate }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <a className="brand" href="#/" onClick={() => navigate("/")}>
        <span className="logo">⟠</span>
        <span>
          TimeSeries <span className="brand-accent">Lab</span>
        </span>
      </a>
      <div className="nav-links">
        <a className="link-label" href="#/" onClick={() => navigate("/")}>
          Home
        </a>
        <a className="link-label" href="#about" onClick={() => navigate("/")}>
          About
        </a>
        <button
          className={`nav-btn link-label ${route.startsWith("/dashboard") ? "active" : ""}`}
          onClick={() => navigate("/dashboard")}
        >
          Dashboard
        </button>
        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </div>
    </nav>
  );
}