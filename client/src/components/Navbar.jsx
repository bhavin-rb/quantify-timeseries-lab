import { useEffect, useState } from "react";
import { FiSun, FiMoon } from "react-icons/fi";

export default function Navbar({ theme, onToggleTheme, route, navigate }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goHome = (e) => {
    e.preventDefault();
    navigate("/");
    window.scrollTo(0, 0);
  };

  const goAbout = (e) => {
    e.preventDefault();
    const scrollToAbout = () => {
      const el = document.getElementById("about");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        setTimeout(scrollToAbout, 50);
      }
    };
    if (route.startsWith("/dashboard") || route.startsWith("/contact")) {
      navigate("/");
    }
    scrollToAbout();
  };

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <a className="brand" href="#/" onClick={goHome}>
        <span className="logo">⟠</span>
        <span>
          TimeSeries <span className="brand-accent">Lab</span>
        </span>
      </a>
      <div className="nav-links">
        <a className="link-label" href="#/" onClick={goHome}>
          Home
        </a>
        <a className="link-label" href="#about" onClick={goAbout}>
          About
        </a>
        <button
          className={`nav-btn link-label ${route.startsWith("/dashboard") ? "active" : ""}`}
          onClick={() => navigate("/dashboard")}
        >
          Dashboard
        </button>
        <button
          className={`nav-btn link-label ${route.startsWith("/contact") ? "active" : ""}`}
          onClick={() => navigate("/contact")}
        >
          Contact
        </button>
        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <FiSun size={18} /> : <FiMoon size={18} />}
        </button>
      </div>
    </nav>
  );
}
