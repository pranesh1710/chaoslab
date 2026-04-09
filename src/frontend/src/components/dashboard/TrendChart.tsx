import { cn } from "@/lib/utils";
import type { ScoreHistoryEntry } from "@/types";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface TrendChartProps {
  history: ScoreHistoryEntry[];
}

const RANGES = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

interface ChartDataPoint {
  date: string;
  score: number;
  runId: string | null;
  notes: string;
  isAnomaly: boolean;
  timestamp: number;
}

export function TrendChart({ history }: TrendChartProps) {
  const [range, setRange] = useState<7 | 30 | 90>(30);

  const chartData = useMemo<ChartDataPoint[]>(() => {
    const cutoff = Date.now() - range * 86400000;
    const filtered = history
      .filter((e) => Number(e.timestamp) >= cutoff)
      .sort((a, b) => Number(a.timestamp) - Number(b.timestamp));

    return filtered.map((entry, i) => {
      const prev = filtered[i - 1];
      const isAnomaly = prev ? entry.score < prev.score - 10 : false;
      return {
        date: new Date(Number(entry.timestamp)).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        score: entry.score,
        runId: entry.runId,
        notes: entry.notes,
        isAnomaly,
        timestamp: Number(entry.timestamp),
      };
    });
  }, [history, range]);

  const anomalies = chartData.filter((d) => d.isAnomaly);

  return (
    <div
      className="bg-card border border-border rounded p-3"
      data-ocid="trend-chart"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
            Resilience Score Trend
          </span>
          {anomalies.length > 0 && (
            <span className="ml-2 text-[9px] font-mono px-1.5 py-0.5 rounded bg-destructive/20 text-destructive border border-destructive/30">
              {anomalies.length} anomal{anomalies.length === 1 ? "y" : "ies"}
            </span>
          )}
        </div>
        <div
          className="flex items-center gap-0.5 bg-secondary/40 rounded p-0.5"
          role="tablist"
          aria-label="Time range"
        >
          {RANGES.map(({ label, days }) => (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={range === days}
              onClick={() => setRange(days as 7 | 30 | 90)}
              className={cn(
                "text-[10px] font-mono px-2 py-0.5 rounded transition-smooth",
                range === days
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground",
              )}
              data-ocid={`trend-range-${label}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={140}>
        <AreaChart
          data={chartData}
          margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
        >
          <defs>
            <linearGradient id="scoreAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="oklch(0.72 0.2 190)"
                stopOpacity={0.25}
              />
              <stop
                offset="95%"
                stopColor="oklch(0.72 0.2 190)"
                stopOpacity={0.02}
              />
            </linearGradient>
            <linearGradient id="anomalyAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="oklch(0.65 0.2 25)"
                stopOpacity={0.15}
              />
              <stop
                offset="95%"
                stopColor="oklch(0.65 0.2 25)"
                stopOpacity={0.02}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="oklch(0.28 0 0)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{
              fontSize: 8,
              fill: "oklch(0.55 0 0)",
              fontFamily: "var(--font-mono)",
            }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{
              fontSize: 8,
              fill: "oklch(0.55 0 0)",
              fontFamily: "var(--font-mono)",
            }}
            tickLine={false}
            axisLine={false}
            ticks={[0, 25, 50, 75, 100]}
          />
          <Tooltip
            contentStyle={{
              background: "oklch(0.16 0 0)",
              border: "1px solid oklch(0.28 0 0)",
              borderRadius: "4px",
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              color: "oklch(0.92 0 0)",
            }}
            formatter={(value: number) => [`${value}`, "Score"]}
            labelFormatter={(label, payload) => {
              const p = payload?.[0]?.payload as ChartDataPoint | undefined;
              return p ? `${label} — ${p.notes}` : label;
            }}
          />
          {/* Anomaly zones */}
          {anomalies.map((a) => (
            <ReferenceLine
              key={`anomaly-${a.timestamp}`}
              x={a.date}
              stroke="oklch(0.65 0.2 25)"
              strokeDasharray="3 2"
              strokeOpacity={0.6}
            />
          ))}
          <Area
            type="monotone"
            dataKey="score"
            stroke="oklch(0.72 0.2 190)"
            strokeWidth={2}
            fill="url(#scoreAreaGrad)"
            dot={(props) => {
              const { cx, cy, payload } = props as {
                cx: number;
                cy: number;
                payload: ChartDataPoint;
              };
              if (payload.runId) {
                return (
                  <circle
                    key={`run-dot-${payload.timestamp}`}
                    cx={cx}
                    cy={cy}
                    r={payload.isAnomaly ? 5 : 3}
                    fill={
                      payload.isAnomaly
                        ? "oklch(0.65 0.2 25)"
                        : "oklch(0.72 0.2 190)"
                    }
                    stroke="oklch(0.16 0 0)"
                    strokeWidth={1.5}
                  />
                );
              }
              return (
                <circle
                  key={`dot-${payload.timestamp}`}
                  cx={cx}
                  cy={cy}
                  r={0}
                />
              );
            }}
            activeDot={{ r: 4, fill: "oklch(0.72 0.2 190)" }}
          />
          {/* Reference lines for thresholds */}
          <ReferenceDot
            y={80}
            x={chartData[0]?.date}
            r={0}
            label={{
              value: "GOOD",
              position: "right",
              fontSize: 8,
              fill: "oklch(0.6 0.18 140)",
              fontFamily: "var(--font-mono)",
            }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="h-0.5 w-4 bg-primary rounded" />
          <span className="text-[9px] font-mono text-muted-foreground">
            Score
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-primary border-2 border-card" />
          <span className="text-[9px] font-mono text-muted-foreground">
            Run marker
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-destructive border-2 border-card" />
          <span className="text-[9px] font-mono text-muted-foreground">
            Anomaly (&gt;10pt drop)
          </span>
        </div>
      </div>
    </div>
  );
}
