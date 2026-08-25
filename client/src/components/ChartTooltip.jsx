export default function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload || payload.length === 0) return null;
  const fmt = formatter || ((v) => (v == null ? "—" : Number(v).toFixed(4)));
  return (
    <div className="chart-tooltip">
      {label != null && <div className="tt-label">{label}</div>}
      {payload.map((p, i) => (
        <div className="tt-row" key={i}>
          <span>{p.name}</span>
          <span className="tt-value">{fmt(p.value, p)}</span>
        </div>
      ))}
    </div>
  );
}