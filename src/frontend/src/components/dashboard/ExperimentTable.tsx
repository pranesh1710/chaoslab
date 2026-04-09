import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Minus,
} from "lucide-react";
import React, { useMemo, useState } from "react";

interface RunRow {
  runId: string;
  experimentName: string;
  date: string;
  dateTs: number;
  infrastructure: string;
  durationSeconds: number | null;
  blastRadiusPct: number;
  resilienceScore: number | null;
  faultCount: number;
  probePassRate: number;
  status: string;
}

const MOCK_RUNS: RunRow[] = [
  {
    runId: "run-091",
    experimentName: "Payment Service Latency Storm",
    date: "2026-04-09",
    dateTs: Date.now() - 3600000,
    infrastructure: "kubernetes",
    durationSeconds: null,
    blastRadiusPct: 25,
    resilienceScore: null,
    faultCount: 3,
    probePassRate: 0,
    status: "running",
  },
  {
    runId: "run-089",
    experimentName: "Auth CPU Starvation",
    date: "2026-04-08",
    dateTs: Date.now() - 86400000,
    infrastructure: "linux",
    durationSeconds: 180,
    blastRadiusPct: 15,
    resilienceScore: 70,
    faultCount: 2,
    probePassRate: 85,
    status: "completed",
  },
  {
    runId: "run-086",
    experimentName: "Inventory Memory Pressure",
    date: "2026-04-07",
    dateTs: Date.now() - 172800000,
    infrastructure: "aws",
    durationSeconds: 90,
    blastRadiusPct: 30,
    resilienceScore: 71,
    faultCount: 4,
    probePassRate: 60,
    status: "completed",
  },
  {
    runId: "run-081",
    experimentName: "US-East Regional Failover",
    date: "2026-04-06",
    dateTs: Date.now() - 259200000,
    infrastructure: "aws",
    durationSeconds: 45,
    blastRadiusPct: 100,
    resilienceScore: null,
    faultCount: 1,
    probePassRate: 0,
    status: "aborted",
  },
  {
    runId: "run-078",
    experimentName: "Search DNS Chaos",
    date: "2026-04-05",
    dateTs: Date.now() - 345600000,
    infrastructure: "azure",
    durationSeconds: 240,
    blastRadiusPct: 20,
    resilienceScore: 69,
    faultCount: 2,
    probePassRate: 75,
    status: "completed",
  },
  {
    runId: "run-067",
    experimentName: "Payment Service Latency Storm",
    date: "2026-04-04",
    dateTs: Date.now() - 432000000,
    infrastructure: "kubernetes",
    durationSeconds: 300,
    blastRadiusPct: 25,
    resilienceScore: 63,
    faultCount: 3,
    probePassRate: 67,
    status: "completed",
  },
  {
    runId: "run-054",
    experimentName: "Order Processor Kill",
    date: "2026-04-03",
    dateTs: Date.now() - 518400000,
    infrastructure: "linux",
    durationSeconds: 60,
    blastRadiusPct: 10,
    resilienceScore: 55,
    faultCount: 1,
    probePassRate: 50,
    status: "failed",
  },
  {
    runId: "run-041",
    experimentName: "Notification Disk I/O",
    date: "2026-04-02",
    dateTs: Date.now() - 604800000,
    infrastructure: "aws",
    durationSeconds: 120,
    blastRadiusPct: 40,
    resilienceScore: 58,
    faultCount: 2,
    probePassRate: 80,
    status: "completed",
  },
  {
    runId: "run-023",
    experimentName: "Auth Gateway Cert Expiry",
    date: "2026-04-01",
    dateTs: Date.now() - 691200000,
    infrastructure: "azure",
    durationSeconds: 200,
    blastRadiusPct: 50,
    resilienceScore: 52,
    faultCount: 3,
    probePassRate: 55,
    status: "completed",
  },
  {
    runId: "run-012",
    experimentName: "CPU Spike Simulation",
    date: "2026-03-31",
    dateTs: Date.now() - 777600000,
    infrastructure: "linux",
    durationSeconds: 150,
    blastRadiusPct: 20,
    resilienceScore: 48,
    faultCount: 2,
    probePassRate: 70,
    status: "completed",
  },
  {
    runId: "run-001",
    experimentName: "Baseline Network Loss",
    date: "2026-03-30",
    dateTs: Date.now() - 864000000,
    infrastructure: "kubernetes",
    durationSeconds: 360,
    blastRadiusPct: 35,
    resilienceScore: 41,
    faultCount: 5,
    probePassRate: 40,
    status: "completed",
  },
];

