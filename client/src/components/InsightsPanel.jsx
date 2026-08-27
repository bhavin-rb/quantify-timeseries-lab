import { FiInfo } from "react-icons/fi";

export default function InsightsPanel({ title, items }) {
  return (
    <div className="insights-panel">
      {title && <h3 className="insights-title">{title}</h3>}
      <ul className="insights-list">
        {items.map((item) => (
          <li className="insight-item" key={item.metric}>
            <FiInfo className="insight-icon" size={14} />
            <span className="insight-text">
              <span className="insight-metric">
                <strong>{item.metric}</strong>
                {item.value != null && <span className="insight-value">{item.value}</span>}
              </span>
              <span className="insight-explanation">{item.explanation}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
