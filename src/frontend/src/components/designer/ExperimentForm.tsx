import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Experiment, FaultConfig, ProbeConfig } from "@/types";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Save,
  Shield,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { BlastRadiusEditor, type BlastRadiusState } from "./BlastRadiusEditor";
import { FaultConfigList } from "./FaultConfigList";
import { FaultLibrary, type FaultModeInfo } from "./FaultLibrary";
import { ProbeEditor } from "./ProbeEditor";

const INFRA_TARGETS = [
  "kubernetes",
  "aws",
  "azure",
  "linux",
  "custom",
] as const;
type InfraTarget = (typeof INFRA_TARGETS)[number];

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

interface SectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accent?: "destructive" | "primary";
}

function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
  accent,
}: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card border border-border rounded overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 border-b border-border bg-background/20 hover:bg-background/40 transition-colors"
      >
        <Icon
          className={cn(
            "h-3.5 w-3.5 flex-shrink-0",
            accent === "destructive" ? "text-destructive" : "text-primary",
          )}
        />
        <span
          className={cn(
            "text-xs font-mono font-semibold uppercase tracking-wider flex-1 text-left",
            accent === "destructive"
              ? "text-destructive"
              : "text-muted-foreground",
          )}
        >
          {title}
        </span>
        {open ? (
          <ChevronUp className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        )}
      </button>
      {open && <div className="p-3">{children}</div>}
    </div>
  );
}

interface ExperimentFormProps {
  initial?: Experiment;
  onSave: (exp: Experiment, asTemplate: boolean) => void;
  onCancel: () => void;
}

