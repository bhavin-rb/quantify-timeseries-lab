import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import ChartTooltip from "./ChartTooltip.jsx";

export default function QqPlot({ qq }) {
  const points = qq.points ?? [];
  const reference = qq.reference ?? [];

  let data;
  let xDomain = ["auto", "auto"];
  let yDomain = ["auto", "auto"];

  if (reference.length === 2) {
    const a = reference[0];
    const b = reference[1];
    const slope = (b.sample - a.sample) / (b.theoretical - a.theoretical);
    const intercept = a.sample - slope * a.theoretical;
    const span = Math.abs(b.theoretical - a.theoretical);
    const pad = span * 0.05 || 1;
    const xMin = a.theoretical - pad;
    const xMax = b.theoretical + pad;
    const lineAt = (x) => intercept + slope * x;
    data = [
      ...points.map((p) => ({
        theoretical: p.theoretical,
        sample: p.sample,
        diagonal: null,
      })),
      { theoretical: xMin, sample: null, diagonal: lineAt(xMin) },
      { theoretical: xMax, sample: null, diagonal: lineAt(xMax) },
    ];
    xDomain = [xMin, xMax];
    yDomain = [lineAt(xMin), lineAt(xMax)];
  } else {
    data = points.map((p) => ({
      theoretical: p.theoretical,
      sample: p.sample,
      diagonal: p.theoretical,
    }));
  }

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 24, left: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.45} />
          <XAxis
            type="number"
            dataKey="theoretical"
            name="Theoretical quantile"
            domain={xDomain}
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => Number(v).toFixed(1)}
            stroke="var(--text-muted)"
            label={{ value: "Theoretical Quantile", position: "insideBottom", offset: -8, fill: "var(--text-muted)", fontSize: 12 }}
          />
          <YAxis
            type="number"
            dataKey="sample"
            name="Sample quantile"
            domain={yDomain}
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => Number(v).toFixed(3)}
            stroke="var(--text-muted)"
            label={{
              content: ({ viewBox }) => {
                const { x, y, height } = viewBox;
                const cy = y + height / 2;
                return (
                  <text x={x} y={cy} textAnchor="middle" fill="var(--text-muted)" fontSize={12} transform={`rotate(-90, ${x}, ${cy})`}>
                    Log Return Quantile
                  </text>
                );
              },
              position: "insideLeft",
            }}
          />
          <Tooltip
            content={<ChartTooltip formatter={(v) => Number(v).toFixed(4)} />}
          />
          <Line
            type="monotone"
            dataKey="diagonal"
            name="Normal reference"
            stroke="var(--danger)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="sample"
            name="Sample"
            stroke="var(--primary)"
            strokeWidth={0}
            dot={{ r: 2.5, fill: "var(--primary)", fillOpacity: 0.75, strokeWidth: 0 }}
            animationDuration={700}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RollingChart({ data, series, xLabel, yLabel }) {
  const YAxisLabel = yLabel
    ? ({ viewBox }) => {
        const { x, y, height } = viewBox;
        const cy = y + height / 2;
        return (
          <text
            x={x}
            y={cy}
            textAnchor="middle"
            fill="var(--text-muted)"
            fontSize={12}
            transform={`rotate(-90, ${x}, ${cy})`}
          >
            {yLabel}
          </text>
        );
      }
    : undefined;

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 68, left: 12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.45} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            minTickGap={42}
            stroke="var(--text-muted)"
            label={xLabel ? { value: xLabel, position: "insideBottom", offset: -8, fill: "var(--text-muted)", fontSize: 12 } : undefined}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            stroke="var(--text-muted)"
            label={YAxisLabel ? { content: <YAxisLabel />, position: "insideLeft" } : undefined}
          />
          <Tooltip
            content={<ChartTooltip formatter={(v) => Number(v).toFixed(4)} />}
          />
          <Legend wrapperStyle={{ fontSize: "0.8rem", paddingTop: 14 }} />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              animationDuration={700}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}