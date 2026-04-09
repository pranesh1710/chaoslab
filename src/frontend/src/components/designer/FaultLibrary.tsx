import { cn } from "@/lib/utils";
import type { FaultType } from "@/types";
import {
  Activity,
  AlertTriangle,
  Clock,
  Cpu,
  Globe2,
  Link2Off,
  MemoryStick,
  Network,
} from "lucide-react";

export interface FaultModeInfo {
  type: FaultType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultParams: Record<string, string>;
  defaultDuration: number;
}

export const FAULT_MODES: FaultModeInfo[] = [
  {
    type: "latency",
    label: "Latency Injection",
    description: "Add artificial network delay to target service requests.",
    icon: Clock,
    defaultParams: { delay_ms: "500", jitter_ms: "50" },
    defaultDuration: 120,
  },
  {
    type: "cpu_starvation",
    label: "CPU Starvation",
    description: "Saturate CPU to test degraded compute capacity behavior.",
    icon: Cpu,
    defaultParams: { cpu_pct: "80" },
    defaultDuration: 180,
  },
  {
    type: "memory_pressure",
    label: "Memory Exhaustion",
    description: "Consume available memory to trigger OOM events and eviction.",
    icon: MemoryStick,
    defaultParams: { mem_pct: "90" },
    defaultDuration: 90,
  },
  {
    type: "network_loss",
    label: "Network Partition",
    description: "Drop packets to simulate partial network disruption.",
    icon: Network,
    defaultParams: { loss_pct: "30" },
    defaultDuration: 60,
  },
  {
    type: "regional_failure",
    label: "Regional Service Failure",
    description: "Simulate a full region outage to validate failover logic.",
    icon: Globe2,
    defaultParams: { region: "us-east-1" },
    defaultDuration: 300,
  },
  {
    type: "disk_io",
    label: "Dependency Timeout",
    description: "Throttle disk I/O to simulate slow dependency responses.",
    icon: Activity,
    defaultParams: { io_pct: "70", error_rate: "5" },
    defaultDuration: 120,
  },
  {
    type: "process_kill",
    label: "Cascading Fault Chain",
    description:
      "Kill critical processes to trigger cascade failure scenarios.",
    icon: AlertTriangle,
    defaultParams: { signal: "SIGKILL" },
    defaultDuration: 30,
  },
  {
    type: "dns_failure",
    label: "DNS Failure",
    description: "Break DNS resolution to simulate service discovery outages.",
    icon: Link2Off,
    defaultParams: { zone: "internal.svc.cluster.local" },
    defaultDuration: 60,
  },
];

export const FAULT_TYPE_LABELS: Record<FaultType, string> = Object.fromEntries(
  FAULT_MODES.map((m) => [m.type, m.label]),
) as Record<FaultType, string>;

interface FaultLibraryProps {
  onSelect: (mode: FaultModeInfo) => void;
  selectedTypes?: FaultType[];
}

export function FaultLibrary({
  onSelect,
  selectedTypes = [],
}: FaultLibraryProps) {
  return (
    <div className="grid grid-cols-2 gap-2" data-ocid="fault-library-grid">
      {FAULT_MODES.map((mode) => {
        const Icon = mode.icon;
        const isSelected = selectedTypes.includes(mode.type);
        return (
          <button
            key={mode.type}
            type="button"
            onClick={() => onSelect(mode)}
            className={cn(
              "group p-2.5 rounded border text-left transition-colors",
              isSelected
                ? "border-primary/60 bg-primary/10"
                : "border-border bg-secondary/20 hover:border-primary/40 hover:bg-secondary/50",
            )}
            data-ocid={`fault-mode-${mode.type}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon
                className={cn(
                  "h-3.5 w-3.5 flex-shrink-0",
                  isSelected
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-primary",
                )}
              />
              <span className="text-[11px] font-semibold text-foreground leading-tight">
                {mode.label}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono leading-snug line-clamp-2">
              {mode.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
