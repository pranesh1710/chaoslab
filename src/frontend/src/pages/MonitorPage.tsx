import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  ExecutionRun,
  FaultResult,
  LogEntry,
  MetricsSnapshot,
} from "@/types";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  Database,
  FlaskConical,
  MemoryStick,
  Network,
  RefreshCw,
  Search,
  Server,
  Shield,
  ShieldAlert,
  StopCircle,
  Terminal,
  TrendingDown,
  TrendingUp,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

// ─── Seed data ────────────────────────────────────────────────────────────────

const EXPERIMENTS_SEED = [
  {
    id: "exp-001",
    name: "Payment Service Latency Storm",
    target: "payment-svc / k8s-prod",
    faultCount: 2,
    blastRadius: "≤20% pods · 2 envs",
    status: "ready",
  },
  {
    id: "exp-002",
    name: "Auth CPU Starvation",
    target: "auth-svc / k8s-prod",
    faultCount: 1,
    blastRadius: "≤10% pods · 1 env",
    status: "ready",
  },
  {
    id: "exp-003",
    name: "Order DB Connection Drop",
    target: "order-db / rds-prod",
    faultCount: 3,
    blastRadius: "≤5% connections · 1 env",
    status: "ready",
  },
  {
    id: "exp-004",
    name: "Inventory Memory Pressure",
    target: "inventory-svc / k8s-staging",
    faultCount: 1,
    blastRadius: "≤30% pods · staging",
    status: "draft",
  },
  {
    id: "exp-005",
    name: "Regional Failover Drill",
    target: "api-gateway / us-east-1",
    faultCount: 4,
    blastRadius: "1 region · pre-approved",
    status: "ready",
  },
];

const EXP_DETAILS: Record<
  string,
  {
    hypothesis: string;
    durationMin: number;
    faults: {
      name: string;
      target: string;
      duration: string;
      params: string;
    }[];
    probes: { name: string; type: string; endpoint: string }[];
    blastDetail: {
      maxInstances: number;
      maxPct: number;
      envs: string[];
      approvalRequired: boolean;
    };
  }
> = {
  "exp-001": {
    hypothesis:
      "Circuit breaker opens within 5s and checkout degrades below 5% error rate.",
    durationMin: 5,
    faults: [
      {
        name: "Latency Injection",
        target: "payment-svc",
        duration: "180s",
        params: "delay=2000ms, jitter=200ms",
      },
      {
        name: "Network Packet Loss",
        target: "payment-svc",
        duration: "60s",
        params: "drop=10%, correlation=25%",
      },
    ],
    probes: [
      { name: "checkout-health", type: "HTTP", endpoint: "GET /healthz" },
      {
        name: "circuit-breaker-state",
        type: "script",
        endpoint: "cb_check.sh",
      },
      {
        name: "error-rate-threshold",
        type: "script",
        endpoint: "metric_check.sh",
      },
    ],
    blastDetail: {
      maxInstances: 4,
      maxPct: 20,
      envs: ["production", "canary"],
      approvalRequired: false,
    },
  },
  "exp-002": {
    hypothesis:
      "Token validation remains under 400ms p99 even at 90% CPU saturation.",
    durationMin: 3,
    faults: [
      {
        name: "CPU Starvation",
        target: "auth-svc",
        duration: "120s",
        params: "load=90%, cores=all",
      },
    ],
    probes: [
      {
        name: "token-validation-latency",
        type: "HTTP",
        endpoint: "POST /auth/validate",
      },
      { name: "auth-svc-availability", type: "HTTP", endpoint: "GET /healthz" },
    ],
    blastDetail: {
      maxInstances: 2,
      maxPct: 10,
      envs: ["production"],
      approvalRequired: false,
    },
  },
  "exp-003": {
    hypothesis:
      "Order service falls back to read-replica within 3s with no data loss.",
    durationMin: 4,
    faults: [
      {
        name: "TCP Connection Drop",
        target: "order-db",
        duration: "90s",
        params: "drop_rate=100%",
      },
      {
        name: "Latency Injection",
        target: "order-db",
        duration: "60s",
        params: "delay=5000ms",
      },
      {
        name: "DNS Failure",
        target: "order-db.rds",
        duration: "30s",
        params: "nxdomain=true",
      },
    ],
    probes: [
      { name: "order-create-success", type: "HTTP", endpoint: "POST /orders" },
      { name: "db-replica-lag", type: "script", endpoint: "replica_check.sh" },
    ],
    blastDetail: {
      maxInstances: 10,
      maxPct: 5,
      envs: ["production"],
      approvalRequired: true,
    },
  },
  "exp-004": {
    hypothesis:
      "Service restarts gracefully within 30s with no data corruption.",
    durationMin: 3,
    faults: [
      {
        name: "Memory Pressure",
        target: "inventory-svc",
        duration: "90s",
        params: "fill=85%, oom_score=900",
      },
    ],
    probes: [
      {
        name: "inventory-availability",
        type: "HTTP",
        endpoint: "GET /healthz",
      },
      {
        name: "data-integrity-check",
        type: "script",
        endpoint: "integrity_check.sh",
      },
    ],
    blastDetail: {
      maxInstances: 6,
      maxPct: 30,
      envs: ["staging"],
      approvalRequired: false,
    },
  },
  "exp-005": {
    hypothesis:
      "Traffic shifts to us-west-2 within 60s and error rate stays below 1%.",
    durationMin: 10,
    faults: [
      {
        name: "Regional Failure Sim",
        target: "api-gw/us-east-1",
        duration: "300s",
        params: "mode=full_block",
      },
      {
        name: "Latency Injection",
        target: "api-gw/us-east-1",
        duration: "60s",
        params: "delay=10000ms",
      },
      {
        name: "DNS Failure",
        target: "api.example.com",
        duration: "120s",
        params: "region=us-east-1",
      },
      {
        name: "Network Packet Loss",
        target: "api-gw/us-east-1",
        duration: "60s",
        params: "drop=50%",
      },
    ],
    probes: [
      { name: "global-health", type: "HTTP", endpoint: "GET /healthz" },
      {
        name: "traffic-shift-detection",
        type: "script",
        endpoint: "traffic_check.sh",
      },
      { name: "error-rate-slo", type: "script", endpoint: "slo_check.sh" },
      { name: "rpo-compliance", type: "script", endpoint: "rpo_check.sh" },
    ],
    blastDetail: {
      maxInstances: 100,
      maxPct: 100,
      envs: ["production"],
      approvalRequired: true,
    },
  },
};

