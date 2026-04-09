export type ExperimentStatus =
  | "draft"
  | "ready"
  | "running"
  | "completed"
  | "failed"
  | "aborted";
export type RunStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "aborted";
export type FaultType =
  | "latency"
  | "cpu_starvation"
  | "memory_pressure"
  | "network_loss"
  | "regional_failure"
  | "disk_io"
  | "process_kill"
  | "dns_failure";

export interface FaultConfig {
  id: string;
  faultType: FaultType;
  targetService: string;
  parameters: Record<string, string>;
  durationSeconds: number;
  enabled: boolean;
}

export interface BlastRadiusConfig {
  maxAffectedInstances: number;
  maxAffectedPercentage: number;
  targetEnvironments: string[];
  excludeServices: string[];
  requireApproval: boolean;
}

export interface ProbeConfig {
  id: string;
  name: string;
  probeType: "http" | "tcp" | "script";
  endpoint: string;
  intervalSeconds: number;
  timeoutSeconds: number;
  successThreshold: number;
  failureThreshold: number;
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  status: ExperimentStatus;
  hypothesis: string;
  faults: FaultConfig[];
  blastRadius: BlastRadiusConfig;
  probes: ProbeConfig[];
  tags: string[];
  createdAt: bigint;
  updatedAt: bigint;
  owner: string;
}

export interface FaultResult {
  faultId: string;
  faultType: FaultType;
  targetService: string;
  status:
    | "pending"
    | "injecting"
    | "active"
    | "recovering"
    | "resolved"
    | "failed";
  startedAt: bigint | null;
  completedAt: bigint | null;
  errorMessage: string | null;
}

export interface MetricsSnapshot {
  timestamp: bigint;
  errorRate: number;
  p99LatencyMs: number;
  p50LatencyMs: number;
  throughputRps: number;
  availabilityPct: number;
  activeAlertsCount: number;
}

export interface LogEntry {
  timestamp: bigint;
  level: "debug" | "info" | "warn" | "error";
  source: string;
  message: string;
}

export interface ExecutionRun {
  id: string;
  experimentId: string;
  experimentName: string;
  status: RunStatus;
  startedAt: bigint;
  completedAt: bigint | null;
  triggeredBy: string;
  faultResults: FaultResult[];
  metrics: MetricsSnapshot[];
  hypothesis: string;
  hypothesisMet: boolean | null;
  abortReason: string | null;
}

export interface RecentRunSummary {
  runId: string;
  experimentName: string;
  status: RunStatus;
  startedAt: bigint;
  durationSeconds: number | null;
  impactScore: number;
  hypothesisMet: boolean | null;
}

export interface ScoreHistoryEntry {
  timestamp: bigint;
  score: number;
  runId: string | null;
  notes: string;
}

export interface OrganizationStats {
  currentScore: number;
  totalExperiments: number;
  totalRuns: number;
  successRate: number;
  averageImpactScore: number;
  topWeaknesses: string[];
  lastRunAt: bigint | null;
}

export type NavSection = "designer" | "monitor" | "dashboard";
