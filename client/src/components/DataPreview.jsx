import { useMemo } from "react";
import { downloadCsv } from "../api.js";

export default function DataPreview({ data, title }) {
  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    const union = new Set();
    for (const row of data) Object.keys(row).forEach((k) => union.add(k));
    return [...union];
  }, [data]);

  if (!data || data.length === 0) {
    return <p className="sub">No data to preview.</p>;
  }

  const visible = data.slice(0, 100);

  return (
    <>
      <div className="section-title">
        <h2>{title}</h2>
        <button
          className="btn btn-ghost"
          onClick={() => downloadCsv(`${title.toLowerCase().replace(/\s+/g, "-")}.csv`, columns, data)}
        >
          ⬇️ Export CSV ({data.length} rows)
        </button>
      </div>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <tr key={i}>
                {columns.map((c) => (
                  <td key={c}>{row[c] == null ? "" : Number(row[c]) ? Number(row[c]).toFixed(2) : row[c]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length > 100 && <p className="sub" style={{ marginTop: 8 }}>Showing first 100 of {data.length} rows.</p>}
    </>
  );
}