type SortKey = keyof RunRow;

const STATUS_BADGE: Record<string, string> = {
  running: "bg-chart-4/20 text-chart-4 border-chart-4/30",
  completed: "bg-chart-3/20 text-chart-3 border-chart-3/30",
  failed: "bg-destructive/20 text-destructive border-destructive/30",
  aborted: "bg-muted text-muted-foreground border-border",
};

const INFRA_OPTIONS = ["all", "kubernetes", "aws", "azure", "linux", "custom"];
const PAGE_SIZE = 10;

function exportCSV(rows: RunRow[]) {
  const headers = [
    "Run ID",
    "Experiment",
    "Date",
    "Infrastructure",
    "Duration (s)",
    "Blast Radius %",
    "Resilience Score",
    "Faults",
    "Probe Pass %",
    "Status",
  ];
  const csvRows = rows.map((r) =>
    [
      r.runId,
      `"${r.experimentName}"`,
      r.date,
      r.infrastructure,
      r.durationSeconds ?? "",
      r.blastRadiusPct,
      r.resilienceScore ?? "",
      r.faultCount,
      r.probePassRate,
      r.status,
    ].join(","),
  );
  const content = [headers.join(","), ...csvRows].join("\n");
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `resilience-experiments-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExperimentTable() {
  const [sortKey, setSortKey] = useState<SortKey>("dateTs");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [filterInfra, setFilterInfra] = useState("all");
  const [filterService, setFilterService] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(0);
  };

  const filtered = useMemo(() => {
    let rows = [...MOCK_RUNS];
    if (filterInfra !== "all") {
      rows = rows.filter((r) => r.infrastructure === filterInfra);
    }
    if (filterService.trim()) {
      const q = filterService.toLowerCase();
      rows = rows.filter((r) => r.experimentName.toLowerCase().includes(q));
    }
    if (filterFrom) {
      const ts = new Date(filterFrom).getTime();
      rows = rows.filter((r) => r.dateTs >= ts);
    }
    if (filterTo) {
      const ts = new Date(filterTo).getTime() + 86400000;
      rows = rows.filter((r) => r.dateTs <= ts);
    }
    rows.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return sortDir === "asc" ? -1 : 1;
      if (bv == null) return sortDir === "asc" ? 1 : -1;
      return sortDir === "asc"
        ? av < bv
          ? -1
          : av > bv
            ? 1
            : 0
        : av > bv
          ? -1
          : av < bv
            ? 1
            : 0;
    });
    return rows;
  }, [filterInfra, filterService, filterFrom, filterTo, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const SortHeader = ({
    label,
    colKey,
    align = "left",
  }: {
    label: string;
    colKey: SortKey;
    align?: "left" | "right";
  }) => (
    <th
      className={cn(
        "px-2 py-1.5 text-muted-foreground font-semibold uppercase tracking-wider",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      <button
        type="button"
        className={cn(
          "flex items-center gap-1 cursor-pointer select-none hover:text-foreground transition-colors w-full",
          align === "right" && "justify-end",
        )}
        onClick={() => handleSort(colKey)}
      >
        <span>{label}</span>
        <ArrowUpDown
          className={cn(
            "h-2.5 w-2.5",
            sortKey === colKey ? "text-primary" : "text-muted-foreground/40",
          )}
        />
      </button>
    </th>
  );

  return (
    <div
      className="bg-card border border-border rounded overflow-hidden"
      data-ocid="experiment-table"
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-border flex items-center justify-between gap-3 flex-wrap">
        <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
          Experiment History
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6 text-[10px] font-mono gap-1 px-2"
          onClick={() => exportCSV(filtered)}
          data-ocid="export-csv-btn"
        >
          <Download className="h-3 w-3" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="px-3 py-2 border-b border-border bg-secondary/20 flex items-center gap-2 flex-wrap">
        <Input
          type="date"
          value={filterFrom}
          onChange={(e) => {
            setFilterFrom(e.target.value);
            setPage(0);
          }}
          className="h-6 text-[10px] font-mono w-32 bg-secondary border-border px-2"
          aria-label="Filter from date"
          data-ocid="filter-date-from"
        />
        <span className="text-[10px] font-mono text-muted-foreground">—</span>
        <Input
          type="date"
          value={filterTo}
          onChange={(e) => {
            setFilterTo(e.target.value);
            setPage(0);
          }}
          className="h-6 text-[10px] font-mono w-32 bg-secondary border-border px-2"
          aria-label="Filter to date"
          data-ocid="filter-date-to"
        />
        <Select
          value={filterInfra}
          onValueChange={(v) => {
            setFilterInfra(v);
            setPage(0);
          }}
        >
          <SelectTrigger
            className="h-6 text-[10px] font-mono w-32 bg-secondary border-border"
            data-ocid="filter-infra"
          >
            <SelectValue placeholder="Infrastructure" />
          </SelectTrigger>
          <SelectContent>
            {INFRA_OPTIONS.map((o) => (
              <SelectItem key={o} value={o} className="text-[10px] font-mono">
                {o === "all" ? "All Infra" : o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Search experiment…"
          value={filterService}
          onChange={(e) => {
            setFilterService(e.target.value);
            setPage(0);
          }}
          className="h-6 text-[10px] font-mono w-44 bg-secondary border-border"
          aria-label="Filter by service/experiment name"
          data-ocid="filter-service"
        />
        <span className="text-[9px] font-mono text-muted-foreground ml-auto">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[10px] font-mono">
          <thead className="bg-secondary/30 border-b border-border sticky top-0">
            <tr>
              <SortHeader label="Experiment" colKey="experimentName" />
              <SortHeader label="Date" colKey="dateTs" />
              <SortHeader label="Infra" colKey="infrastructure" />
              <SortHeader
                label="Duration"
                colKey="durationSeconds"
                align="right"
              />
              <SortHeader
                label="Blast %"
                colKey="blastRadiusPct"
                align="right"
              />
              <SortHeader
                label="Score"
                colKey="resilienceScore"
                align="right"
              />
              <SortHeader label="Faults" colKey="faultCount" align="right" />
              <SortHeader label="Probes" colKey="probePassRate" align="right" />
              <th className="px-2 py-1.5 text-left text-muted-foreground font-semibold uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((run, i) => (
              <React.Fragment key={run.runId}>
                <tr
                  key={run.runId}
                  className={cn(
                    "border-b border-border/40 hover:bg-secondary/20 transition-colors",
                    i % 2 === 1 && "bg-muted/5",
                    expandedRow === run.runId && "bg-secondary/30",
                  )}
                  data-ocid={`run-row-${run.runId}`}
                >
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      className="text-left w-full"
                      aria-expanded={expandedRow === run.runId}
                      onClick={() =>
                        setExpandedRow(
                          expandedRow === run.runId ? null : run.runId,
                        )
                      }
                    >
                      <div className="font-semibold text-foreground truncate max-w-[180px]">
                        {run.experimentName}
                      </div>
                      <div className="text-muted-foreground">{run.runId}</div>
                    </button>
                  </td>
                  <td className="px-2 py-2 text-muted-foreground whitespace-nowrap">
                    {run.date}
                  </td>
                  <td className="px-2 py-2">
                    <Badge
                      variant="outline"
                      className="text-[8px] font-mono px-1 py-0 h-4 rounded-sm"
                    >
                      {run.infrastructure}
                    </Badge>
                  </td>
                  <td className="px-2 py-2 text-right text-muted-foreground">
                    {run.durationSeconds != null
                      ? `${run.durationSeconds}s`
                      : "—"}
                  </td>
                  <td className="px-2 py-2 text-right">
                    <span
                      className={cn(
                        "font-bold",
                        run.blastRadiusPct >= 50
                          ? "text-destructive"
                          : run.blastRadiusPct >= 25
                            ? "text-chart-4"
                            : "text-foreground",
                      )}
                    >
                      {run.blastRadiusPct}%
                    </span>
                  </td>
                  <td className="px-2 py-2 text-right">
                    {run.resilienceScore != null ? (
                      <span
                        className={cn(
                          "font-bold",
                          run.resilienceScore >= 80
                            ? "text-chart-3"
                            : run.resilienceScore >= 60
                              ? "text-primary"
                              : run.resilienceScore >= 40
                                ? "text-chart-4"
                                : "text-destructive",
                        )}
                      >
                        {run.resilienceScore}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right text-foreground">
                    {run.faultCount}
                  </td>
                  <td className="px-2 py-2 text-right">
                    {run.status === "completed" || run.status === "failed" ? (
                      <span
                        className={cn(
                          "font-bold",
                          run.probePassRate >= 80
                            ? "text-chart-3"
                            : run.probePassRate >= 50
                              ? "text-primary"
                              : "text-destructive",
                        )}
                      >
                        {run.probePassRate}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <span
                      className={cn(
                        "badge-status border text-[8px]",
                        STATUS_BADGE[run.status] ?? STATUS_BADGE.aborted,
                      )}
                    >
                      {run.status === "running" && (
                        <span className="mr-1 animate-pulse">●</span>
                      )}
                      {run.status}
                    </span>
                  </td>
                </tr>
                {expandedRow === run.runId && (
                  <tr
                    key={`${run.runId}-expanded`}
                    className="bg-secondary/10 border-b border-border/40"
                  >
                    <td colSpan={9} className="px-4 py-3">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
                            Run Details
                          </div>
                          <div className="flex flex-col gap-1 text-[10px] font-mono">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Run ID
                              </span>
                              <span className="text-foreground">
                                {run.runId}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Infrastructure
                              </span>
                              <span className="text-foreground">
                                {run.infrastructure}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
                            Fault Impact
                          </div>
                          <div className="flex flex-col gap-1 text-[10px] font-mono">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Faults Injected
                              </span>
                              <span className="text-foreground">
                                {run.faultCount}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Blast Radius
                              </span>
                              <span className="text-foreground">
                                {run.blastRadiusPct}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
                            Probe Results
                          </div>
                          <div className="flex flex-col gap-1 text-[10px] font-mono">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Pass Rate
                              </span>
                              <span
                                className={cn(
                                  "font-bold",
                                  run.probePassRate >= 70
                                    ? "text-chart-3"
                                    : "text-destructive",
                                )}
                              >
                                {run.status === "completed" ||
                                run.status === "failed"
                                  ? `${run.probePassRate}%`
                                  : "—"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Outcome
                              </span>
                              <span className="flex items-center gap-1">
                                {run.status === "completed" &&
                                run.probePassRate >= 70 ? (
                                  <CheckCircle className="h-2.5 w-2.5 text-chart-3" />
                                ) : run.status === "failed" ? (
                                  <AlertTriangle className="h-2.5 w-2.5 text-destructive" />
                                ) : (
                                  <Minus className="h-2.5 w-2.5 text-muted-foreground" />
                                )}
                                <span className="text-foreground capitalize">
                                  {run.status}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {paginated.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-10 text-muted-foreground"
            data-ocid="table-empty-state"
          >
            <AlertTriangle className="h-6 w-6 mb-2 opacity-40" />
            <span className="text-xs font-mono">
              No experiments match filters
            </span>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="px-3 py-2 border-t border-border bg-secondary/10 flex items-center justify-between">
        <span className="text-[9px] font-mono text-muted-foreground">
          Page {page + 1} of {totalPages} · {filtered.length} experiments
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            data-ocid="pagination-prev"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i)
            .filter((i) => Math.abs(i - page) <= 2)
            .map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i)}
                className={cn(
                  "h-6 w-6 text-[9px] font-mono rounded transition-smooth",
                  i === page
                    ? "bg-primary text-primary-foreground font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                )}
                data-ocid={`pagination-page-${i + 1}`}
              >
                {i + 1}
              </button>
            ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            data-ocid="pagination-next"
            aria-label="Next page"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
