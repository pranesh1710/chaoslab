import { Layout } from "@/components/Layout";
import { ExperimentDetail } from "@/components/designer/ExperimentDetail";
import { ExperimentForm } from "@/components/designer/ExperimentForm";
import { FAULT_TYPE_LABELS } from "@/components/designer/FaultLibrary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Experiment, ExperimentStatus, FaultType } from "@/types";
import { FlaskConical, Plus } from "lucide-react";
import { useState } from "react";

const STATUS_STYLES: Record<ExperimentStatus, string> = {
  draft: "bg-muted/60 text-muted-foreground border-border",
  ready: "bg-primary/15 text-primary border-primary/40",
  running: "bg-chart-4/20 text-chart-4 border-chart-4/40",
  completed: "bg-chart-3/20 text-chart-3 border-chart-3/40",
  failed: "bg-destructive/20 text-destructive border-destructive/40",
  aborted: "bg-muted/40 text-muted-foreground border-border",
};

function StatusBadge({ status }: { status: ExperimentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-sm border font-mono text-[10px] uppercase tracking-wider flex-shrink-0",
        STATUS_STYLES[status],
      )}
    >
      {status === "running" && (
        <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current animate-pulse inline-block" />
      )}
      {status}
    </span>
  );
}

function FaultChip({ type }: { type: FaultType }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-mono bg-secondary border border-border text-muted-foreground whitespace-nowrap">
      {FAULT_TYPE_LABELS[type]}
    </span>
  );
}

const SEED: Experiment[] = [
  {
    id: "exp-001",
    name: "Payment Service Latency Storm",
    description:
      "Inject 2000ms latency on payment-svc to validate circuit breaker and fallback.",
    status: "ready",
    hypothesis:
      "Circuit breaker opens within 5s. Checkout error rate stays below 5%.",
    faults: [
      {
        id: "f1",
        faultType: "latency",
        targetService: "payment-svc",
        parameters: { delay_ms: "2000", jitter_ms: "200" },
        durationSeconds: 120,
        enabled: true,
      },
      {
        id: "f2",
        faultType: "network_loss",
        targetService: "payment-svc",
        parameters: { loss_pct: "10" },
        durationSeconds: 60,
        enabled: true,
      },
    ],
    blastRadius: {
      maxAffectedInstances: 2,
      maxAffectedPercentage: 20,
      targetEnvironments: ["staging"],
      excludeServices: ["auth-svc"],
      requireApproval: false,
    },
    probes: [
      {
        id: "p1",
        name: "Checkout Health",
        probeType: "http",
        endpoint: "https://api.staging/health/checkout",
        intervalSeconds: 5,
        timeoutSeconds: 2,
        successThreshold: 2,
        failureThreshold: 3,
      },
    ],
    tags: ["payment", "circuit-breaker", "latency", "kubernetes"],
    createdAt: BigInt(Date.now() - 86400000) * BigInt(1000000),
    updatedAt: BigInt(Date.now() - 3600000) * BigInt(1000000),
    owner: "sre-team",
  },
  {
    id: "exp-002",
    name: "Auth CPU Starvation",
    description:
      "Starve auth-svc CPU to validate token validation caching holds under pressure.",
    status: "completed",
    hypothesis:
      "Token validation stays under 400ms p99 at 90% CPU via caching layer.",
    faults: [
      {
        id: "f3",
        faultType: "cpu_starvation",
        targetService: "auth-svc",
        parameters: { cpu_pct: "90" },
        durationSeconds: 180,
        enabled: true,
      },
    ],
    blastRadius: {
      maxAffectedInstances: 1,
      maxAffectedPercentage: 10,
      targetEnvironments: ["staging"],
      excludeServices: [],
      requireApproval: true,
    },
    probes: [],
    tags: ["auth", "cpu", "performance", "kubernetes"],
    createdAt: BigInt(Date.now() - 172800000) * BigInt(1000000),
    updatedAt: BigInt(Date.now() - 7200000) * BigInt(1000000),
    owner: "platform-eng",
  },
  {
    id: "exp-003",
    name: "US-East Regional Failover",
    description:
      "Simulate us-east-1 outage to validate multi-region DNS cutover timing.",
    status: "draft",
    hypothesis: "Traffic routes to us-west-2 within 90s with <1% data loss.",
    faults: [
      {
        id: "f4",
        faultType: "regional_failure",
        targetService: "all",
        parameters: { region: "us-east-1" },
        durationSeconds: 300,
        enabled: true,
      },
      {
        id: "f5",
        faultType: "dns_failure",
        targetService: "api-gateway",
        parameters: { zone: "us-east-1.internal" },
        durationSeconds: 120,
        enabled: false,
      },
    ],
    blastRadius: {
      maxAffectedInstances: 10,
      maxAffectedPercentage: 50,
      targetEnvironments: ["staging"],
      excludeServices: [],
      requireApproval: true,
    },
    probes: [
      {
        id: "p2",
        name: "Global Availability",
        probeType: "http",
        endpoint: "https://status.example.com/api/health",
        intervalSeconds: 10,
        timeoutSeconds: 5,
        successThreshold: 1,
        failureThreshold: 3,
      },
    ],
    tags: ["regional", "failover", "dns", "high-impact", "aws"],
    createdAt: BigInt(Date.now() - 259200000) * BigInt(1000000),
    updatedAt: BigInt(Date.now() - 600000) * BigInt(1000000),
    owner: "infra-sre",
  },
  {
    id: "exp-004",
    name: "Inventory Memory Pressure",
    description:
      "Apply memory pressure on inventory-svc to verify OOM eviction behavior.",
    status: "failed",
    hypothesis:
      "Service restarts gracefully within 30s with no data corruption at 95% memory.",
    faults: [
      {
        id: "f6",
        faultType: "memory_pressure",
        targetService: "inventory-svc",
        parameters: { mem_pct: "95", fill_rate: "fast" },
        durationSeconds: 90,
        enabled: true,
      },
    ],
    blastRadius: {
      maxAffectedInstances: 1,
      maxAffectedPercentage: 5,
      targetEnvironments: ["staging"],
      excludeServices: [],
      requireApproval: false,
    },
    probes: [],
    tags: ["memory", "oom", "inventory", "kubernetes"],
    createdAt: BigInt(Date.now() - 345600000) * BigInt(1000000),
    updatedAt: BigInt(Date.now() - 1800000) * BigInt(1000000),
    owner: "backend-sre",
  },
];