const MOCK_RUNS: ExecutionRun[] = [
  {
    id: "run-007",
    experimentId: "exp-001",
    experimentName: "Payment Service Latency Storm",
    status: "running",
    startedAt: BigInt(Date.now() - 67000) * BigInt(1000000),
    completedAt: null,
    triggeredBy: "sre-cli / mchang",
    faultResults: [
      {
        faultId: "f1",
        faultType: "latency",
        targetService: "payment-svc",
        status: "active",
        startedAt: BigInt(Date.now() - 60000),
        completedAt: null,
        errorMessage: null,
      },
      {
        faultId: "f2",
        faultType: "network_loss",
        targetService: "payment-svc",
        status: "injecting",
        startedAt: BigInt(Date.now() - 10000),
        completedAt: null,
        errorMessage: null,
      },
    ],
    metrics: [],
    hypothesis:
      "Circuit breaker opens within 5s and checkout degrades gracefully below 5% error rate.",
    hypothesisMet: null,
    abortReason: null,
  },
  {
    id: "run-006",
    experimentId: "exp-002",
    experimentName: "Auth CPU Starvation",
    status: "completed",
    startedAt: BigInt(Date.now() - 3600000) * BigInt(1000000),
    completedAt: BigInt(Date.now() - 3420000) * BigInt(1000000),
    triggeredBy: "sre-cli / platform-eng",
    faultResults: [
      {
        faultId: "f3",
        faultType: "cpu_starvation",
        targetService: "auth-svc",
        status: "resolved",
        startedAt: null,
        completedAt: null,
        errorMessage: null,
      },
    ],
    metrics: [],
    hypothesis:
      "Token validation remains under 400ms p99 even at 90% CPU saturation.",
    hypothesisMet: true,
    abortReason: null,
  },
  {
    id: "run-005",
    experimentId: "exp-004",
    experimentName: "Inventory Memory Pressure",
    status: "failed",
    startedAt: BigInt(Date.now() - 7200000) * BigInt(1000000),
    completedAt: BigInt(Date.now() - 7020000) * BigInt(1000000),
    triggeredBy: "scheduled / cron",
    faultResults: [
      {
        faultId: "f6",
        faultType: "memory_pressure",
        targetService: "inventory-svc",
        status: "failed",
        startedAt: null,
        completedAt: null,
        errorMessage: "OOM kill triggered before test window",
      },
    ],
    metrics: [],
    hypothesis:
      "Service restarts gracefully within 30s with no data corruption.",
    hypothesisMet: false,
    abortReason: null,
  },
];

const MOCK_LOGS_BASE: LogEntry[] = [
  {
    timestamp: BigInt(Date.now() - 65000) * BigInt(1000000),
    level: "info",
    source: "orchestrator",
    message:
      "Run run-007 started. Injecting latency fault on payment-svc (2 pods).",
  },
  {
    timestamp: BigInt(Date.now() - 60000) * BigInt(1000000),
    level: "info",
    source: "fault-agent",
    message: "Latency injection active: p99=2174ms, jitter=203ms",
  },
  {
    timestamp: BigInt(Date.now() - 45000) * BigInt(1000000),
    level: "warn",
    source: "probe/checkout-health",
    message: "Health check returning 503. Circuit breaker state: HALF_OPEN",
  },
  {
    timestamp: BigInt(Date.now() - 40000) * BigInt(1000000),
    level: "info",
    source: "probe/checkout-health",
    message: "Circuit breaker opened. Fallback route active.",
  },
  {
    timestamp: BigInt(Date.now() - 30000) * BigInt(1000000),
    level: "info",
    source: "metrics-collector",
    message: "Error rate: 3.2% (below 5% threshold). Throughput: 847 rps",
  },
  {
    timestamp: BigInt(Date.now() - 10000) * BigInt(1000000),
    level: "info",
    source: "fault-agent",
    message: "Network loss fault starting: 10% packet drop on payment-svc",
  },
  {
    timestamp: BigInt(Date.now() - 5000) * BigInt(1000000),
    level: "warn",
    source: "metrics-collector",
    message: "p99 latency spike detected: 2891ms on downstream calls",
  },
  {
    timestamp: BigInt(Date.now() - 2000) * BigInt(1000000),
    level: "info",
    source: "orchestrator",
    message: "All faults injected. Steady-state monitoring active.",
  },
];

const BASELINE_METRICS = {
  errorRate: 0.1,
  p50LatencyMs: 42,
  p95LatencyMs: 110,
  p99LatencyMs: 148,
  cpuUtilization: 28,
  memoryUtilization: 51,
};

const PROBE_DEFS = [
  { id: "probe-1", name: "checkout-health", type: "HTTP", passing: false },
  {
    id: "probe-2",
    name: "circuit-breaker-state",
    type: "script",
    passing: true,
  },
  {
    id: "probe-3",
    name: "error-rate-threshold",
    type: "script",
    passing: true,
  },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  running: "bg-chart-4/20 text-chart-4 border-chart-4/40",
  completed: "bg-chart-3/20 text-chart-3 border-chart-3/40",
  failed: "bg-destructive/20 text-destructive border-destructive/40",
  aborted: "bg-muted/40 text-muted-foreground border-border",
  pending: "bg-muted/40 text-muted-foreground border-border",
};

