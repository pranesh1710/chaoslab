import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { AlertTriangle, Globe, Globe2, MapPin, Shield } from "lucide-react";

export type GeoScope = "single" | "multi" | "global";

export interface BlastRadiusState {
  instancePct: number;
  trafficPct: number;
  geoScope: GeoScope;
  maxDurationSeconds: number;
  autoRollback: boolean;
}

interface SliderRowProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  ocid: string;
}

function SliderRow({ label, value, onChange, ocid }: SliderRowProps) {
  const danger = value > 50;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          {label}
        </Label>
        <span
          className={cn(
            "text-xs font-mono font-bold tabular-nums",
            danger ? "text-destructive" : "text-foreground",
          )}
        >
          {value}%
        </span>
      </div>
      <div className="relative flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          data-ocid={ocid}
          className="flex-1 h-1.5 appearance-none rounded-full cursor-pointer
            bg-border
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-3.5
            [&::-webkit-slider-thumb]:h-3.5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-primary
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-background
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-125"
          style={{
            background: `linear-gradient(to right, ${danger ? "oklch(var(--destructive))" : "oklch(var(--primary))"} ${value}%, oklch(var(--border)) ${value}%)`,
          }}
        />
      </div>
    </div>
  );
}

const GEO_OPTIONS: {
  value: GeoScope;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "single", label: "Single Region", icon: MapPin },
  { value: "multi", label: "Multi-Region", icon: Globe },
  { value: "global", label: "Global", icon: Globe2 },
];

interface BlastRadiusEditorProps {
  value: BlastRadiusState;
  onChange: (v: BlastRadiusState) => void;
}

export function BlastRadiusEditor({ value, onChange }: BlastRadiusEditorProps) {
  const totalRisk = Math.round((value.instancePct + value.trafficPct) / 2);
  const riskLevel = totalRisk > 60 ? "HIGH" : totalRisk > 30 ? "MEDIUM" : "LOW";
  const riskColor =
    riskLevel === "HIGH"
      ? "text-destructive border-destructive/40 bg-destructive/10"
      : riskLevel === "MEDIUM"
        ? "text-chart-4 border-chart-4/40 bg-chart-4/10"
        : "text-chart-3 border-chart-3/40 bg-chart-3/10";

  return (
    <div className="flex flex-col gap-3" data-ocid="blast-radius-editor">
      {/* Risk summary */}
      <div
        className={cn(
          "flex items-center justify-between p-2 rounded border",
          riskColor,
        )}
      >
        <div className="flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
            Blast Risk
          </span>
        </div>
        <span className="text-xs font-mono font-bold">{riskLevel}</span>
      </div>

      <SliderRow
        label="Instance Coverage"
        value={value.instancePct}
        onChange={(v) => onChange({ ...value, instancePct: v })}
        ocid="blast-instance-pct"
      />

      <SliderRow
        label="Traffic Coverage"
        value={value.trafficPct}
        onChange={(v) => onChange({ ...value, trafficPct: v })}
        ocid="blast-traffic-pct"
      />

      {/* Geo scope */}
      <div>
        <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block mb-1.5">
          Geographic Scope
        </Label>
        <div className="flex gap-1.5" data-ocid="blast-geo-scope">
          {GEO_OPTIONS.map(({ value: optVal, label, icon: Icon }) => (
            <button
              key={optVal}
              type="button"
              onClick={() => onChange({ ...value, geoScope: optVal })}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded border text-[10px] font-mono transition-colors",
                value.geoScope === optVal
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-border bg-secondary/20 text-muted-foreground hover:border-border hover:text-foreground",
              )}
              data-ocid={`geo-scope-${optVal}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Max duration + auto-rollback */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Label
            htmlFor="max-duration"
            className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block mb-1"
          >
            Max Duration (s)
          </Label>
          <Input
            id="max-duration"
            type="number"
            min={10}
            max={3600}
            value={value.maxDurationSeconds}
            onChange={(e) =>
              onChange({ ...value, maxDurationSeconds: Number(e.target.value) })
            }
            className="h-7 text-xs font-mono"
            data-ocid="blast-max-duration"
          />
        </div>
        <div className="flex items-center gap-2 pt-4">
          <Switch
            id="auto-rollback"
            checked={value.autoRollback}
            onCheckedChange={(checked) =>
              onChange({ ...value, autoRollback: checked })
            }
            data-ocid="blast-auto-rollback"
          />
          <Label
            htmlFor="auto-rollback"
            className="text-[10px] font-mono text-muted-foreground whitespace-nowrap cursor-pointer"
          >
            Auto-rollback
          </Label>
        </div>
      </div>

      {value.instancePct > 50 && (
        <div className="flex items-start gap-1.5 p-2 rounded border border-destructive/30 bg-destructive/5">
          <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-[10px] font-mono text-destructive">
            High instance coverage. Ensure staging env isolation before
            proceeding.
          </p>
        </div>
      )}
    </div>
  );
}