export function ExperimentForm({
  initial,
  onSave,
  onCancel,
}: ExperimentFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [hypothesis, setHypothesis] = useState(initial?.hypothesis ?? "");
  const [infraTarget, setInfraTarget] = useState<InfraTarget>(
    (initial?.tags.find((t) =>
      INFRA_TARGETS.includes(t as InfraTarget),
    ) as InfraTarget) ?? "kubernetes",
  );
  const [faults, setFaults] = useState<FaultConfig[]>(initial?.faults ?? []);
  const [blastRadius, setBlastRadius] = useState<BlastRadiusState>({
    instancePct: initial?.blastRadius.maxAffectedPercentage ?? 20,
    trafficPct: 20,
    geoScope: "single",
    maxDurationSeconds: 300,
    autoRollback: true,
  });
  const [probes, setProbes] = useState<ProbeConfig[]>(initial?.probes ?? []);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showLibrary, setShowLibrary] = useState(faults.length === 0);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Experiment name is required.";
    if (faults.length === 0)
      errs.faults = "At least one fault must be configured.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = (status: "draft" | "ready") => {
    if (!validate()) return;
    const exp: Experiment = {
      id: initial?.id ?? generateId(),
      name: name.trim(),
      description: description.trim(),
      status,
      hypothesis: hypothesis.trim(),
      faults,
      blastRadius: {
        maxAffectedInstances: Math.ceil(blastRadius.instancePct / 10),
        maxAffectedPercentage: blastRadius.instancePct,
        targetEnvironments: ["staging"],
        excludeServices: [],
        requireApproval: blastRadius.instancePct > 40,
      },
      probes,
      tags: [infraTarget],
      createdAt: initial?.createdAt ?? BigInt(Date.now()) * BigInt(1000000),
      updatedAt: BigInt(Date.now()) * BigInt(1000000),
      owner: "sre-team",
    };
    onSave(exp, saveAsTemplate);
  };

  const addFaultFromLibrary = (mode: FaultModeInfo) => {
    const fault: FaultConfig = {
      id: generateId(),
      faultType: mode.type,
      targetService: "",
      parameters: { ...mode.defaultParams },
      durationSeconds: mode.defaultDuration,
      enabled: true,
    };
    setFaults((prev) => [...prev, fault]);
    setShowLibrary(false);
    setErrors((e) => ({ ...e, faults: "" }));
  };

  return (
    <div
      className="flex flex-col gap-3 h-full overflow-y-auto"
      data-ocid="experiment-form"
    >
      {/* Meta */}
      <Section title="Experiment Details" icon={FlaskConical}>
        <div className="flex flex-col gap-3">
          <div>
            <Label
              htmlFor="exp-name"
              className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block mb-1"
            >
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="exp-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value) setErrors((er) => ({ ...er, name: "" }));
              }}
              placeholder="e.g. Payment Service Latency Storm"
              className={cn(
                "h-8 text-xs font-mono",
                errors.name && "border-destructive",
              )}
              data-ocid="exp-name-input"
            />
            {errors.name && (
              <p className="text-[10px] text-destructive font-mono mt-1">
                {errors.name}
              </p>
            )}
          </div>
          <div>
            <Label
              htmlFor="exp-desc"
              className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block mb-1"
            >
              Description
            </Label>
            <Textarea
              id="exp-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you testing and why?"
              className="text-xs font-mono resize-none h-16"
              data-ocid="exp-desc-input"
            />
          </div>
          <div>
            <Label
              htmlFor="exp-hypothesis"
              className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block mb-1"
            >
              Hypothesis
            </Label>
            <Textarea
              id="exp-hypothesis"
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              placeholder="We expect the circuit breaker to open within 5s and error rate to stay below 5%..."
              className="text-xs font-mono resize-none h-16"
              data-ocid="exp-hypothesis-input"
            />
          </div>
          <div>
            <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block mb-1.5">
              Infrastructure Target
            </Label>
            <div
              className="flex flex-wrap gap-1.5"
              data-ocid="infra-target-selector"
            >
              {INFRA_TARGETS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setInfraTarget(t)}
                  className={cn(
                    "px-2.5 py-1 rounded border text-[10px] font-mono uppercase transition-colors",
                    infraTarget === t
                      ? "border-primary/60 bg-primary/10 text-primary"
                      : "border-border bg-secondary/20 text-muted-foreground hover:border-border hover:text-foreground",
                  )}
                  data-ocid={`infra-target-${t}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Fault Config */}
      <Section
        title={`Fault Configuration (${faults.length})`}
        icon={Zap}
        defaultOpen
      >
        <div className="flex flex-col gap-3">
          {errors.faults && (
            <div className="flex items-center gap-1.5 p-2 rounded border border-destructive/30 bg-destructive/5">
              <AlertCircle className="h-3 w-3 text-destructive flex-shrink-0" />
              <p className="text-[10px] font-mono text-destructive">
                {errors.faults}
              </p>
            </div>
          )}

          <FaultConfigList faults={faults} onChange={setFaults} />

          <div>
            <button
              type="button"
              onClick={() => setShowLibrary((v) => !v)}
              className="flex items-center gap-1.5 text-[10px] font-mono text-primary hover:underline transition-colors"
              data-ocid="toggle-fault-library"
            >
              {showLibrary ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              {showLibrary ? "Hide" : "Add from"} Fault Library
            </button>
            {showLibrary && (
              <div className="mt-2">
                <FaultLibrary
                  onSelect={addFaultFromLibrary}
                  selectedTypes={faults.map((f) => f.faultType)}
                />
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* Blast Radius */}
      <Section title="Blast Radius Controls" icon={Shield} accent="destructive">
        <BlastRadiusEditor value={blastRadius} onChange={setBlastRadius} />
      </Section>

      {/* Probes */}
      <Section title="Health Probes" icon={FlaskConical} defaultOpen={false}>
        <ProbeEditor probes={probes} onChange={setProbes} />
      </Section>

      {/* Actions */}
      <div className="bg-card border border-border rounded p-3 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 mr-auto">
          <Switch
            id="save-template"
            checked={saveAsTemplate}
            onCheckedChange={setSaveAsTemplate}
            data-ocid="save-as-template-toggle"
          />
          <Label
            htmlFor="save-template"
            className="text-[10px] font-mono text-muted-foreground cursor-pointer"
          >
            Save as Template
          </Label>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs font-mono"
          onClick={onCancel}
          data-ocid="form-cancel-btn"
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1 font-mono"
          onClick={() => handleSave("draft")}
          data-ocid="save-draft-btn"
        >
          <Save className="h-3.5 w-3.5" /> Save Draft
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-8 text-xs gap-1 font-mono"
          onClick={() => handleSave("ready")}
          data-ocid="save-ready-btn"
        >
          <Zap className="h-3.5 w-3.5" /> Save &amp; Mark Ready
        </Button>
      </div>
    </div>
  );
}
