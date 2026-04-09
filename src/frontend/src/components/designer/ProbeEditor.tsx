import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProbeConfig } from "@/types";
import { Activity, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface ProbeEditorProps {
  probes: ProbeConfig[];
  onChange: (probes: ProbeConfig[]) => void;
}

const PROBE_TYPES = ["http", "tcp", "script"] as const;

function generateId() {
  return `probe-${Math.random().toString(36).slice(2, 8)}`;
}

export function ProbeEditor({ probes, onChange }: ProbeEditorProps) {
  const [name, setName] = useState("");
  const [probeType, setProbeType] = useState<ProbeConfig["probeType"]>("http");
  const [endpoint, setEndpoint] = useState("");
  const [successCondition, setSuccessCondition] = useState("200");

  const handleAdd = () => {
    if (!name.trim() || !endpoint.trim()) return;
    const probe: ProbeConfig = {
      id: generateId(),
      name: name.trim(),
      probeType,
      endpoint: endpoint.trim(),
      intervalSeconds: 5,
      timeoutSeconds: 3,
      successThreshold: Number(successCondition) || 1,
      failureThreshold: 3,
    };
    onChange([...probes, probe]);
    setName("");
    setEndpoint("");
    setSuccessCondition("200");
  };

  const handleRemove = (id: string) => {
    onChange(probes.filter((p) => p.id !== id));
  };

  return (
    <div className="flex flex-col gap-3" data-ocid="probe-editor">
      {/* Existing probes */}
      {probes.length > 0 && (
        <div className="flex flex-col gap-1.5" data-ocid="probe-list">
          {probes.map((probe) => (
            <div
              key={probe.id}
              className="flex items-center gap-2 px-2.5 py-2 rounded border border-border bg-secondary/20"
              data-ocid={`probe-row-${probe.id}`}
            >
              <Activity className="h-3 w-3 text-primary flex-shrink-0" />
              <span className="text-xs font-semibold text-foreground min-w-0 truncate">
                {probe.name}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground uppercase ml-1 flex-shrink-0">
                {probe.probeType}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground flex-1 truncate min-w-0">
                {probe.endpoint}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(probe.id)}
                className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                aria-label={`Remove probe ${probe.name}`}
                data-ocid={`remove-probe-${probe.id}`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new probe */}
      <div className="flex flex-col gap-2 p-2.5 rounded border border-border/50 bg-background">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          Add Health Probe
        </p>
        <div className="flex gap-2">
          <div className="flex-1">
            <Label
              htmlFor="probe-name"
              className="text-[10px] font-mono text-muted-foreground block mb-1"
            >
              Name
            </Label>
            <Input
              id="probe-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Checkout Health"
              className="h-7 text-xs font-mono"
              data-ocid="probe-name-input"
            />
          </div>
          <div className="w-24">
            <Label
              htmlFor="probe-type"
              className="text-[10px] font-mono text-muted-foreground block mb-1"
            >
              Type
            </Label>
            <select
              id="probe-type"
              value={probeType}
              onChange={(e) =>
                setProbeType(e.target.value as ProbeConfig["probeType"])
              }
              className="w-full h-7 rounded border border-input bg-background px-2 text-xs font-mono text-foreground"
              data-ocid="probe-type-select"
            >
              {PROBE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <Label
              htmlFor="probe-endpoint"
              className="text-[10px] font-mono text-muted-foreground block mb-1"
            >
              Endpoint / Expression
            </Label>
            <Input
              id="probe-endpoint"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://api/health"
              className="h-7 text-xs font-mono"
              data-ocid="probe-endpoint-input"
            />
          </div>
          <div className="w-28">
            <Label
              htmlFor="probe-condition"
              className="text-[10px] font-mono text-muted-foreground block mb-1"
            >
              Success Code
            </Label>
            <Input
              id="probe-condition"
              value={successCondition}
              onChange={(e) => setSuccessCondition(e.target.value)}
              placeholder="200"
              className="h-7 text-xs font-mono"
              data-ocid="probe-condition-input"
            />
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={!name.trim() || !endpoint.trim()}
          className="w-fit h-7 text-xs gap-1 font-mono"
          data-ocid="add-probe-btn"
        >
          <Plus className="h-3 w-3" /> Add Probe
        </Button>
      </div>
    </div>
  );
}