type FilterStatus = "all" | ExperimentStatus;
type PanelMode = "detail" | "create" | "edit";

const FILTERS: { label: string; value: FilterStatus }[] = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Ready", value: "ready" },
  { label: "Running", value: "running" },
  { label: "Completed", value: "completed" },
  { label: "Failed", value: "failed" },
];

export default function DesignerPage() {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [selected, setSelected] = useState<string | null>("exp-001");
  const [panelMode, setPanelMode] = useState<PanelMode>("detail");
  const [experiments, setExperiments] = useState<Experiment[]>(SEED);

  const filtered =
    filter === "all"
      ? experiments
      : experiments.filter((e) => e.status === filter);
  const selectedExp = experiments.find((e) => e.id === selected);

  const handleNew = () => {
    setSelected(null);
    setPanelMode("create");
  };

  const handleSelect = (id: string) => {
    setSelected(id);
    setPanelMode("detail");
  };

  const handleEdit = () => setPanelMode("edit");

  const handleClone = () => {
    if (!selectedExp) return;
    const cloned: Experiment = {
      ...selectedExp,
      id: `exp-${Date.now().toString(36)}`,
      name: `${selectedExp.name} (Clone)`,
      status: "draft",
      createdAt: BigInt(Date.now()) * BigInt(1000000),
      updatedAt: BigInt(Date.now()) * BigInt(1000000),
    };
    setExperiments((prev) => [cloned, ...prev]);
    setSelected(cloned.id);
    setPanelMode("detail");
  };

  const handleDelete = () => {
    if (!selectedExp) return;
    setExperiments((prev) => prev.filter((e) => e.id !== selectedExp.id));
    setSelected(null);
    setPanelMode("create");
  };

  const handleSave = (exp: Experiment, _asTemplate: boolean) => {
    setExperiments((prev) => {
      const idx = prev.findIndex((e) => e.id === exp.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = exp;
        return next;
      }
      return [exp, ...prev];
    });
    setSelected(exp.id);
    setPanelMode("detail");
  };

  const handleCancel = () => {
    if (selected) setPanelMode("detail");
    else setSelected(null);
  };

  return (
    <Layout>
      <div
        className="flex gap-3 h-full min-h-0"
        style={{ height: "calc(100vh - 116px)" }}
      >
        {/* Left panel */}
        <div className="flex flex-col w-80 flex-shrink-0 bg-card border border-border rounded overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
            <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
              Experiments ({filtered.length})
            </span>
            <Button
              type="button"
              size="sm"
              className="h-7 text-xs gap-1 font-mono"
              onClick={handleNew}
              data-ocid="create-experiment-btn"
            >
              <Plus className="h-3.5 w-3.5" /> New
            </Button>
          </div>

          <div
            className="flex gap-1 px-2 py-2 border-b border-border overflow-x-auto flex-shrink-0"
            data-ocid="experiment-filter"
          >
            {FILTERS.map((f) => (
              <button
                type="button"
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "px-2 py-0.5 rounded-sm text-[10px] font-mono whitespace-nowrap border transition-colors",
                  filter === f.value
                    ? "bg-primary/20 text-primary border-primary/40"
                    : "text-muted-foreground border-transparent hover:border-border hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto" data-ocid="experiment-list">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-[10px] font-mono text-muted-foreground">
                No experiments match filter
              </div>
            ) : (
              filtered.map((exp) => (
                <button
                  type="button"
                  key={exp.id}
                  onClick={() => handleSelect(exp.id)}
                  data-ocid={`experiment-row-${exp.id}`}
                  className={cn(
                    "w-full text-left px-3 py-2.5 border-b border-border/50 transition-colors",
                    selected === exp.id && panelMode !== "create"
                      ? "bg-primary/10 border-l-2 border-l-primary"
                      : "hover:bg-secondary/50 border-l-2 border-l-transparent",
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-foreground leading-tight truncate min-w-0">
                      {exp.name}
                    </span>
                    <StatusBadge status={exp.status} />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono leading-tight line-clamp-1 mb-1.5">
                    {exp.description}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge
                      variant="secondary"
                      className="text-[9px] h-4 font-mono px-1.5 rounded-sm"
                    >
                      {exp.tags.find((t) =>
                        [
                          "kubernetes",
                          "aws",
                          "azure",
                          "linux",
                          "custom",
                        ].includes(t),
                      ) ?? "custom"}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {exp.faults.length} fault
                      {exp.faults.length !== 1 ? "s" : ""}
                    </span>
                    <div className="flex gap-0.5 flex-wrap">
                      {exp.faults.slice(0, 1).map((f) => (
                        <FaultChip key={f.id} type={f.faultType} />
                      ))}
                      {exp.faults.length > 1 && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          +{exp.faults.length - 1}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          {panelMode === "create" ? (
            <ExperimentForm onSave={handleSave} onCancel={handleCancel} />
          ) : panelMode === "edit" && selectedExp ? (
            <ExperimentForm
              initial={selectedExp}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          ) : selectedExp ? (
            <ExperimentDetail
              experiment={selectedExp}
              onEdit={handleEdit}
              onClone={handleClone}
              onDelete={handleDelete}
            />
          ) : (
            <div
              className="h-full flex flex-col items-center justify-center text-center bg-card border border-border rounded"
              data-ocid="designer-empty-state"
            >
              <FlaskConical className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
              <h3 className="font-display font-bold text-sm text-foreground mb-1">
                Select an Experiment
              </h3>
              <p className="text-xs text-muted-foreground font-mono max-w-xs">
                Choose from the list or create a new experiment to get started.
              </p>
              <Button
                type="button"
                className="mt-4 gap-1.5 font-mono text-xs"
                size="sm"
                onClick={handleNew}
                data-ocid="create-first-experiment-btn"
              >
                <Plus className="h-3.5 w-3.5" /> Create Experiment
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
