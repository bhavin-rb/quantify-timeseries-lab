import { useState, useEffect, useCallback } from "react";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Landing from "./pages/Landing.jsx";
import Dashboard from "./pages/Dashboard.jsx";

function getTheme() {
  const stored = localStorage.getItem("tsl-theme");
  return stored || "dark";
}

export default function App() {
  const [theme, setTheme] = useState(getTheme);
  const [route, setRoute] = useState(window.location.hash.slice(1) || "/");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("tsl-theme", theme);
  }, [theme]);

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash.slice(1) || "/");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = useCallback((path) => {
    window.location.hash = path;
  }, []);

  const toggleTheme = () =>
    setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <>
      <Navbar theme={theme} onToggleTheme={toggleTheme} route={route} navigate={navigate} />
      {route.startsWith("/dashboard") ? (
        <Dashboard navigate={navigate} />
      ) : (
        <Landing navigate={navigate} />
      )}
      <Footer />
    </>
  );
}