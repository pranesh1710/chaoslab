import ET "./types/experiments";
import ExT "./types/execution";
import RT "./types/resilience";
import List "mo:core/List";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

import ExperimentsApi "./mixins/experiments-api";
import ExecutionApi "./mixins/execution-api";
import ResilienceApi "./mixins/resilience-api";

import ExperimentsLib "./lib/experiments";
import ExecutionLib "./lib/execution";
import ResilienceLib "./lib/resilience";

actor {
  // ── Counters ──────────────────────────────────────────────────────────────
  let nextExperimentId = { var val : Nat = 1 };
  let nextRunId        = { var val : Nat = 1 };
  let nextLogId        = { var val : Nat = 1 };

  // ── State ─────────────────────────────────────────────────────────────────
  let experiments  : List.List<ET.Experiment>        = List.empty();
  let runs         : List.List<ExT.ExecutionRun>     = List.empty();
  let logs         : List.List<ExT.LogEntry>         = List.empty();
  let scoreHistory : List.List<RT.ScoreHistoryEntry> = List.empty();

  // ── Seed sample data ──────────────────────────────────────────────────────
  do {
    let owner = Principal.fromText("2vxsx-fae");
    // Base time: 30 days ago in nanoseconds
    let baseTime : Int = Time.now() - (30 * 24 * 60 * 60 * 1_000_000_000);
    let dayNs : Int = 24 * 60 * 60 * 1_000_000_000;

    // ── Experiment 1: Pod Network Partition ──────────────────────────────
    let exp1Faults : [ET.FaultConfig] = [
      {
        id = 1; faultType = "network-partition"; severityWeight = 8; durationSeconds = 60;
        parameters = [{ key = "target"; value = "backend-pods" }, { key = "packet-loss"; value = "100%" }];
        sequenceOrder = 1;
      },
      {
        id = 2; faultType = "latency-injection"; severityWeight = 5; durationSeconds = 30;
        parameters = [{ key = "delay-ms"; value = "2000" }, { key = "jitter-ms"; value = "500" }];
        sequenceOrder = 2;
      },
    ];
    let exp1 = ExperimentsLib.createExperiment(experiments, nextExperimentId.val, {
      name = "Pod Network Partition — Kubernetes";
      description = "Simulate network partition between frontend and backend pods to verify circuit breaker behavior.";
      hypothesis = "Circuit breakers will open within 30s and fallback responses will maintain >95% availability.";
      infrastructureTarget = #kubernetes;
      tags = ["network", "circuit-breaker", "kubernetes"];
      faults = exp1Faults;
      blastRadius = { instancePercentage = 25; trafficPercentage = 10; geographicScope = #single; maxDurationSeconds = 300; autoRollback = true };
      probes = [
        { id = 1; name = "API Health Check"; probeType = #http { url = "https://api.internal/health"; expectedStatusCode = 200; timeoutSeconds = 5 } },
        { id = 2; name = "Error Rate Threshold"; probeType = #metricThreshold { metricName = "error_rate"; operator = "lt"; threshold = 0.05 } },
      ];
      isTemplate = false;
    }, owner);
    nextExperimentId.val += 1;
    exp1.status := #completed;

    // ── Experiment 2: CPU Starvation — AWS ───────────────────────────────
    let exp2Faults : [ET.FaultConfig] = [
      {
        id = 3; faultType = "cpu-starvation"; severityWeight = 9; durationSeconds = 120;
        parameters = [{ key = "cpu-load"; value = "95" }, { key = "core-count"; value = "all" }];
        sequenceOrder = 1;
      },
      {
        id = 4; faultType = "memory-pressure"; severityWeight = 6; durationSeconds = 90;
        parameters = [{ key = "memory-percent"; value = "80" }];
        sequenceOrder = 2;
      },
      {
        id = 5; faultType = "disk-io-saturation"; severityWeight = 4; durationSeconds = 60;
        parameters = [{ key = "iops-limit"; value = "100" }];
        sequenceOrder = 3;
      },
    ];
    let exp2 = ExperimentsLib.createExperiment(experiments, nextExperimentId.val, {
      name = "CPU Starvation — AWS EC2 Autoscaling";
      description = "Exhaust CPU on 20% of EC2 instances to validate autoscaling triggers within SLA.";
      hypothesis = "Autoscaling group will provision new instances within 2 minutes, maintaining p99 latency under 500ms.";
      infrastructureTarget = #aws;
      tags = ["cpu", "autoscaling", "aws", "performance"];
      faults = exp2Faults;
      blastRadius = { instancePercentage = 20; trafficPercentage = 20; geographicScope = #single; maxDurationSeconds = 600; autoRollback = true };
      probes = [
        { id = 3; name = "Autoscale Trigger"; probeType = #metricThreshold { metricName = "pending_instances"; operator = "gt"; threshold = 0.0 } },
        { id = 4; name = "P99 Latency"; probeType = #metricThreshold { metricName = "latency_p99_ms"; operator = "lt"; threshold = 500.0 } },
      ];
      isTemplate = false;
    }, owner);
    nextExperimentId.val += 1;
    exp2.status := #completed;

    // ── Experiment 3: Regional Failover — Azure ───────────────────────────
    let exp3Faults : [ET.FaultConfig] = [
      {
        id = 6; faultType = "regional-service-failure"; severityWeight = 10; durationSeconds = 180;
        parameters = [{ key = "region"; value = "eastus" }, { key = "services"; value = "all" }];
        sequenceOrder = 1;
      },
      {
        id = 7; faultType = "dns-failure"; severityWeight = 7; durationSeconds = 60;
        parameters = [{ key = "resolver"; value = "primary" }];
        sequenceOrder = 2;
      },
    ];
    let exp3 = ExperimentsLib.createExperiment(experiments, nextExperimentId.val, {
      name = "Regional Failover — Azure East US";
      description = "Simulate complete regional failure of East US to test geo-redundant failover to West US.";
      hypothesis = "Traffic failover to West US completes within 60s with zero data loss and <1% error spike.";
      infrastructureTarget = #azure;
      tags = ["regional", "failover", "azure", "disaster-recovery"];
      faults = exp3Faults;
      blastRadius = { instancePercentage = 50; trafficPercentage = 50; geographicScope = #multi; maxDurationSeconds = 900; autoRollback = true };
      probes = [
        { id = 5; name = "West US Endpoint"; probeType = #http { url = "https://westus.api.internal/health"; expectedStatusCode = 200; timeoutSeconds = 10 } },
        { id = 6; name = "Data Consistency Check"; probeType = #custom { description = "Verify last-write-wins replication"; command = "check-replication.sh" } },
      ];
      isTemplate = false;
    }, owner);
    nextExperimentId.val += 1;
    exp3.status := #completed;

    // ── Experiment 4: Disk I/O Saturation — Linux ─────────────────────────
    let exp4Faults : [ET.FaultConfig] = [
      {
        id = 8; faultType = "disk-io-saturation"; severityWeight = 8; durationSeconds = 90;
        parameters = [{ key = "target"; value = "/dev/sda" }, { key = "fill-rate"; value = "100MB/s" }];
        sequenceOrder = 1;
      },
      {
        id = 9; faultType = "process-kill"; severityWeight = 9; durationSeconds = 10;
        parameters = [{ key = "process"; value = "postgres" }, { key = "signal"; value = "SIGKILL" }];
        sequenceOrder = 2;
      },
    ];
    let exp4 = ExperimentsLib.createExperiment(experiments, nextExperimentId.val, {
      name = "Disk I/O Saturation — Linux DB Nodes";
      description = "Saturate disk I/O on database nodes to test read-replica promotion and query routing.";
      hypothesis = "Read traffic automatically routes to replicas within 15s, maintaining <5% query error rate.";
      infrastructureTarget = #linux;
      tags = ["disk", "database", "linux", "io"];
      faults = exp4Faults;
      blastRadius = { instancePercentage = 33; trafficPercentage = 15; geographicScope = #single; maxDurationSeconds = 300; autoRollback = true };
      probes = [
        { id = 7; name = "DB Replica Health"; probeType = #http { url = "http://db-replica.internal/status"; expectedStatusCode = 200; timeoutSeconds = 5 } },
        { id = 8; name = "Query Error Rate"; probeType = #metricThreshold { metricName = "db_query_errors"; operator = "lt"; threshold = 0.05 } },
      ];
      isTemplate = true;
    }, owner);
    nextExperimentId.val += 1;
    exp4.status := #completed;

    // ── Experiment 5: Latency Injection — Custom Service Mesh ─────────────
    let exp5Faults : [ET.FaultConfig] = [
      {
        id = 10; faultType = "latency-injection"; severityWeight = 6; durationSeconds = 45;
        parameters = [{ key = "delay-ms"; value = "3500" }, { key = "affected-routes"; value = "/api/v2/*" }];
        sequenceOrder = 1;
      },
      {
        id = 11; faultType = "http-error-injection"; severityWeight = 5; durationSeconds = 30;
        parameters = [{ key = "error-code"; value = "503" }, { key = "error-rate"; value = "0.3" }];
        sequenceOrder = 2;
      },
      {
        id = 12; faultType = "connection-reset"; severityWeight = 7; durationSeconds = 20;
        parameters = [{ key = "target-service"; value = "payment-svc" }];
        sequenceOrder = 3;
      },
      {
        id = 13; faultType = "packet-corruption"; severityWeight = 4; durationSeconds = 15;
        parameters = [{ key = "corruption-rate"; value = "0.1" }];
        sequenceOrder = 4;
      },
    ];
    let exp5 = ExperimentsLib.createExperiment(experiments, nextExperimentId.val, {
      name = "Latency Injection — Service Mesh Timeout Validation";
      description = "Inject variable latency into inter-service calls to verify timeout and retry configurations.";
      hypothesis = "Retry budgets exhaust gracefully and upstream timeouts cascade correctly without thundering herd.";
      infrastructureTarget = #custom;
      tags = ["latency", "service-mesh", "timeouts", "retries"];
      faults = exp5Faults;
      blastRadius = { instancePercentage = 15; trafficPercentage = 5; geographicScope = #single; maxDurationSeconds = 180; autoRollback = true };
      probes = [
        { id = 9; name = "Retry Budget Check"; probeType = #metricThreshold { metricName = "retry_budget_remaining"; operator = "gt"; threshold = 0.2 } },
        { id = 10; name = "Circuit Breaker Open Rate"; probeType = #metricThreshold { metricName = "circuit_breaker_open_pct"; operator = "lt"; threshold = 0.5 } },
        { id = 11; name = "User-facing Error Rate"; probeType = #http { url = "https://app.internal/api/health"; expectedStatusCode = 200; timeoutSeconds = 8 } },
      ];
      isTemplate = false;
    }, owner);
    nextExperimentId.val += 1;
    exp5.status := #completed;

    // ── Helper: seed a completed run with realistic metrics ───────────────
    func seedRun(
      expId : Nat,
      faultConfigs : [ET.FaultConfig],
      probeResultsArr : [ExT.ProbeResult],
      errorRate : Float,
      latP50 : Float,
      latP95 : Float,
      latP99 : Float,
      cpu : Float,
      mem : Float,
      affectedSvcs : Nat,
      daysFromBase : Int,
    ) {
      let run = ExecutionLib.createRun(runs, nextRunId.val, expId, faultConfigs);
      nextRunId.val += 1;
      let startTs = baseTime + daysFromBase * dayNs;
      run.status := #running;
      run.startedAt := ?startTs;
      run.faultResults := run.faultResults.map<ExT.FaultResult, ExT.FaultResult>(func(fr) {
        fr.status := #completed;
        fr.startedAt := ?(startTs + 5_000_000_000);
        fr.completedAt := ?(startTs + 65_000_000_000);
        fr.affectedInstances := 3;
        fr
      });
      let metrics : ExT.MetricsSnapshot = {
        errorRate = errorRate;
        latencyP50 = latP50;
        latencyP95 = latP95;
        latencyP99 = latP99;
        cpuUtilization = cpu;
        memoryUtilization = mem;
        affectedServiceCount = affectedSvcs;
        probeResults = probeResultsArr;
      };
      let faultResultViews = run.faultResults.map(
        func(fr) { ExecutionLib.faultResultToView(fr) }
      );
      let score = ResilienceLib.calculateScore(metrics, faultConfigs, faultResultViews);
      run.status := #completed;
      run.completedAt := ?(startTs + 120_000_000_000);
      run.actualDurationSeconds := 120;
      run.metrics := ?metrics;
      run.resilienceScore := ?score;
      ignore ResilienceLib.addScoreEntry(scoreHistory, run.id, score, startTs);
    };

    // Run 1 — exp1 (network partition) — 5 days from base (day 25)
    seedRun(
      exp1.id, exp1Faults,
      [
        { probeId = 1; probeName = "API Health Check"; passed = true; message = "200 OK"; checkedAt = baseTime + 25 * dayNs + 30_000_000_000 },
        { probeId = 2; probeName = "Error Rate Threshold"; passed = true; message = "error_rate=0.02"; checkedAt = baseTime + 25 * dayNs + 60_000_000_000 },
      ],
      0.02, 120.0, 310.0, 490.0, 45.0, 62.0, 2, 25
    );

    // Run 2 — exp2 (CPU starvation) — day 12
    seedRun(
      exp2.id, exp2Faults,
      [
        { probeId = 3; probeName = "Autoscale Trigger"; passed = true; message = "2 new instances provisioned"; checkedAt = baseTime + 12 * dayNs + 90_000_000_000 },
        { probeId = 4; probeName = "P99 Latency"; passed = false; message = "latency_p99=623ms exceeds 500ms threshold"; checkedAt = baseTime + 12 * dayNs + 60_000_000_000 },
      ],
      0.04, 180.0, 420.0, 623.0, 94.0, 78.0, 4, 12
    );

    // Run 3 — exp3 (regional failover) — day 18
    seedRun(
      exp3.id, exp3Faults,
      [
        { probeId = 5; probeName = "West US Endpoint"; passed = true; message = "200 OK — failover active"; checkedAt = baseTime + 18 * dayNs + 45_000_000_000 },
        { probeId = 6; probeName = "Data Consistency Check"; passed = true; message = "Replication lag <500ms"; checkedAt = baseTime + 18 * dayNs + 90_000_000_000 },
      ],
      0.009, 95.0, 285.0, 410.0, 38.0, 55.0, 6, 18
    );

    // Run 4 — exp4 (disk I/O) — day 8
    seedRun(
      exp4.id, exp4Faults,
      [
        { probeId = 7; probeName = "DB Replica Health"; passed = true; message = "Replica promoted successfully"; checkedAt = baseTime + 8 * dayNs + 20_000_000_000 },
        { probeId = 8; probeName = "Query Error Rate"; passed = false; message = "error_rate=0.08 exceeds 0.05 threshold"; checkedAt = baseTime + 8 * dayNs + 40_000_000_000 },
      ],
      0.08, 145.0, 380.0, 710.0, 82.0, 88.0, 3, 8
    );

    // Run 5 — exp5 (latency injection) — day 27
    seedRun(
      exp5.id, exp5Faults,
      [
        { probeId = 9; probeName = "Retry Budget Check"; passed = true; message = "budget_remaining=0.35"; checkedAt = baseTime + 27 * dayNs + 30_000_000_000 },
        { probeId = 10; probeName = "Circuit Breaker Open Rate"; passed = true; message = "open_pct=0.2"; checkedAt = baseTime + 27 * dayNs + 45_000_000_000 },
        { probeId = 11; probeName = "User-facing Error Rate"; passed = false; message = "503 Service Unavailable"; checkedAt = baseTime + 27 * dayNs + 60_000_000_000 },
      ],
      0.06, 200.0, 3800.0, 4200.0, 55.0, 68.0, 5, 27
    );
  };

  // ── API Mixins ────────────────────────────────────────────────────────────
  include ExperimentsApi(experiments, nextExperimentId);
  include ExecutionApi(experiments, runs, logs, scoreHistory, nextRunId, nextLogId);
  include ResilienceApi(experiments, runs, scoreHistory);
};