const FAULT_STATUS_DOT: Record<string, string> = {
  pending: "bg-muted-foreground",
  injecting: "bg-primary animate-pulse",
  active: "bg-destructive animate-pulse",
  recovering: "bg-chart-4",
  resolved: "bg-chart-3",
  failed: "bg-destructive",
};

const FAULT_ICONS: Record<string, React.ReactNode> = {
  latency: <Clock className="h-3 w-3" />,
  cpu_starvation: <Cpu className="h-3 w-3" />,
  memory_pressure: <MemoryStick className="h-3 w-3" />,
  network_loss: <Network className="h-3 w-3" />,
  regional_failure: <Server className="h-3 w-3" />,
  disk_io: <Database className="h-3 w-3" />,
  process_kill: <Zap className="h-3 w-3" />,
  dns_failure: <Wifi className="h-3 w-3" />,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({
  label,
  icon,
}: { label: string; icon?: React.ReactNode }) {
  return (
    <div className="px-3 py-2 border-b border-border flex items-center gap-2">
      {icon && <span className="text-primary">{icon}</span>}
      <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

function LogLine({ entry }: { entry: LogEntry }) {
  const ts = new Date(Number(entry.timestamp / BigInt(1000000)));
  return (
    <div
      className={cn(
        "flex gap-2 text-[10px] font-mono py-0.5 border-b border-border/20",
        entry.level === "error" && "text-destructive",
        entry.level === "warn" && "text-chart-4",
        entry.level === "info" && "text-foreground/90",
        entry.level === "debug" && "text-muted-foreground",
      )}
    >
      <span className="text-muted-foreground flex-shrink-0 w-16">
        {ts.toTimeString().slice(0, 8)}
      </span>
      <span
        className={cn("flex-shrink-0 w-4 uppercase font-bold", {
          "text-destructive": entry.level === "error",
          "text-chart-4": entry.level === "warn",
          "text-primary": entry.level === "info",
          "text-muted-foreground": entry.level === "debug",
        })}
      >
        {entry.level[0].toUpperCase()}
      </span>
      <span className="text-muted-foreground flex-shrink-0 w-32 truncate">
        [{entry.source}]
      </span>
      <span className="flex-1 break-all">{entry.message}</span>
    </div>
  );
}

function MiniSparkline({
  values,
  color = "oklch(0.72 0.2 190)",
}: { values: number[]; color?: string }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const W = 72;
  const H = 22;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * W;
      const y = H - ((v - min) / range) * (H - 2) - 1;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg
      width={W}
      height={H}
      className="flex-shrink-0"
      role="img"
      aria-label="Metric trend sparkline"
    >
      <title>Metric trend sparkline</title>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MetricCard({
  label,
  value,
  baseline,
  current,
  prevValue,
  icon,
  sparkValues,
  higherIsBetter = false,
}: {
  label: string;
  value: string;
  baseline: string;
  current: number;
  prevValue: number;
  icon: React.ReactNode;
  sparkValues: number[];
  higherIsBetter?: boolean;
}) {
  const rising = current > prevValue;
  const bad = higherIsBetter ? !rising : rising;
  return (
    <div className="bg-card border border-border rounded p-2.5 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <div className="flex items-end justify-between gap-1">
        <span className="text-xl font-display font-bold text-foreground leading-none">
          {value}
        </span>
        <MiniSparkline
          values={sparkValues}
          color={bad ? "oklch(0.65 0.2 25)" : "oklch(0.72 0.2 190)"}
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {rising ? (
            <TrendingUp
              className={cn(
                "h-2.5 w-2.5",
                bad ? "text-destructive" : "text-chart-3",
              )}
            />
          ) : (
            <TrendingDown
              className={cn(
                "h-2.5 w-2.5",
                bad ? "text-destructive" : "text-chart-3",
              )}
            />
          )}
          <span className="text-[9px] font-mono text-muted-foreground">
            {Math.abs(((current - prevValue) / (prevValue || 1)) * 100).toFixed(
              1,
            )}
            % vs prev
          </span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground/60">
          base: {baseline}
        </span>
      </div>
    </div>
  );
}

function TimelineBar({
  run,
  elapsedMs,
  totalMs,
}: { run: ExecutionRun; elapsedMs: number; totalMs: number }) {
  const pct = Math.min((elapsedMs / totalMs) * 100, 100);
  return (
    <div className="bg-card border border-border rounded p-3 flex-shrink-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          Experiment Timeline
        </span>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="text-foreground">
            <span className="text-muted-foreground">elapsed </span>
            <span className="text-primary font-bold">
              {formatDuration(elapsedMs)}
            </span>
          </span>
          <span className="text-foreground">
            <span className="text-muted-foreground">remaining </span>
            <span
              className={cn(
                "font-bold",
                run.status === "running"
                  ? "text-chart-4"
                  : "text-muted-foreground",
              )}
            >
              {run.status === "running"
                ? formatDuration(Math.max(totalMs - elapsedMs, 0))
                : "—"}
            </span>
          </span>
          <span className="text-muted-foreground">
            <span className="text-muted-foreground">affected </span>
            <span className="text-foreground font-bold">
              {run.faultResults.length * 2} instances
            </span>
          </span>
          <span className="text-muted-foreground">
            blast <span className="text-chart-4 font-bold">≤20% pods</span>
          </span>
        </div>
      </div>
      <div className="relative h-6 bg-secondary/40 rounded border border-border overflow-hidden">
        {/* Progress fill */}
        <div
          className="absolute inset-y-0 left-0 bg-primary/10 border-r border-primary/40 transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
        {/* Fault segments */}
        {run.faultResults.map((fr, i) => {
          const segStart = (i * 0.15 + 0.05) * 100;
          const segWidth = 0.35 * 100;
          const segColor =
            fr.status === "active"
              ? "bg-destructive/60"
              : fr.status === "injecting"
                ? "bg-primary/50"
                : fr.status === "resolved"
                  ? "bg-chart-3/50"
                  : fr.status === "failed"
                    ? "bg-destructive/80"
                    : "bg-muted-foreground/30";
          return (
            <div
              key={fr.faultId}
              className={cn(
                "absolute inset-y-1 rounded-sm text-[8px] font-mono flex items-center px-1 text-foreground/80 overflow-hidden",
                segColor,
              )}
              style={{ left: `${segStart}%`, width: `${segWidth}%` }}
              title={`${fr.faultType} → ${fr.targetService}`}
            >
              {fr.faultType.replace(/_/g, " ")}
            </div>
          );
        })}
        {/* Cursor */}
        {run.status === "running" && (
          <div
            className="absolute inset-y-0 w-px bg-primary shadow-[0_0_6px_oklch(0.72_0.2_190)] transition-all duration-1000"
            style={{ left: `${pct}%` }}
          />
        )}
      </div>
      <div className="flex justify-between mt-1 text-[9px] font-mono text-muted-foreground/60">
        <span>0s</span>
        <span>{Math.round(totalMs / 1000 / 2)}s</span>
        <span>{Math.round(totalMs / 1000)}s</span>
      </div>
    </div>
  );
}

function ProbeList({
  passing,
  probes,
}: { passing: boolean[]; probes: typeof PROBE_DEFS }) {
  return (
    <div className="flex flex-col gap-1">
      {probes.map((probe, i) => (
        <div
          key={probe.id}
          className="flex items-center justify-between px-2 py-1.5 bg-secondary/30 border border-border/50 rounded"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full flex-shrink-0",
                passing[i] ? "bg-chart-3" : "bg-destructive animate-pulse",
              )}
            />
            <span className="text-[10px] font-mono text-foreground truncate">
              {probe.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[9px] font-mono text-muted-foreground">
              {probe.type}
            </span>
            <span
              className={cn(
                "badge-status border text-[9px]",
                passing[i]
                  ? "bg-chart-3/15 text-chart-3 border-chart-3/30"
                  : "bg-destructive/15 text-destructive border-destructive/30",
              )}
            >
              {passing[i] ? "PASS" : "FAIL"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ResultsSummary({ run }: { run: ExecutionRun }) {
  const score = run.hypothesisMet ? 87 : 43;
  const passCount = run.faultResults.filter(
    (f) => f.status === "resolved",
  ).length;
  const failCount = run.faultResults.filter(
    (f) => f.status === "failed",
  ).length;
  const probePassRate = run.hypothesisMet ? 100 : 33;
  const plannedDuration = 300;
  const actualDuration = run.completedAt
    ? Number((run.completedAt - run.startedAt) / BigInt(1000000000))
    : 0;

  return (
    <div className="bg-card border border-border rounded p-4 flex-shrink-0">
      <div className="flex items-center gap-2 mb-3">
        {run.hypothesisMet ? (
          <CheckCircle2 className="h-4 w-4 text-chart-3" />
        ) : (
          <ShieldAlert className="h-4 w-4 text-destructive" />
        )}
        <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
          Experiment Results
        </span>
        <span
          className={cn(
            "badge-status border text-[10px] ml-auto",
            STATUS_STYLES[run.status],
          )}
        >
          {run.status}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {/* Resilience Score */}
        <div className="col-span-1 flex flex-col items-center justify-center bg-secondary/40 border border-border rounded p-3 gap-1">
          <Shield
            className={cn(
              "h-5 w-5 mb-1",
              score >= 70 ? "text-chart-3" : "text-destructive",
            )}
          />
          <span
            className={cn(
              "text-3xl font-display font-bold leading-none",
              score >= 70 ? "text-chart-3" : "text-destructive",
            )}
          >
            {score}
          </span>
          <span className="text-[9px] font-mono text-muted-foreground uppercase">
            Resilience Score
          </span>
        </div>
        {/* Stats */}
        <div className="col-span-4 grid grid-cols-4 gap-2">
          {[
            {
              label: "Probe Pass Rate",
              value: `${probePassRate}%`,
              ok: probePassRate >= 80,
              icon: <CheckCircle2 className="h-3 w-3" />,
            },
            {
              label: "Faults Executed",
              value: `${passCount + failCount}/${run.faultResults.length}`,
              ok: true,
              icon: <Zap className="h-3 w-3" />,
            },
            {
              label: "Faults Failed",
              value: `${failCount}`,
              ok: failCount === 0,
              icon: <AlertTriangle className="h-3 w-3" />,
            },
            {
              label: "Actual Duration",
              value: `${actualDuration}s vs ${plannedDuration}s`,
              ok: actualDuration <= plannedDuration * 1.1,
              icon: <Clock className="h-3 w-3" />,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-secondary/30 border border-border/50 rounded p-2 flex flex-col gap-1"
            >
              <div className="flex items-center gap-1 text-muted-foreground">
                {stat.icon}
              </div>
              <span
                className={cn(
                  "text-base font-display font-bold leading-none",
                  stat.ok ? "text-foreground" : "text-destructive",
                )}
              >
                {stat.value}
              </span>
              <span className="text-[9px] font-mono text-muted-foreground">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* Hypothesis verdict */}
      <div
        className={cn(
          "mt-3 p-2 rounded border text-[10px] font-mono",
          run.hypothesisMet
            ? "bg-chart-3/10 border-chart-3/30 text-chart-3"
            : "bg-destructive/10 border-destructive/30 text-destructive",
        )}
      >
        <span className="font-bold">
          {run.hypothesisMet ? "✓ HYPOTHESIS MET" : "✗ HYPOTHESIS FAILED"}
        </span>
        <span className="ml-2 text-muted-foreground">{run.hypothesis}</span>
      </div>
      {/* Anomalies */}
      {!run.hypothesisMet && (
        <div className="mt-2 p-2 bg-destructive/5 border border-destructive/20 rounded">
          <p className="text-[10px] font-mono text-destructive font-bold mb-1">
            ⚠ ANOMALIES DETECTED
          </p>
          {run.faultResults
            .filter((f) => f.errorMessage)
            .map((f) => (
              <p
                key={f.faultId}
                className="text-[9px] font-mono text-muted-foreground"
              >
                • {f.faultType}: {f.errorMessage}
              </p>
            ))}
          {run.faultResults
            .filter((f) => f.status === "failed" && !f.errorMessage)
            .map((f) => (
              <p
                key={f.faultId}
                className="text-[9px] font-mono text-muted-foreground"
              >
                • probe/checkout-health failed {3} times (threshold: 1)
              </p>
            ))}
        </div>
      )}
    </div>
  );
}

// ─── Launch Modal ─────────────────────────────────────────────────────────────

function LaunchModal({
  expId,
  onClose,
  onLaunch,
}: {
  expId: string;
  onClose: () => void;
  onLaunch: () => void;
}) {
  const exp = EXPERIMENTS_SEED.find((e) => e.id === expId);
  const detail = EXP_DETAILS[expId];
  if (!exp || !detail) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <dialog
        open
        className="bg-card border border-border rounded w-full max-w-lg shadow-elevation mx-4 p-0 text-foreground"
        aria-labelledby="launch-modal-title"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-chart-4" />
            <h2
              id="launch-modal-title"
              className="text-sm font-display font-bold text-foreground"
            >
              Launch Experiment
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-xs font-semibold text-foreground">{exp.name}</p>
          <p className="text-[10px] font-mono text-muted-foreground leading-relaxed">
            {detail.hypothesis}
          </p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Blast Radius", value: exp.blastRadius, warn: true },
              {
                label: "Fault Count",
                value: `${exp.faultCount} faults`,
                warn: false,
              },
              {
                label: "Est. Duration",
                value: `~${detail.durationMin}min`,
                warn: false,
              },
            ].map((item) => (
              <div
                key={item.label}
                className={cn(
                  "p-2 rounded border text-center",
                  item.warn
                    ? "bg-chart-4/10 border-chart-4/30"
                    : "bg-secondary/40 border-border",
                )}
              >
                <p
                  className={cn(
                    "text-xs font-bold font-mono",
                    item.warn ? "text-chart-4" : "text-foreground",
                  )}
                >
                  {item.value}
                </p>
                <p className="text-[9px] font-mono text-muted-foreground mt-0.5">
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-secondary/40 border border-border rounded p-2">
            <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5">
              Faults to inject
            </p>
            {detail.faults.map((f) => (
              <div
                key={f.name}
                className="flex items-baseline justify-between text-[10px] font-mono py-0.5 border-b border-border/20 last:border-0"
              >
                <span className="text-foreground font-semibold">{f.name}</span>
                <span className="text-muted-foreground">
                  {f.target} · {f.duration}
                </span>
              </div>
            ))}
          </div>

          {detail.blastDetail.approvalRequired && (
            <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/30 rounded text-[10px] font-mono text-destructive">
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              This experiment requires pre-approval. Confirm you have
              authorization.
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs font-mono h-7"
            onClick={onClose}
            data-ocid="launch-modal-cancel"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="text-xs font-mono h-7 gap-1.5 bg-primary text-primary-foreground"
            onClick={onLaunch}
            data-ocid="launch-modal-confirm"
          >
            <FlaskConical className="h-3 w-3" />
            Launch Experiment
          </Button>
        </div>
      </dialog>
    </div>
  );
}

// ─── Emergency Stop ───────────────────────────────────────────────────────────

function EmergencyStopBar({ onStop }: { onStop: () => void }) {
  return (
    <div className="flex-shrink-0 border border-destructive/60 bg-destructive/10 rounded flex items-center gap-3 px-3 py-2">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="h-2 w-2 rounded-full bg-destructive animate-pulse flex-shrink-0" />
        <span className="text-[10px] font-mono text-destructive font-bold uppercase tracking-wider">
          Experiment Running — Live Faults Active
        </span>
        <span className="text-[10px] font-mono text-muted-foreground hidden sm:block">
          Emergency stop terminates all faults immediately and restores service
          to baseline.
        </span>
      </div>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="h-8 text-xs gap-2 font-mono font-bold border border-destructive/60 flex-shrink-0 shadow-elevation"
        onClick={onStop}
        data-ocid="emergency-stop-btn"
      >
        <StopCircle className="h-4 w-4" />
        EMERGENCY STOP
      </Button>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return m > 0 ? `${m}m ${rem}s` : `${s}s`;
}

const LIVE_LOG_MESSAGES: Array<{
  level: LogEntry["level"];
  source: string;
  message: string;
}> = [
  {
    level: "info",
    source: "metrics-collector",
    message: "Sampling metrics: err=3.1%, p99=2210ms, rps=841",
  },
  {
    level: "info",
    source: "fault-agent",
    message: "Fault heartbeat OK. Latency injection holding at 2000ms target.",
  },
  {
    level: "warn",
    source: "probe/checkout-health",
    message: "Degraded response time: 1870ms (threshold: 1500ms)",
  },
  {
    level: "info",
    source: "orchestrator",
    message: "T+70s. Steady-state phase nominal. No auto-abort triggers.",
  },
  {
    level: "info",
    source: "metrics-collector",
    message: "Sampling metrics: err=2.9%, p99=2180ms, rps=853",
  },
  {
    level: "debug",
    source: "fault-agent",
    message: "Heartbeat tick 14 ACK. Lease renewed for fault f1.",
  },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MonitorPage() {
  const [selectedExpId, setSelectedExpId] = useState<string>("exp-001");
  const activeRunId = "run-007";
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [logFilter, setLogFilter] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>(MOCK_LOGS_BASE);
  const [probeStates, setProbeStates] = useState(
    PROBE_DEFS.map((p) => p.passing),
  );
  const [metrics, setMetrics] = useState(() => buildMetrics());
  const [tick, setTick] = useState(0);
  const [isHoveringLog, setIsHoveringLog] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const logMsgIdx = useRef(0);

  const activeRun = MOCK_RUNS.find((r) => r.id === activeRunId) ?? null;
  const isRunning = activeRun?.status === "running";
  const elapsedMs = activeRun
    ? Date.now() - Number(activeRun.startedAt / BigInt(1000000))
    : 0;
  const totalMs = 300_000;

  // ─ 3s polling simulation
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setTick((t) => t + 1);
      setMetrics(buildMetrics());
      // rotate probes
      setProbeStates((prev) => prev.map((p, i) => (i === 0 ? !p : p)));
      // stream log
      if (logMsgIdx.current < LIVE_LOG_MESSAGES.length) {
        const msg = LIVE_LOG_MESSAGES[logMsgIdx.current];
        setLogs((prev) => [
          ...prev,
          { ...msg, timestamp: BigInt(Date.now()) * BigInt(1000000) },
        ]);
        logMsgIdx.current += 1;
      }
    }, 3000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on logs length
  useEffect(() => {
    if (!isHoveringLog && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs.length, isHoveringLog]);

  const filteredLogs = useMemo(() => {
    if (!logFilter) return logs;
    const q = logFilter.toLowerCase();
    return logs.filter(
      (l) =>
        l.message.toLowerCase().includes(q) ||
        l.source.toLowerCase().includes(q),
    );
  }, [logs, logFilter]);

  const latestMetric = metrics[metrics.length - 1];
  const prevMetric = metrics[metrics.length - 2];

  function handleLaunch() {
    setShowLaunchModal(false);
    // In a real app would call actor.startExperiment
  }

  function handleEmergencyStop() {
    // In a real app would call actor.emergencyStop
  }

  const selectedDetail = EXP_DETAILS[selectedExpId];
  const selectedExp = EXPERIMENTS_SEED.find((e) => e.id === selectedExpId);

  return (
    <Layout>
      {showLaunchModal && (
        <LaunchModal
          expId={selectedExpId}
          onClose={() => setShowLaunchModal(false)}
          onLaunch={handleLaunch}
        />
      )}

      <div className="flex gap-3" style={{ height: "calc(100vh - 116px)" }}>
        {/* ── Left: Experiment selector ──────────────────── */}
        <div className="w-60 flex-shrink-0 bg-card border border-border rounded overflow-hidden flex flex-col">
          <SectionHeader
            label="Experiments"
            icon={<FlaskConical className="h-3.5 w-3.5" />}
          />
          <div className="flex-1 overflow-y-auto" data-ocid="experiment-list">
            {EXPERIMENTS_SEED.map((exp) => (
              <button
                type="button"
                key={exp.id}
                onClick={() => setSelectedExpId(exp.id)}
                data-ocid={`exp-row-${exp.id}`}
                className={cn(
                  "w-full text-left px-3 py-2.5 border-b border-border/40 transition-smooth",
                  selectedExpId === exp.id
                    ? "bg-primary/10 border-l-2 border-l-primary"
                    : "hover:bg-secondary/30 border-l-2 border-l-transparent",
                )}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[9px] font-mono text-muted-foreground/70">
                    {exp.id}
                  </span>
                  <span
                    className={cn(
                      "badge-status border text-[9px] font-mono uppercase",
                      exp.status === "ready"
                        ? "bg-chart-3/15 text-chart-3 border-chart-3/30"
                        : "bg-muted/40 text-muted-foreground border-border",
                    )}
                  >
                    {exp.status}
                  </span>
                </div>
                <p className="text-xs font-semibold text-foreground leading-tight truncate">
                  {exp.name}
                </p>
                <p className="text-[9px] font-mono text-muted-foreground mt-0.5 truncate">
                  {exp.target}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[9px] font-mono text-muted-foreground/70">
                  <span>{exp.faultCount} faults</span>
                  <span>·</span>
                  <span className="truncate">{exp.blastRadius}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Right: Main content ────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col gap-3 overflow-y-auto">
          {/* Config summary + Launch */}
          {selectedExp && selectedDetail && (
            <div
              className="bg-card border border-border rounded flex-shrink-0"
              data-ocid="exp-config-panel"
            >
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
                <div className="flex items-center gap-2 min-w-0">
                  <FlaskConical className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="font-display font-bold text-sm text-foreground truncate">
                    {selectedExp.name}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground flex-shrink-0">
                    {selectedExp.id}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {activeRun?.experimentId === selectedExpId &&
                    activeRun.status === "running" && (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-chart-4 border border-chart-4/30 bg-chart-4/10 rounded px-2 py-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-chart-4 animate-pulse" />
                        RUNNING
                      </span>
                    )}
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 text-xs gap-1.5 font-mono"
                    onClick={() => setShowLaunchModal(true)}
                    disabled={isRunning}
                    data-ocid="launch-experiment-btn"
                  >
                    <FlaskConical className="h-3 w-3" />
                    Launch
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 divide-x divide-border">
                {/* Faults */}
                <div className="p-3">
                  <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-2">
                    Faults ({selectedDetail.faults.length})
                  </p>
                  <div className="space-y-1.5">
                    {selectedDetail.faults.map((f) => (
                      <div key={f.name} className="flex items-start gap-1.5">
                        <span className="text-primary mt-0.5 flex-shrink-0">
                          {FAULT_ICONS[
                            f.name.toLowerCase().replace(/ /g, "_")
                          ] ?? <Zap className="h-3 w-3" />}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold text-foreground truncate">
                            {f.name}
                          </p>
                          <p className="text-[9px] font-mono text-muted-foreground">
                            {f.target} · {f.duration}
                          </p>
                          <p className="text-[9px] font-mono text-muted-foreground/60 truncate">
                            {f.params}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Probes */}
                <div className="p-3">
                  <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-2">
                    Probes ({selectedDetail.probes.length})
                  </p>
                  <div className="space-y-1.5">
                    {selectedDetail.probes.map((pr) => (
                      <div key={pr.name} className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold text-foreground truncate">
                            {pr.name}
                          </p>
                          <p className="text-[9px] font-mono text-muted-foreground">
                            {pr.type} · {pr.endpoint}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Blast + Hypothesis */}
                <div className="p-3">
                  <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-2">
                    Blast Radius
                  </p>
                  <div className="space-y-0.5 mb-3">
                    <p className="text-[10px] font-mono text-foreground">
                      ≤{selectedDetail.blastDetail.maxInstances} instances (
                      {selectedDetail.blastDetail.maxPct}%)
                    </p>
                    <p className="text-[9px] font-mono text-muted-foreground">
                      {selectedDetail.blastDetail.envs.join(", ")}
                    </p>
                    {selectedDetail.blastDetail.approvalRequired && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-mono text-chart-4 border border-chart-4/30 bg-chart-4/10 rounded px-1.5 py-0.5">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        requires approval
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
                    Hypothesis
                  </p>
                  <p className="text-[9px] font-mono text-muted-foreground/80 leading-relaxed line-clamp-4">
                    {selectedDetail.hypothesis}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Active run section */}
          {activeRun && (
            <>
              {/* Emergency Stop — always visible during running */}
              {isRunning && <EmergencyStopBar onStop={handleEmergencyStop} />}

              {/* Run status header */}
              <div className="bg-card border border-border rounded px-3 py-2.5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "h-2.5 w-2.5 rounded-full flex-shrink-0",
                      activeRun.status === "running"
                        ? "bg-destructive animate-pulse"
                        : activeRun.status === "completed"
                          ? "bg-chart-3"
                          : "bg-muted-foreground",
                    )}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-bold text-sm text-foreground truncate">
                        {activeRun.experimentName}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {activeRun.id}
                      </span>
                      <span
                        className={cn(
                          "badge-status border text-[10px] font-mono uppercase",
                          STATUS_STYLES[activeRun.status],
                        )}
                      >
                        {activeRun.status === "running" && (
                          <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current animate-pulse inline-block" />
                        )}
                        {activeRun.status}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground">
                      triggered by {activeRun.triggeredBy} ·{" "}
                      {activeRun.faultResults.length} faults ·{" "}
                      {isRunning
                        ? `${formatDuration(elapsedMs)} elapsed`
                        : "run complete"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1 font-mono"
                    data-ocid="refresh-run-btn"
                    onClick={() => {
                      setMetrics(buildMetrics());
                      setTick((t) => t + 1);
                    }}
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>
                </div>
              </div>

              {/* Timeline */}
              {isRunning && (
                <TimelineBar
                  run={activeRun}
                  elapsedMs={elapsedMs + tick * 3000}
                  totalMs={totalMs}
                />
              )}

              {/* Results summary for finished runs */}
              {!isRunning && <ResultsSummary run={activeRun} />}

              {/* Metrics grid */}
              <div
                className="grid grid-cols-3 gap-2 flex-shrink-0"
                data-ocid="metrics-grid"
              >
                {buildMetricCards(latestMetric, prevMetric).map((m) => (
                  <MetricCard
                    key={m.label}
                    {...m}
                    sparkValues={metrics.map(m.selector)}
                  />
                ))}
              </div>

              {/* Bottom row: active faults + probes + log stream */}
              <div
                className="grid grid-cols-[200px_1fr] gap-3 flex-shrink-0 min-h-0"
                style={{ minHeight: 260 }}
              >
                {/* Left: faults + probes */}
                <div className="bg-card border border-border rounded overflow-hidden flex flex-col">
                  <SectionHeader
                    label="Active Faults"
                    icon={<Zap className="h-3.5 w-3.5" />}
                  />
                  <div
                    className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5"
                    data-ocid="active-faults"
                  >
                    {activeRun.faultResults.map((fr) => (
                      <FaultCard key={fr.faultId} fault={fr} />
                    ))}
                    {activeRun.faultResults.length === 0 && (
                      <p className="text-[10px] font-mono text-muted-foreground text-center py-4">
                        No faults
                      </p>
                    )}
                    {isRunning && (
                      <div className="mt-2 border-t border-border/50 pt-2">
                        <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5">
                          Probes (3s refresh)
                        </p>
                        <ProbeList passing={probeStates} probes={PROBE_DEFS} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: log stream */}
                <div className="bg-card border border-border rounded overflow-hidden flex flex-col">
                  <div className="px-3 py-2 border-b border-border flex items-center gap-2 flex-shrink-0">
                    <Terminal className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                      Log Stream
                    </span>
                    {isRunning && (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-primary">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        LIVE
                      </span>
                    )}
                    <div className="ml-auto flex items-center gap-1.5 w-44">
                      <Search className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <Input
                        type="text"
                        placeholder="filter logs..."
                        value={logFilter}
                        onChange={(e) => setLogFilter(e.target.value)}
                        className="h-5 text-[10px] font-mono bg-secondary/40 border-border/60 px-1.5 py-0"
                        data-ocid="log-filter-input"
                      />
                      {logFilter && (
                        <button
                          type="button"
                          onClick={() => setLogFilter("")}
                          className="text-muted-foreground hover:text-foreground flex-shrink-0"
                          aria-label="Clear filter"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div
                    ref={logRef}
                    className="flex-1 overflow-y-auto p-2 bg-background/60"
                    data-ocid="log-stream"
                    onMouseEnter={() => setIsHoveringLog(true)}
                    onMouseLeave={() => setIsHoveringLog(false)}
                  >
                    {filteredLogs.length === 0 ? (
                      <p className="text-[10px] font-mono text-muted-foreground text-center py-4">
                        No matching log entries
                      </p>
                    ) : (
                      filteredLogs.map((entry) => (
                        <LogLine
                          key={`${entry.source}-${entry.timestamp}`}
                          entry={entry}
                        />
                      ))
                    )}
                  </div>
                  {isHoveringLog && (
                    <div className="px-3 py-1 border-t border-border/50 bg-secondary/30">
                      <span className="text-[9px] font-mono text-muted-foreground">
                        Auto-scroll paused · move cursor away to resume
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* No active run empty state */}
          {!activeRun && (
            <div
              className="flex-1 flex flex-col items-center justify-center gap-3 text-center"
              data-ocid="no-active-run"
            >
              <Activity className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm font-display font-semibold text-muted-foreground">
                No active run
              </p>
              <p className="text-xs font-mono text-muted-foreground/60">
                Select an experiment and click Launch to start monitoring.
              </p>
              <Button
                type="button"
                size="sm"
                className="text-xs font-mono gap-1.5"
                onClick={() => setShowLaunchModal(true)}
                data-ocid="launch-from-empty"
              >
                <FlaskConical className="h-3 w-3" />
                Launch Experiment
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

// ─── Fault Card ───────────────────────────────────────────────────────────────

function FaultCard({ fault }: { fault: FaultResult }) {
  return (
    <div className="p-2 bg-secondary/40 border border-border/60 rounded">
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full flex-shrink-0",
            FAULT_STATUS_DOT[fault.status],
          )}
        />
        <span className="text-[10px] font-mono font-bold text-foreground uppercase truncate">
          {fault.faultType.replace(/_/g, " ")}
        </span>
        <span
          className={cn("ml-auto text-[9px] font-mono uppercase", {
            "text-destructive":
              fault.status === "active" || fault.status === "failed",
            "text-primary": fault.status === "injecting",
            "text-chart-3": fault.status === "resolved",
            "text-muted-foreground":
              fault.status === "pending" || fault.status === "recovering",
          })}
        >
          {fault.status}
        </span>
      </div>
      <p className="text-[9px] font-mono text-muted-foreground">
        → {fault.targetService}
      </p>
      {fault.errorMessage && (
        <p className="text-[9px] font-mono text-destructive mt-0.5 break-words">
          {fault.errorMessage}
        </p>
      )}
    </div>
  );
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function buildMetrics(): MetricsSnapshot[] {
  return Array.from({ length: 12 }, (_, i) => ({
    timestamp: BigInt(Date.now() - (11 - i) * 5000),
    errorRate:
      i < 4
        ? 0.3 + i * 0.2
        : i < 8
          ? 3.2 + Math.random() * 0.5
          : 2.8 + Math.random() * 0.3,
    p99LatencyMs:
      i < 4
        ? 120 + i * 20
        : i < 8
          ? 2100 + Math.random() * 200
          : 2400 + Math.random() * 300,
    p50LatencyMs: i < 4 ? 45 + i * 5 : 180 + Math.random() * 20,
    throughputRps: 900 - i * 5 + Math.random() * 20,
    availabilityPct: i < 5 ? 99.9 : 98.8 + Math.random() * 0.5,
    activeAlertsCount: i < 4 ? 0 : i < 6 ? 2 : 3,
  }));
}

function buildMetricCards(
  latest: MetricsSnapshot,
  prev: MetricsSnapshot,
): Array<{
  label: string;
  value: string;
  baseline: string;
  current: number;
  prevValue: number;
  icon: React.ReactNode;
  higherIsBetter?: boolean;
  selector: (s: MetricsSnapshot) => number;
}> {
  return [
    {
      label: "Error Rate",
      value: `${latest.errorRate.toFixed(1)}%`,
      baseline: `${BASELINE_METRICS.errorRate}%`,
      current: latest.errorRate,
      prevValue: prev.errorRate,
      icon: <AlertTriangle className="h-3 w-3" />,
      higherIsBetter: false,
      selector: (s) => s.errorRate,
    },
    {
      label: "P99 Latency",
      value: `${Math.round(latest.p99LatencyMs)}ms`,
      baseline: `${BASELINE_METRICS.p99LatencyMs}ms`,
      current: latest.p99LatencyMs,
      prevValue: prev.p99LatencyMs,
      icon: <Clock className="h-3 w-3" />,
      higherIsBetter: false,
      selector: (s) => s.p99LatencyMs,
    },
    {
      label: "P50 Latency",
      value: `${Math.round(latest.p50LatencyMs)}ms`,
      baseline: `${BASELINE_METRICS.p50LatencyMs}ms`,
      current: latest.p50LatencyMs,
      prevValue: prev.p50LatencyMs,
      icon: <Activity className="h-3 w-3" />,
      higherIsBetter: false,
      selector: (s) => s.p50LatencyMs,
    },
  ];
}
