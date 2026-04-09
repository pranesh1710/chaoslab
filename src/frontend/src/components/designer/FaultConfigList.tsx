import { cn } from "@/lib/utils";
import type { FaultConfig, FaultType } from "@/types";
import { GripVertical, Minus, Plus, Trash2 } from "lucide-react";
import { FAULT_TYPE_LABELS } from "./FaultLibrary";

const PARAM_CONFIGS: Partial<
  Record<
    FaultType,
    { key: string; label: string; placeholder: string; unit?: string }[]
  >
> = {
  latency: [
    { key: "delay_ms", label: "Delay", placeholder: "500", unit: "ms" },
    { key: "jitter_ms", label: "Jitter", placeholder: "50", unit: "ms" },
  ],
  cpu_starvation: [
    { key: "cpu_pct", label: "CPU %", placeholder: "80", unit: "%" },
  ],
  memory_pressure: [
    { key: "mem_pct", label: "Mem %", placeholder: "90", unit: "%" },
  ],
  network_loss: [
    { key: "loss_pct", label: "Loss %", placeholder: "30", unit: "%" },
    { key: "error_rate", label: "Error %", placeholder: "5", unit: "%" },
  ],
  regional_failure: [
    { key: "region", label: "Region", placeholder: "us-east-1" },
  ],
  disk_io: [
    { key: "io_pct", label: "I/O %", placeholder: "70", unit: "%" },
    { key: "error_rate", label: "Error %", placeholder: "5", unit: "%" },
  ],
  process_kill: [{ key: "signal", label: "Signal", placeholder: "SIGKILL" }],
  dns_failure: [
    { key: "zone", label: "DNS Zone", placeholder: "internal.svc" },
  ],
};

interface FaultConfigListProps {
  faults: FaultConfig[];
  onChange: (faults: FaultConfig[]) => void;
}

function SeveritySlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const color =
    value >= 8
      ? "text-destructive"
      : value >= 5
        ? "text-chart-4"
        : "text-chart-3";
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-mono text-muted-foreground w-12">
        Severity
      </span>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1 appearance-none rounded-full cursor-pointer bg-border
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-3
          [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-primary"
      />
      <span
        className={cn("text-xs font-mono font-bold tabular-nums w-4", color)}
      >
        {value}
      </span>
    </div>
  );
}

export function FaultConfigList({ faults, onChange }: FaultConfigListProps) {
  const update = (id: string, patch: Partial<FaultConfig>) => {
    onChange(faults.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const updateParam = (id: string, key: string, val: string) => {
    const fault = faults.find((f) => f.id === id);
    if (!fault) return;
    onChange(
      faults.map((f) =>
        f.id === id ? { ...f, parameters: { ...f.parameters, [key]: val } } : f,
      ),
    );
  };

  const remove = (id: string) => onChange(faults.filter((f) => f.id !== id));

  const move = (id: string, dir: -1 | 1) => {
    const idx = faults.findIndex((f) => f.id === id);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= faults.length) return;
    const arr = [...faults];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    onChange(arr);
  };

  if (faults.length === 0) {
    return (
      <div className="py-6 text-center text-[10px] font-mono text-muted-foreground border border-dashed border-border rounded">
        No faults configured. Select from the library below.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2" data-ocid="fault-config-list">
      {faults.map((fault, idx) => {
        const paramDefs = PARAM_CONFIGS[fault.faultType] ?? [];
        return (
          <div
            key={fault.id}
            className="rounded border border-border bg-secondary/20 overflow-hidden"
            data-ocid={`fault-config-${fault.id}`}
          >
            {/* Header row */}
            <div className="flex items-center gap-2 px-2.5 py-2 border-b border-border/50 bg-background/30">
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0" />
              <span className="text-[11px] font-semibold text-foreground flex-1 truncate">
                {FAULT_TYPE_LABELS[fault.faultType]}
              </span>
              <div className="flex items-center gap-1 ml-auto">
                <button
                  type="button"
                  onClick={() => move(fault.id, -1)}
                  disabled={idx === 0}
                  className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                  aria-label="Move fault up"
                >
                  <Minus className="h-2.5 w-2.5 rotate-90" />
                </button>
                <button
                  type="button"
                  onClick={() => move(fault.id, 1)}
                  disabled={idx === faults.length - 1}
                  className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                  aria-label="Move fault down"
                >
                  <Plus className="h-2.5 w-2.5 rotate-90" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(fault.id)}
                  className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Remove fault"
                  data-ocid={`remove-fault-${fault.id}`}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-2.5 flex flex-col gap-2">
              <SeveritySlider
                value={fault.enabled ? 5 : 1}
                onChange={(v) => update(fault.id, { enabled: v > 0 })}
              />

              {/* Target + duration row */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label
                    htmlFor={`fault-target-${fault.id}`}
                    className="text-[9px] font-mono text-muted-foreground uppercase block mb-0.5"
                  >
                    Target Service
                  </label>
                  <input
                    id={`fault-target-${fault.id}`}
                    type="text"
                    value={fault.targetService}
                    onChange={(e) =>
                      update(fault.id, { targetService: e.target.value })
                    }
                    placeholder="e.g. payment-svc"
                    className="w-full h-6 rounded border border-input bg-background px-2 text-[10px] font-mono text-foreground"
                    data-ocid={`fault-target-${fault.id}`}
                  />
                </div>
                <div className="w-20">
                  <label
                    htmlFor={`fault-duration-${fault.id}`}
                    className="text-[9px] font-mono text-muted-foreground uppercase block mb-0.5"
                  >
                    Duration (s)
                  </label>
                  <input
                    id={`fault-duration-${fault.id}`}
                    type="number"
                    value={fault.durationSeconds}
                    onChange={(e) =>
                      update(fault.id, {
                        durationSeconds: Number(e.target.value),
                      })
                    }
                    min={1}
                    className="w-full h-6 rounded border border-input bg-background px-2 text-[10px] font-mono text-foreground"
                    data-ocid={`fault-duration-${fault.id}`}
                  />
                </div>
              </div>

              {/* Typed params */}
              {paramDefs.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {paramDefs.map((pd) => (
                    <div key={pd.key} className="min-w-[80px] flex-1">
                      <label
                        htmlFor={`fault-param-${fault.id}-${pd.key}`}
                        className="text-[9px] font-mono text-muted-foreground uppercase block mb-0.5"
                      >
                        {pd.label}
                      </label>
                      <div className="relative flex items-center">
                        <input
                          id={`fault-param-${fault.id}-${pd.key}`}
                          type="text"
                          value={fault.parameters[pd.key] ?? ""}
                          onChange={(e) =>
                            updateParam(fault.id, pd.key, e.target.value)
                          }
                          placeholder={pd.placeholder}
                          className="w-full h-6 rounded border border-input bg-background px-2 text-[10px] font-mono text-foreground pr-6"
                          data-ocid={`fault-param-${fault.id}-${pd.key}`}
                        />
                        {pd.unit && (
                          <span className="absolute right-1.5 text-[9px] font-mono text-muted-foreground pointer-events-none">
                            {pd.unit}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
