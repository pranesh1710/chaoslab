import Common "../types/common";
import ExT "../types/execution";
import ET "../types/experiments";
import RT "../types/resilience";
import ExecutionLib "../lib/execution";
import ResilienceLib "../lib/resilience";
import List "mo:core/List";
import Time "mo:core/Time";

mixin (
  experiments : List.List<ET.Experiment>,
  runs : List.List<ExT.ExecutionRun>,
  logs : List.List<ExT.LogEntry>,
  scoreHistory : List.List<RT.ScoreHistoryEntry>,
  nextRunId : { var val : Nat },
  nextLogId : { var val : Nat },
) {
  /// Queue a new execution run for an experiment
  public shared ({ caller = _ }) func startExperiment(experimentId : Common.ExperimentId) : async ?ExT.ExecutionRunView {
    switch (experiments.find(func(e : ET.Experiment) : Bool { e.id == experimentId })) {
      case null null;
      case (?exp) {
        let run = ExecutionLib.createRun(runs, nextRunId.val, experimentId, exp.faults);
        nextRunId.val += 1;
        ignore ExecutionLib.startRun(runs, run.id);
        ?ExecutionLib.toView(run);
      };
    };
  };

  /// Get a single execution run by ID
  public query func getExecutionRun(id : Common.RunId) : async ?ExT.ExecutionRunView {
    switch (ExecutionLib.getRun(runs, id)) {
      case null null;
      case (?run) ?ExecutionLib.toView(run);
    };
  };

  /// List all runs for an experiment
  public query func listRunsByExperiment(experimentId : Common.ExperimentId) : async [ExT.ExecutionRunView] {
    runs.filter(func(r : ExT.ExecutionRun) : Bool { r.experimentId == experimentId })
      .map<ExT.ExecutionRun, ExT.ExecutionRunView>(func(r) { ExecutionLib.toView(r) })
      .toArray();
  };

  /// Emergency stop: immediately set run status to #stopped
  public shared ({ caller = _ }) func emergencyStop(runId : Common.RunId) : async Bool {
    ExecutionLib.emergencyStop(runs, runId);
  };

  /// Update fault execution result within a run
  public shared ({ caller = _ }) func updateFaultResult(
    runId : Common.RunId,
    faultId : Common.FaultId,
    status : ExT.FaultRunStatus,
    affectedInstances : Nat,
  ) : async Bool {
    ExecutionLib.updateFaultResult(runs, runId, faultId, status, affectedInstances);
  };

  /// Complete a run with final metrics and auto-calculate resilience score
  public shared ({ caller = _ }) func completeRun(
    runId : Common.RunId,
    metrics : ExT.MetricsSnapshot,
  ) : async Bool {
    switch (ExecutionLib.getRun(runs, runId)) {
      case null false;
      case (?run) {
        let faults = switch (experiments.find(func(e : ET.Experiment) : Bool { e.id == run.experimentId })) {
          case null [];
          case (?exp) exp.faults;
        };
        let faultResultViews = run.faultResults.map(
          func(fr) { ExecutionLib.faultResultToView(fr) }
        );
        let score = ResilienceLib.calculateScore(metrics, faults, faultResultViews);
        let ok = ExecutionLib.completeRun(runs, runId, metrics, score);
        if (ok) {
          ignore ResilienceLib.addScoreEntry(scoreHistory, runId, score, Time.now());
        };
        ok;
      };
    };
  };

  /// Get log entries for a run
  public query func getRunLogs(runId : Common.RunId) : async [ExT.LogEntry] {
    ExecutionLib.getRunLogs(logs, runId);
  };

  /// Add a log entry to a run
  public shared ({ caller = _ }) func addLogEntry(
    runId : Common.RunId,
    faultType : Text,
    action : Text,
    result : Text,
    affectedTarget : Text,
  ) : async ExT.LogEntry {
    let entry = ExecutionLib.addLogEntry(logs, nextLogId.val, {
      experimentRunId = runId;
      faultType = faultType;
      action = action;
      result = result;
      affectedTarget = affectedTarget;
    });
    nextLogId.val += 1;
    entry;
  };
};
