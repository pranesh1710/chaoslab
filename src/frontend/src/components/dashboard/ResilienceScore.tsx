import { cn } from "@/lib/utils";
import type { OrganizationStats } from "@/types";
import { TrendingDown, TrendingUp } from "lucide-react";

interface ResilienceScoreProps {
  stats: OrganizationStats;
  delta: number;
}

function scoreColor(score: number) {
  if (score >= 80) return { stroke: "text-chart-3", text: "text-chart-3" };
  if (score >= 60) return { stroke: "text-primary", text: "text-primary" };
  if (score >= 40) return { stroke: "text-chart-4", text: "text-chart-4" };
  return { stroke: "text-destructive", text: "text-destructive" };
}

function ScoreGauge({ score }: { score: number }) {
  const { stroke } = scoreColor(score);
  const r = 60;
  const circ = Math.PI * r;
  const dashOffset = circ - (score / 100) * circ;
  const angle = (score / 100) * 180;

  return (
    <div className="flex flex-col items-center">
      <svg
        width="160"
        height="90"
        viewBox="0 0 160 90"
        role="img"
        aria-label={`Resilience score gauge showing ${score}`}
      >
        <title>Resilience score gauge</title>
        <path
          d="M 20 80 A 60 60 0 0 1 140 80"
          fill="none"
          stroke="oklch(0.22 0 0)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M 20 80 A 60 60 0 0 1 140 80"
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          className={stroke}
          strokeDasharray={circ}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <line
          x1="80"
          y1="80"
          x2={80 + 50 * Math.cos(Math.PI - (angle * Math.PI) / 180)}
          y2={80 - 50 * Math.sin((angle * Math.PI) / 180)}
          stroke="oklch(0.92 0 0)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="80" cy="80" r="4" fill="oklch(0.92 0 0)" />
      </svg>
      <div
        className={cn(
          "text-5xl font-display font-black leading-none -mt-4",
          scoreColor(score).text,
        )}
        data-ocid="resilience-score-value"
      >
        {score}
      </div>
      <div className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-widest">
        Resilience Score
      </div>
    </div>
  );
}

export function ResilienceScore({ stats, delta }: ResilienceScoreProps) {
  const grade =
    stats.currentScore >= 80
      ? "A"
      : stats.currentScore >= 65
        ? "B"
        : stats.currentScore >= 50
          ? "C"
          : "D";

  const infraBreakdown = [
    { label: "Kubernetes", score: 78, key: "kubernetes" },
    { label: "AWS", score: 65, key: "aws" },
    { label: "Azure", score: 81, key: "azure" },
    { label: "Linux", score: 59, key: "linux" },
  ];

  const serviceBreakdown = [
    { service: "payments-svc", score: 52 },
    { service: "auth-gateway", score: 68 },
    { service: "inventory-api", score: 71 },
    { service: "notification-svc", score: 83 },
    { service: "search-service", score: 44 },
    { service: "order-processor", score: 76 },
  ].sort((a, b) => a.score - b.score);

  return (
    <div className="flex flex-col gap-3 w-72 flex-shrink-0">
      {/* Main score card */}
      <div
        className="bg-card border border-border rounded p-4 flex flex-col items-center"
        data-ocid="resilience-score-card"
      >
        <ScoreGauge score={stats.currentScore} />
        <div className="flex items-center gap-1.5 mt-2">
          {delta >= 0 ? (
            <TrendingUp className="h-3.5 w-3.5 text-chart-3" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-destructive" />
          )}
          <span
            className={cn(
              "text-xs font-mono font-bold",
              delta >= 0 ? "text-chart-3" : "text-destructive",
            )}
          >
            {delta >= 0 ? "+" : ""}
            {delta} pts
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            vs last run
          </span>
        </div>
        <div className="w-full mt-3 grid grid-cols-2 gap-1">
          {[
            {
              label: "Grade",
              value: grade,
              color: stats.currentScore >= 65 ? "text-chart-3" : "text-chart-4",
            },
            {
              label: "Experiments",
              value: String(stats.totalExperiments),
              color: "text-foreground",
            },
            {
              label: "Total Runs",
              value: String(stats.totalRuns),
              color: "text-foreground",
            },
            {
              label: "Pass Rate",
              value: `${stats.successRate}%`,
              color: "text-primary",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col p-1.5 bg-secondary/30 rounded"
            >
              <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">
                {s.label}
              </span>
              <span
                className={cn("text-sm font-mono font-bold mt-0.5", s.color)}
              >
                {s.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Infra breakdown cards */}
      <div
        className="bg-card border border-border rounded overflow-hidden"
        data-ocid="infra-breakdown"
      >
        <div className="px-3 py-2 border-b border-border">
          <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
            By Infrastructure
          </span>
        </div>
        <div className="grid grid-cols-2 gap-0">
          {infraBreakdown.map((infra, idx) => {
            const colors = scoreColor(infra.score);
            return (
              <div
                key={infra.key}
                className={cn(
                  "p-2.5 flex flex-col gap-1",
                  idx % 2 === 0 ? "border-r border-border" : "",
                  idx < 2 ? "border-b border-border" : "",
                )}
              >
                <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">
                  {infra.label}
                </span>
                <span
                  className={cn(
                    "text-lg font-display font-black leading-none",
                    colors.text,
                  )}
                >
                  {infra.score}
                </span>
                <div className="w-full bg-muted rounded-sm h-1 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-sm",
                      `bg-[oklch(var(--chart-${infra.score >= 80 ? "3" : infra.score >= 60 ? "1" : "2"}))]`,
                    )}
                    style={{ width: `${infra.score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Service breakdown */}
      <div
        className="bg-card border border-border rounded overflow-hidden flex-1"
        data-ocid="service-breakdown"
      >
        <div className="px-3 py-2 border-b border-border">
          <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
            Service Scores
          </span>
        </div>
        <div className="p-2 flex flex-col gap-1.5">
          {serviceBreakdown.map((svc) => {
            const { text } = scoreColor(svc.score);
            return (
              <div key={svc.service} className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-muted-foreground truncate flex-1 min-w-0">
                  {svc.service}
                </span>
                <div className="w-20 bg-muted rounded-sm h-1.5 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-sm transition-all",
                      svc.score >= 80
                        ? "bg-chart-3"
                        : svc.score >= 60
                          ? "bg-primary"
                          : svc.score >= 40
                            ? "bg-chart-4"
                            : "bg-destructive",
                    )}
                    style={{ width: `${svc.score}%` }}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-mono font-bold w-7 text-right flex-shrink-0",
                    text,
                  )}
                >
                  {svc.score}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
