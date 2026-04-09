import { Layout } from "@/components/Layout";
import { ExperimentTable } from "@/components/dashboard/ExperimentTable";
import { FailureModeChart } from "@/components/dashboard/FailureModeChart";
import { ResilienceScore } from "@/components/dashboard/ResilienceScore";
import { TrendChart } from "@/components/dashboard/TrendChart";
import type { OrganizationStats, ScoreHistoryEntry } from "@/types";

const ORG_STATS: OrganizationStats = {
  currentScore: 73,
  totalExperiments: 24,
  totalRuns: 91,
  successRate: 67,
  averageImpactScore: 42,
  topWeaknesses: [
    "Payment service circuit-breaker latency",
    "Regional DNS failover timing",
    "Memory OOM recovery path",
    "Auth token cache cold-start",
  ],
  lastRunAt: BigInt(Date.now() - 67000) * BigInt(1000000),
};

const SCORE_HISTORY: ScoreHistoryEntry[] = [
  {
    timestamp: BigInt(Date.now() - 90 * 86400000),
    score: 35,
    runId: "run-000",
    notes: "Initial baseline",
  },
  {
    timestamp: BigInt(Date.now() - 80 * 86400000),
    score: 38,
    runId: "run-001",
    notes: "Network policies applied",
  },
  {
    timestamp: BigInt(Date.now() - 70 * 86400000),
    score: 41,
    runId: "run-005",
    notes: "Baseline measurement",
  },
  {
    timestamp: BigInt(Date.now() - 60 * 86400000),
    score: 45,
    runId: "run-010",
    notes: "Retry logic deployed",
  },
  {
    timestamp: BigInt(Date.now() - 55 * 86400000),
    score: 43,
    runId: "run-014",
    notes: "Regression in auth path",
  },
  {
    timestamp: BigInt(Date.now() - 50 * 86400000),
    score: 48,
    runId: "run-018",
    notes: "Circuit breaker improvements merged",
  },
  {
    timestamp: BigInt(Date.now() - 45 * 86400000),
    score: 50,
    runId: "run-022",
    notes: "DNS improvements",
  },
  {
    timestamp: BigInt(Date.now() - 40 * 86400000),
    score: 47,
    runId: "run-026",
    notes: "Memory leak regression",
  },
  {
    timestamp: BigInt(Date.now() - 35 * 86400000),
    score: 52,
    runId: "run-030",
    notes: "Auth caching layer deployed",
  },
  {
    timestamp: BigInt(Date.now() - 30 * 86400000),
    score: 56,
    runId: "run-038",
    notes: "SLO tightened",
  },
  {
    timestamp: BigInt(Date.now() - 25 * 86400000),
    score: 58,
    runId: "run-041",
    notes: "Regional failover validated",
  },
  {
    timestamp: BigInt(Date.now() - 20 * 86400000),
    score: 54,
    runId: "run-050",
    notes: "Memory OOM incident regression",
  },
  {
    timestamp: BigInt(Date.now() - 18 * 86400000),
    score: 58,
    runId: "run-056",
    notes: "OOM fix deployed",
  },
  {
    timestamp: BigInt(Date.now() - 15 * 86400000),
    score: 63,
    runId: "run-060",
    notes: "OOM fix + retry policies",
  },
  {
    timestamp: BigInt(Date.now() - 12 * 86400000),
    score: 60,
    runId: "run-066",
    notes: "Minor degradation",
  },
  {
    timestamp: BigInt(Date.now() - 10 * 86400000),
    score: 65,
    runId: "run-070",
    notes: "DNS TTL optimization",
  },
  {
    timestamp: BigInt(Date.now() - 8 * 86400000),
    score: 63,
    runId: "run-074",
    notes: "Run regression",
  },
  {
    timestamp: BigInt(Date.now() - 6 * 86400000),
    score: 67,
    runId: "run-078",
    notes: "Payment fallback hardening",
  },
  {
    timestamp: BigInt(Date.now() - 4 * 86400000),
    score: 69,
    runId: "run-082",
    notes: "Healthcheck improvements",
  },
  {
    timestamp: BigInt(Date.now() - 2 * 86400000),
    score: 71,
    runId: "run-086",
    notes: "K8s pod disruption budget",
  },
  {
    timestamp: BigInt(Date.now() - 86400000),
    score: 70,
    runId: "run-089",
    notes: "Minor throughput regression",
  },
  {
    timestamp: BigInt(Date.now() - 3600000),
    score: 73,
    runId: "run-091",
    notes: "Circuit breaker validated",
  },
];

export default function DashboardPage() {
  const delta =
    SCORE_HISTORY[SCORE_HISTORY.length - 1].score -
    SCORE_HISTORY[SCORE_HISTORY.length - 2].score;

  // Check for anomaly in last period (>10pt drop)
  const lastTwo = SCORE_HISTORY.slice(-2);
  const hasRecentAnomaly =
    lastTwo.length === 2 && lastTwo[1].score < lastTwo[0].score - 10;

  return (
    <Layout>
      <div className="flex flex-col gap-3 min-h-full">
        {/* Top section: score + trend */}
        <div className="flex gap-3" style={{ minHeight: "340px" }}>
          <ResilienceScore stats={ORG_STATS} delta={delta} />
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            <TrendChart history={SCORE_HISTORY} />
            <FailureModeChart
              hasAnomaly={hasRecentAnomaly}
              anomalyDetail={
                hasRecentAnomaly
                  ? `Score dropped from ${lastTwo[0].score} to ${lastTwo[1].score} (${lastTwo[1].score - lastTwo[0].score} pts). Review fault injection for: ${lastTwo[1].notes}`
                  : undefined
              }
            />
          </div>
        </div>

        {/* Experiment history table */}
        <ExperimentTable />
      </div>
    </Layout>
  );
}
