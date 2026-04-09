import Common "../types/common";
import ET "../types/experiments";
import ExT "../types/execution";
import T "../types/resilience";
import List "mo:core/List";
import Time "mo:core/Time";
import Int "mo:core/Int";

module {
  /// Score formula:
  /// start = 100
  /// subtract (failedProbes / totalProbes) * 50
  /// subtract (failedFaults / totalFaults * avgSeverity / 10) * 50
  /// floor 0
  public func calculateScore(
    metrics : ExT.MetricsSnapshot,
    faults : [ET.FaultConfig],
    faultResults : [ExT.FaultResultView],
  ) : Nat {
    var score : Float = 100.0;

    // Probe penalty
    let totalProbes = metrics.probeResults.size();
    if (totalProbes > 0) {
      let failedProbes = metrics.probeResults.filter(func(p : ExT.ProbeResult) : Bool { not p.passed }).size();
      let probePenalty = (failedProbes.toFloat() / totalProbes.toFloat()) * 50.0;
      score -= probePenalty;
    };

    // Fault penalty
    let totalFaults = faultResults.size();
    if (totalFaults > 0) {
      let failedFaults = faultResults.filter(func(fr : ExT.FaultResultView) : Bool {
        switch (fr.status) { case (#failed) true; case _ false }
      }).size();
      let totalSeverity = faults.foldLeft(0, func(acc, f) { acc + f.severityWeight });
      let avgSeverity : Float = if (faults.size() > 0) {
        totalSeverity.toFloat() / faults.size().toFloat()
      } else { 5.0 };
      let faultPenalty = (failedFaults.toFloat() / totalFaults.toFloat()) * (avgSeverity / 10.0) * 50.0;
      score -= faultPenalty;
    };

    if (score < 0.0) { 0 } else { Int.abs(score.toInt()) };
  };

  public func addScoreEntry(
    history : List.List<T.ScoreHistoryEntry>,
    runId : Common.RunId,
    score : Nat,
    ts : Common.Timestamp,
  ) : T.ScoreHistoryEntry {
    let entry : T.ScoreHistoryEntry = {
      timestamp = ts;
      score = score;
      runId = runId;
    };
    history.add(entry);
    entry;
  };

  public func calculateCurrentScore(
    history : List.List<T.ScoreHistoryEntry>,
    nowTs : Common.Timestamp,
  ) : Nat {
    let thirtyDaysNs : Int = 30 * 24 * 60 * 60 * 1_000_000_000;
    let cutoff : Common.Timestamp = nowTs - thirtyDaysNs;
    let recent = history.filter(func(e : T.ScoreHistoryEntry) : Bool { e.timestamp >= cutoff }).toArray();
    if (recent.size() == 0) { return 100 };
    var total : Nat = 0;
    recent.forEach(func(e : T.ScoreHistoryEntry) { total += e.score });
    total / recent.size();
  };

  public func getOrganizationStats(
    history : List.List<T.ScoreHistoryEntry>,
    runs : List.List<ExT.ExecutionRun>,
    experiments : List.List<ET.Experiment>,
    nowTs : Common.Timestamp,
  ) : T.OrganizationStats {
    let currentScore = calculateCurrentScore(history, nowTs);
    let historyArr = history.toArray();
    let infraBreakdown = buildInfraBreakdown(runs, experiments);
    let failureModes = buildFailureModes(runs, experiments);
    {
      currentScore = currentScore;
      scoreHistory = historyArr;
      breakdownByInfrastructure = infraBreakdown;
      breakdownByService = [];
      topFailureModes = failureModes;
    };
  };

  public func getRecentRuns(
    runs : List.List<ExT.ExecutionRun>,
    experiments : List.List<ET.Experiment>,
    limit : Nat,
  ) : [T.RecentRunSummary] {
    let allRuns = runs.toArray();
    // Sort by id descending (higher id = more recent)
    let sorted = allRuns.sort(func(a, b) {
      if (a.id > b.id) #less else if (a.id < b.id) #greater else #equal
    });
    let limited = if (sorted.size() <= limit) sorted else sorted.sliceToArray(0, limit);
    limited.map<ExT.ExecutionRun, T.RecentRunSummary>(func(run) {
      runToSummary(run, experiments)
    });
  };

  public func getTopFailureModes(
    runs : List.List<ExT.ExecutionRun>,
    experiments : List.List<ET.Experiment>,
  ) : [T.FailureMode] {
    buildFailureModes(runs, experiments);
  };

  public func filterRuns(
    runs : List.List<ExT.ExecutionRun>,
    experiments : List.List<ET.Experiment>,
    dateRange : T.DateRangeFilter,
    infrastructure : ?Text,
    _service : ?Text,
  ) : [T.RecentRunSummary] {
    let filtered = runs.filter(func(run : ExT.ExecutionRun) : Bool {
      let passDate = switch (run.startedAt) {
        case null false;
        case (?ts) {
          let afterFrom = switch (dateRange.fromTs) {
            case null true;
            case (?from) ts >= from;
          };
          let beforeTo = switch (dateRange.toTs) {
            case null true;
            case (?to) ts <= to;
          };
          afterFrom and beforeTo;
        };
      };
      let passInfra = switch (infrastructure) {
        case null true;
        case (?infra) {
          switch (experiments.find(func(e : ET.Experiment) : Bool { e.id == run.experimentId })) {
            case null false;
            case (?exp) infraToText(exp.infrastructureTarget) == infra;
          }
        };
      };
      passDate and passInfra;
    });
    filtered.map<ExT.ExecutionRun, T.RecentRunSummary>(func(run) {
      runToSummary(run, experiments)
    }).toArray();
  };

  // ── Private helpers ────────────────────────────────────────────────────────

  func infraToText(target : ET.InfrastructureTarget) : Text {
    switch (target) {
      case (#kubernetes) "kubernetes";
      case (#aws) "aws";
      case (#azure) "azure";
      case (#linux) "linux";
      case (#custom) "custom";
    };
  };

  func runToSummary(
    run : ExT.ExecutionRun,
    experiments : List.List<ET.Experiment>,
  ) : T.RecentRunSummary {
    let expName = switch (experiments.find(func(e : ET.Experiment) : Bool { e.id == run.experimentId })) {
      case null "Unknown";
      case (?e) e.name;
    };
    let probePassRate : Float = switch (run.metrics) {
      case null 1.0;
      case (?m) {
        let total = m.probeResults.size();
        if (total == 0) { 1.0 } else {
          let passed = m.probeResults.filter(func(p : ExT.ProbeResult) : Bool { p.passed }).size();
          passed.toFloat() / total.toFloat()
        };
      };
    };
    let statusText = switch (run.status) {
      case (#queued) "queued";
      case (#running) "running";
      case (#completed) "completed";
      case (#stopped) "stopped";
      case (#error) "error";
    };
    {
      runId = run.id;
      experimentId = run.experimentId;
      experimentName = expName;
      date = switch (run.startedAt) { case null 0; case (?ts) ts };
      score = run.resilienceScore;
      faultCount = run.faultResults.size();
      probePassRate = probePassRate;
      status = statusText;
    };
  };

  func buildInfraBreakdown(
    runs : List.List<ExT.ExecutionRun>,
    experiments : List.List<ET.Experiment>,
  ) : [T.InfraBreakdown] {
    // Collect (infraText, score) pairs for completed runs
    let pairs = List.empty<(Text, Nat)>();
    runs.forEach(func(run : ExT.ExecutionRun) {
      switch (run.resilienceScore) {
        case null {};
        case (?score) {
          switch (experiments.find(func(e : ET.Experiment) : Bool { e.id == run.experimentId })) {
            case null {};
            case (?exp) pairs.add((infraToText(exp.infrastructureTarget), score));
          };
        };
      };
    });

    let infraTypes = ["kubernetes", "aws", "azure", "linux", "custom"];
    infraTypes.filterMap<Text, T.InfraBreakdown>(func(infra) {
      let matching = pairs.filter(func(pair : (Text, Nat)) : Bool { pair.0 == infra }).toArray();
      if (matching.size() == 0) { null } else {
        let total = matching.foldLeft(0, func(acc, pair) { acc + pair.1 });
        ?{
          infrastructure = infra;
          averageScore = total / matching.size();
          runCount = matching.size();
        }
      }
    });
  };

  func buildFailureModes(
    runs : List.List<ExT.ExecutionRun>,
    experiments : List.List<ET.Experiment>,
  ) : [T.FailureMode] {
    // Collect all (faultType, severityWeight) seen across all runs' experiments
    let faultData = List.empty<(Text, Nat)>();
    runs.forEach(func(run : ExT.ExecutionRun) {
      switch (experiments.find(func(e : ET.Experiment) : Bool { e.id == run.experimentId })) {
        case null {};
        case (?exp) {
          exp.faults.forEach(func(f : ET.FaultConfig) {
            faultData.add((f.faultType, f.severityWeight));
          });
        };
      };
    });

    // Deduplicate fault types
    let seen = List.empty<Text>();
    faultData.forEach(func(pair : (Text, Nat)) {
      if (seen.find(func(s : Text) : Bool { s == pair.0 }) == null) {
        seen.add(pair.0);
      };
    });

    seen.toArray().map<Text, T.FailureMode>(func(faultType) {
      let matching = faultData.filter(func(pair : (Text, Nat)) : Bool { pair.0 == faultType }).toArray();
      let totalSev = matching.foldLeft(0, func(acc, pair) { acc + pair.1 });
      let avgSev = if (matching.size() == 0) 0 else totalSev / matching.size();
      {
        faultType = faultType;
        occurrenceCount = matching.size();
        averageSeverity = avgSev;
      }
    });
  };
};
