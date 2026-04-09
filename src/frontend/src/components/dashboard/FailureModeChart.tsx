import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface FailureMode {
  faultType: string;
  occurrenceCount: number;
  failureRate: number;
}

const FAILURE_MODE_DATA: FailureMode[] = [
  { faultType: "Latency Injection", occurrenceCount: 31, failureRate: 26 },
  { faultType: "CPU Starvation", occurrenceCount: 22, failureRate: 41 },
  { faultType: "Memory Pressure", occurrenceCount: 18, failureRate: 56 },
  { faultType: "Network Loss", occurrenceCount: 15, failureRate: 33 },
  { faultType: "Regional Failure", occurrenceCount: 11, failureRate: 64 },
  { faultType: "DNS Failure", occurrenceCount: 9, failureRate: 78 },
  { faultType: "Process Kill", occurrenceCount: 7, failureRate: 43 },
  { faultType: "Disk I/O", occurrenceCount: 5, failureRate: 20 },
];

interface FailureModeChartProps {
  hasAnomaly?: boolean;
  anomalyDetail?: string;
}

export function FailureModeChart({
  hasAnomaly = false,
  anomalyDetail,
}: FailureModeChartProps) {
  return (
    <div
      className="bg-card border border-border rounded p-3"
      data-ocid="failure-mode-chart"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
          Top Failure Modes
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-sm bg-primary" />
            <span className="text-[9px] font-mono text-muted-foreground">
              Occurrences
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-sm bg-destructive" />
            <span className="text-[9px] font-mono text-muted-foreground">
              Failure rate %
            </span>
          </div>
        </div>
      </div>

      {hasAnomaly && (
        <div
          className="flex items-start gap-2 p-2 mb-3 bg-destructive/10 border border-destructive/30 rounded"
          data-ocid="anomaly-callout"
        >
          <AlertTriangle className="h-3.5 w-3.5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-[10px] font-mono font-bold text-destructive uppercase tracking-wide">
              Score Anomaly Detected
            </div>
            <div className="text-[9px] font-mono text-muted-foreground mt-0.5">
              {anomalyDetail ??
                "Resilience score dropped >10% vs prior measurement period. Review recent fault runs."}
            </div>
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={FAILURE_MODE_DATA}
          layout="vertical"
          margin={{ top: 0, right: 40, bottom: 0, left: 0 }}
          barCategoryGap="20%"
          barSize={7}
        >
          <XAxis
            type="number"
            tick={{
              fontSize: 8,
              fill: "oklch(0.55 0 0)",
              fontFamily: "var(--font-mono)",
            }}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
          />
          <YAxis
            dataKey="faultType"
            type="category"
            width={110}
            tick={{
              fontSize: 9,
              fill: "oklch(0.65 0 0)",
              fontFamily: "var(--font-mono)",
            }}
            tickLine={false}
            axisLine={false}
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
            formatter={(value: number, name: string) => {
              if (name === "occurrenceCount") return [`${value} runs`, "Count"];
              return [`${value}%`, "Failure Rate"];
            }}
          />
          <Bar
            dataKey="occurrenceCount"
            name="occurrenceCount"
            radius={[0, 2, 2, 0]}
          >
            {FAILURE_MODE_DATA.map((entry) => (
              <Cell
                key={`occ-${entry.faultType}`}
                fill="oklch(0.72 0.2 190)"
                fillOpacity={0.8}
              />
            ))}
          </Bar>
          <Bar dataKey="failureRate" name="failureRate" radius={[0, 2, 2, 0]}>
            {FAILURE_MODE_DATA.map((entry) => (
              <Cell
                key={`rate-${entry.faultType}`}
                fill={
                  entry.failureRate >= 60
                    ? "oklch(0.65 0.2 25)"
                    : entry.failureRate >= 40
                      ? "oklch(0.7 0.19 85)"
                      : "oklch(0.6 0.18 140)"
                }
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-3 grid grid-cols-4 gap-2">
        {FAILURE_MODE_DATA.slice(0, 4).map((fm) => (
          <div
            key={`stat-${fm.faultType}`}
            className={cn(
              "p-1.5 rounded border text-center",
              fm.failureRate >= 60
                ? "border-destructive/30 bg-destructive/5"
                : "border-border bg-secondary/20",
            )}
          >
            <div
              className={cn(
                "text-sm font-mono font-bold",
                fm.failureRate >= 60 ? "text-destructive" : "text-primary",
              )}
            >
              {fm.failureRate}%
            </div>
            <div className="text-[8px] font-mono text-muted-foreground leading-tight truncate">
              {fm.faultType.split(" ")[0]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
