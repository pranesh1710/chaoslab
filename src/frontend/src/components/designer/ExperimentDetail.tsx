import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Experiment, ExperimentStatus, FaultType } from "@/types";
import {
  AlertCircle,
  Check,
  Copy,
  Edit3,
  FlaskConical,
  Settings,
  Shield,
  Tag,
  Trash2,
  Zap,
} from "lucide-react";
import { FAULT_TYPE_LABELS } from "./FaultLibrary";

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
        "inline-flex items-center px-2.5 py-0.5 rounded-sm border font-mono text-[10px] uppercase tracking-wider",
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
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-mono bg-secondary border border-border text-muted-foreground">
      {FAULT_TYPE_LABELS[type]}
    </span>
  );
}

interface ExperimentDetailProps {
  experiment: Experiment;
  onEdit: () => void;
  onClone: () => void;
  onDelete: () => void;
  onRun?: () => void;
}

export function ExperimentDetail({
  experiment,
  onEdit,
  onClone,
  onDelete,
  onRun,
}: ExperimentDetailProps) {
  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Header */}
      <div className="bg-card border border-border rounded p-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical className="h-4 w-4 text-primary flex-shrink-0" />
            <h2 className="font-display font-bold text-sm text-foreground truncate">
              {experiment.name}
            </h2>
            <StatusBadge status={experiment.status} />
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            {experiment.description}
          </p>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {experiment.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm bg-secondary border border-border text-[10px] font-mono text-muted-foreground"
              >
                <Tag className="h-2.5 w-2.5" />
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1 font-mono"
            onClick={onClone}
            data-ocid="clone-experiment-btn"
          >
            <Copy className="h-3 w-3" /> Clone
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1 font-mono"
            onClick={onEdit}
            data-ocid="edit-experiment-btn"
          >
            <Edit3 className="h-3 w-3" /> Edit
          </Button>
          {experiment.status === "ready" && onRun && (
            <Button
              size="sm"
              className="h-7 text-xs gap-1 font-mono"
              onClick={onRun}
              data-ocid="run-experiment-btn"
            >
              <Zap className="h-3 w-3" /> Run
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            className="h-7 text-xs font-mono"
            onClick={onDelete}
            data-ocid="delete-experiment-btn"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="flex gap-3 flex-1 min-h-0">
        {/* Faults */}
        <div className="flex-1 bg-card border border-border rounded overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b border-border">
            <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
              Fault Configuration ({experiment.faults.length})
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
            {experiment.faults.map((fault) => (
              <div
                key={fault.id}
                className={cn(
                  "p-2.5 rounded border",
                  fault.enabled
                    ? "border-border bg-secondary/30"
                    : "border-border/30 bg-muted/20 opacity-60",
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        fault.enabled
                          ? "bg-primary animate-pulse"
                          : "bg-muted-foreground",
                      )}
                    />
                    <FaultChip type={fault.faultType} />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {fault.durationSeconds}s
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground mb-1.5">
                  <span className="px-1.5 py-0.5 bg-background border border-border rounded-sm">
                    target:{" "}
                    <span className="text-primary">{fault.targetService}</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(fault.parameters).map(([k, v]) => (
                    <span
                      key={k}
                      className="text-[10px] font-mono px-1.5 py-0.5 bg-background border border-border rounded-sm text-muted-foreground"
                    >
                      {k}=<span className="text-foreground">{v}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="w-72 flex flex-col gap-3">
          {/* Blast Radius */}
          <div
            className="bg-card border border-border rounded overflow-hidden"
            data-ocid="blast-radius-summary"
          >
            <div className="px-3 py-2 border-b border-border flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-destructive" />
              <span className="text-xs font-mono font-semibold text-destructive uppercase tracking-wider">
                Blast Radius
              </span>
            </div>
            <div className="p-3 flex flex-col gap-1.5">
              {[
                [
                  "Max instances",
                  `${experiment.blastRadius.maxAffectedInstances}`,
                ],
                [
                  "Max coverage",
                  `${experiment.blastRadius.maxAffectedPercentage}%`,
                ],
                [
                  "Environments",
                  experiment.blastRadius.targetEnvironments.join(", "),
                ],
                [
                  "Approval",
                  experiment.blastRadius.requireApproval
                    ? "REQUIRED"
                    : "NOT REQUIRED",
                ],
              ].map(([label, val]) => (
                <div
                  key={label}
                  className="flex justify-between text-[10px] font-mono"
                >
                  <span className="text-muted-foreground">{label}</span>
                  <span
                    className={cn(
                      "font-bold",
                      label === "Approval" &&
                        experiment.blastRadius.requireApproval
                        ? "text-chart-4"
                        : "text-foreground",
                    )}
                  >
                    {val}
                  </span>
                </div>
              ))}
              {experiment.blastRadius.excludeServices.length > 0 && (
                <div className="text-[10px] font-mono">
                  <span className="text-muted-foreground">Excluded: </span>
                  <span className="text-foreground">
                    {experiment.blastRadius.excludeServices.join(", ")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Hypothesis */}
          <div className="bg-card border border-border rounded overflow-hidden flex-1">
            <div className="px-3 py-2 border-b border-border flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                Hypothesis
              </span>
            </div>
            <div className="p-3">
              <p className="text-xs text-foreground leading-relaxed font-mono">
                {experiment.hypothesis}
              </p>
            </div>
          </div>

          {/* Probes */}
          <div className="bg-card border border-border rounded overflow-hidden">
            <div className="px-3 py-2 border-b border-border flex items-center gap-2">
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                Probes ({experiment.probes.length})
              </span>
            </div>
            <div className="p-2">
              {experiment.probes.length === 0 ? (
                <p className="text-[10px] font-mono text-muted-foreground text-center py-2">
                  No probes configured
                </p>
              ) : (
                experiment.probes.map((probe) => (
                  <div
                    key={probe.id}
                    className="flex items-center gap-2 py-1 text-[10px] font-mono"
                  >
                    <Check className="h-2.5 w-2.5 text-primary flex-shrink-0" />
                    <span className="text-foreground truncate">
                      {probe.name}
                    </span>
                    <span className="text-muted-foreground ml-auto">
                      {probe.intervalSeconds}s
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
