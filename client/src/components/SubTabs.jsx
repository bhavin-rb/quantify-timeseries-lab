import { FiEye, FiBarChart2 } from "react-icons/fi";

export default function SubTabs({ view, setView }) {
  return (
    <div className="subtabs">
      <button
        className={`subtab-btn ${view === "analysis" ? "active" : ""}`}
        onClick={() => setView("analysis")}
      >
        <FiBarChart2 size={14} /> Analysis
      </button>
      <button
        className={`subtab-btn ${view === "insights" ? "active" : ""}`}
        onClick={() => setView("insights")}
      >
        <FiEye size={14} /> Insights
      </button>
    </div>
  );
}
