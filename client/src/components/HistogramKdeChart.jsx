import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import ChartTooltip from "./ChartTooltip.jsx";

export default function HistogramKdeChart({ histogram, kde }) {
  const kdeByX = new Map((kde?.x ?? []).map((x, i) => [Number(x), kde.y[i]]));
  const data = histogram.map((h) => {
    const bin = Number(h.bin);
    const kdeValue = kdeByX.get(bin);
    return {
      bin: bin.toFixed(3),
      "Return Density": Number(h.density.toFixed(4)),
      KDE: kdeValue != null ? Number(kdeValue.toFixed(4)) : null,
    };
  });

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 24, right: 16, bottom: 36, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.45} />
          <XAxis
            dataKey="bin"
            tick={{ fontSize: 11 }}
            stroke="var(--text-muted)"
            label={{ value: "Daily Log Return", position: "insideBottom", offset: -6, fill: "var(--text-muted)", fontSize: 12 }}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            stroke="var(--text-muted)"
            label={{ value: "Density", angle: -90, position: "insideLeft", style: { fill: "var(--text-muted)", fontSize: 11 } }}
          />
          <Tooltip
            content={<ChartTooltip formatter={(v) => Number(v).toFixed(4)} />}
          />
          <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: "0.8rem" }} />
          <Bar
            dataKey="Return Density"
            fill="var(--primary)"
            fillOpacity={0.55}
            radius={[4, 4, 0, 0]}
            animationDuration={700}
          />
          <Line
            type="monotone"
            dataKey="KDE"
            stroke="var(--accent)"
            strokeWidth={2.5}
            dot={false}
            animationDuration={700}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}