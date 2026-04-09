import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface BlastRadiusConfig {
    autoRollback: boolean;
    trafficPercentage: bigint;
    instancePercentage: bigint;
    maxDurationSeconds: bigint;
    geographicScope: Variant_multi_global_single;
}
export interface ScoreHistoryEntry {
    score: bigint;
    timestamp: Timestamp;
    runId: RunId;
}
export type Timestamp = bigint;
export interface MetricsSnapshot {
    probeResults: Array<ProbeResult>;
    affectedServiceCount: bigint;
    cpuUtilization: number;
    errorRate: number;
    latencyP50: number;
    latencyP95: number;
    latencyP99: number;
    memoryUtilization: number;
}
export type ProbeType = {
    __kind__: "metricThreshold";
    metricThreshold: {
        threshold: number;
        operator: string;
        metricName: string;
    };
} | {
    __kind__: "custom";
    custom: {
        description: string;
        command: string;
    };
} | {
    __kind__: "http";
    http: {
        url: string;
        expectedStatusCode: bigint;
        timeoutSeconds: bigint;
    };
};
export interface ProbeResult {
    probeName: string;
    message: string;
    checkedAt: Timestamp;
    passed: boolean;
    probeId: bigint;
}
export interface OrganizationStats {
    breakdownByService: Array<ServiceBreakdown>;
    breakdownByInfrastructure: Array<InfraBreakdown>;
    scoreHistory: Array<ScoreHistoryEntry>;
    currentScore: bigint;
    topFailureModes: Array<FailureMode>;
}
export interface InfraBreakdown {
    runCount: bigint;
    infrastructure: string;
    averageScore: bigint;
}
export interface FaultResultView {
    status: FaultRunStatus;
    completedAt?: Timestamp;
    startedAt?: Timestamp;
    affectedInstances: bigint;
    faultId: FaultId;
}
export type FaultId = bigint;
export interface ProbeConfig {
    id: bigint;
    name: string;
    probeType: ProbeType;
}
export interface ExperimentView {
    id: ExperimentId;
    status: ExperimentStatus;
    isTemplate: boolean;
    owner: string;
    name: string;
    createdAt: Timestamp;
    tags: Array<string>;
    description: string;
    hypothesis: string;
    updatedAt: Timestamp;
    infrastructureTarget: InfrastructureTarget;
    probes: Array<ProbeConfig>;
    blastRadius: BlastRadiusConfig;
    faults: Array<FaultConfig>;
}
export interface ExperimentInput {
    isTemplate: boolean;
    name: string;
    tags: Array<string>;
    description: string;
    hypothesis: string;
    infrastructureTarget: InfrastructureTarget;
    probes: Array<ProbeConfig>;
    blastRadius: BlastRadiusConfig;
    faults: Array<FaultConfig>;
}
export interface FaultConfig {
    id: FaultId;
    severityWeight: bigint;
    sequenceOrder: bigint;
    parameters: Array<FaultParameter>;
    durationSeconds: bigint;
    faultType: string;
}
export interface ExecutionRunView {
    id: RunId;
    status: RunStatus;
    completedAt?: Timestamp;
    faultResults: Array<FaultResultView>;
    startedAt?: Timestamp;
    metrics?: MetricsSnapshot;
    experimentId: ExperimentId;
    actualDurationSeconds: bigint;
    resilienceScore?: bigint;
}
export interface ServiceBreakdown {
    service: string;
    failureCount: bigint;
    averageScore: bigint;
}
export interface LogEntry {
    id: bigint;
    result: string;
    affectedTarget: string;
    action: string;
    timestamp: Timestamp;
    experimentRunId: RunId;
    faultType: string;
}
export type ExperimentId = bigint;
export interface DateRangeFilter {
    toTs?: Timestamp;
    fromTs?: Timestamp;
}
export type RunId = bigint;
export interface FailureMode {
    occurrenceCount: bigint;
    faultType: string;
    averageSeverity: bigint;
}
export interface RecentRunSummary {
    status: string;
    experimentId: ExperimentId;
    date: Timestamp;
    score?: bigint;
    faultCount: bigint;
    probePassRate: number;
    runId: RunId;
    experimentName: string;
}
export interface FaultParameter {
    key: string;
    value: string;
}
export enum ExperimentStatus {
    scheduled = "scheduled",
    stopped = "stopped",
    completed = "completed",
    error = "error",
    draft = "draft",
    running = "running"
}
export enum FaultRunStatus {
    pending = "pending",
    completed = "completed",
    executing = "executing",
    failed = "failed"
}
export enum InfrastructureTarget {
    aws = "aws",
    azure = "azure",
    custom = "custom",
    kubernetes = "kubernetes",
    linux = "linux"
}
export enum RunStatus {
    stopped = "stopped",
    completed = "completed",
    error = "error",
    queued = "queued",
    running = "running"
}
export enum Variant_multi_global_single {
    multi = "multi",
    global = "global",
    single = "single"
}
export interface backendInterface {
    addLogEntry(runId: RunId, faultType: string, action: string, result: string, affectedTarget: string): Promise<LogEntry>;
    cloneExperiment(sourceId: ExperimentId): Promise<ExperimentView | null>;
    completeRun(runId: RunId, metrics: MetricsSnapshot): Promise<boolean>;
    createExperiment(input: ExperimentInput): Promise<ExperimentView>;
    deleteExperiment(id: ExperimentId): Promise<boolean>;
    emergencyStop(runId: RunId): Promise<boolean>;
    filterRuns(dateRange: DateRangeFilter, infrastructure: string | null, service: string | null): Promise<Array<RecentRunSummary>>;
    getExecutionRun(id: RunId): Promise<ExecutionRunView | null>;
    getExperiment(id: ExperimentId): Promise<ExperimentView | null>;
    getOrganizationStats(): Promise<OrganizationStats>;
    getRecentRuns(limit: bigint): Promise<Array<RecentRunSummary>>;
    getRunLogs(runId: RunId): Promise<Array<LogEntry>>;
    getTopFailureModes(): Promise<Array<FailureMode>>;
    listExperiments(): Promise<Array<ExperimentView>>;
    listRunsByExperiment(experimentId: ExperimentId): Promise<Array<ExecutionRunView>>;
    listTemplates(): Promise<Array<ExperimentView>>;
    startExperiment(experimentId: ExperimentId): Promise<ExecutionRunView | null>;
    updateExperiment(id: ExperimentId, input: ExperimentInput): Promise<boolean>;
    updateFaultResult(runId: RunId, faultId: FaultId, status: FaultRunStatus, affectedInstances: bigint): Promise<boolean>;
}
