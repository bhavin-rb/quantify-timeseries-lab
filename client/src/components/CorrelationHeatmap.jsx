function colorFor(value) {
  const t = Math.max(-1, Math.min(1, value)); // clamp to [-1, 1]
  const normalized = (t + 1) / 2; // -1 → 0, 0 → 0.5, 1 → 1
  if (normalized <= 0.5) {
    // negative correlation → red to white
    const intensity = Math.round(255 * (normalized * 2)); // t = -1 → 0, t = 0 → 255
    return `rgb(255, ${intensity}, ${intensity})`;
  } else {
    // positive correlation → white to blue
    const intensity = Math.round(255 * (2 - normalized * 2)); // t = 0 → 255, t = 1 → 0
    return `rgb(${intensity}, ${intensity}, 255)`;
  }
}

export default function CorrelationHeatmap({ tickers, matrix }) {
  return (
    <div>
      <div className="heatmap" style={{ gridTemplateColumns: `90px repeat(${tickers.length}, 1fr)` }}>
        <div />
        {tickers.map((t) => (
          <div key={`h-${t}`} className="heatmap-cell" style={{ background: "transparent", color: "var(--text-muted)", textShadow: "none" }}>
            {t}
          </div>
        ))}
        {matrix.map((row) => (
          <div key={row.ticker} className="heatmap-row" style={{ gridTemplateColumns: `90px repeat(${tickers.length}, 1fr)` }}>
            <span className="ticker-label">{row.ticker}</span>
            {row.values.map((v, i) => {
              const isDiagonal = row.ticker === tickers[i];
              const value = isDiagonal ? 1 : v;
              return (
                <div
                  key={`${row.ticker}-${tickers[i]}`}
                  className="heatmap-cell"
                  style={{ background: colorFor(value) }}
                  title={`${row.ticker} × ${tickers[i]}: ${value.toFixed(3)}`}
                >
                  {value.toFixed(2)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="heatmap-legend" style={{ display: "flex", flexDirection: "column", marginTop: "10px", width: "100%" }}>
        <div className="legend-labels" style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-muted)" }}>
          <span>-1</span>
          <span>0</span>
          <span>1</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            className="legend-bar"
            style={{
              flex: 1,
              height: "20px",
              borderRadius: "4px",
              background: "linear-gradient(to right, rgb(255, 0, 0), rgb(255, 255, 255), rgb(0, 0, 255))"
            }}
          />
          <span className="legend-title" style={{ fontSize: "12px", color: "var(--text-muted)", flexShrink: 0 }}>Corr</span>
        </div>
      </div>
    </div>
  );
}
