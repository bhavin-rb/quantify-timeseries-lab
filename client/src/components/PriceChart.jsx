import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import ChartTooltip from "./ChartTooltip.jsx";

export default function PriceChart({ data, series, height }) {
  return (
    <div className={`chart-wrap ${height ? "tall" : ""}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.45} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            minTickGap={42}
            stroke="var(--text-muted)"
            label={{
              value: "Date",
              position: "insideBottom",
              offset: -8,
              fill: "var(--text-muted)",
              fontSize: 12,
            }}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            width={64}
            domain={["auto", "auto"]}
            stroke="var(--text-muted)"
            label={{
              value: "Closing Price (USD)",
              angle: -90,
              position: "insideLeft",
              offset: 10,
              fill: "var(--text-muted)",
              fontSize: 12,
            }}
          />
          <Tooltip
            content={<ChartTooltip formatter={(v) => `$${Number(v).toFixed(2)}`} />}
          />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              animationDuration={700}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}