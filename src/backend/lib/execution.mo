import Common "../types/common";
import ET "../types/experiments";
import T "../types/execution";
import List "mo:core/List";
import Time "mo:core/Time";

module {
  public func createRun(
    runs : List.List<T.ExecutionRun>,
    nextId : Nat,
    experimentId : Common.ExperimentId,
    faults : [ET.FaultConfig],
  ) : T.ExecutionRun {
    let faultResults : [T.FaultResult] = faults.map<ET.FaultConfig, T.FaultResult>(func(f) {
      {
        faultId = f.id;
        var status = #pending;
        var startedAt = null;
        var completedAt = null;
        var affectedInstances = 0;
      }
    });
    let run : T.ExecutionRun = {
      id = nextId;
      experimentId = experimentId;
      var status = #queued;
      var startedAt = null;
      var completedAt = null;
      var actualDurationSeconds = 0;
      var faultResults = faultResults;
      var metrics = null;
      var resilienceScore = null;
    };
    runs.add(run);
    run;
  };

  public func getRun(
    runs : List.List<T.ExecutionRun>,
    id : Common.RunId,
  ) : ?T.ExecutionRun {
    runs.find(func(r) { r.id == id });
  };

  public func startRun(
    runs : List.List<T.ExecutionRun>,
    id : Common.RunId,
  ) : Bool {
    switch (getRun(runs, id)) {
      case null false;
      case (?run) {
        run.status := #running;
        run.startedAt := ?Time.now();
        true;
      };
    };
  };

  public func completeRun(
    runs : List.List<T.ExecutionRun>,
    id : Common.RunId,
    metrics : T.MetricsSnapshot,
    score : Nat,
  ) : Bool {
    switch (getRun(runs, id)) {
      case null false;
      case (?run) {
        let now = Time.now();
        run.status := #completed;
        run.completedAt := ?now;
        run.metrics := ?metrics;
        run.resilienceScore := ?score;
        switch (run.startedAt) {
          case (?started) {
            let durationNs = now - started;
            run.actualDurationSeconds := (durationNs / 1_000_000_000).toNat();
          };
          case null {};
        };
        true;
      };
    };
  };

  public func emergencyStop(
    runs : List.List<T.ExecutionRun>,
    id : Common.RunId,
  ) : Bool {
    switch (getRun(runs, id)) {
      case null false;
      case (?run) {
        run.status := #stopped;
        run.completedAt := ?Time.now();
        true;
      };
    };
  };

  public func updateFaultResult(
    runs : List.List<T.ExecutionRun>,
    runId : Common.RunId,
    faultId : Common.FaultId,
    status : T.FaultRunStatus,
    affectedInstances : Nat,
  ) : Bool {
    switch (getRun(runs, runId)) {
      case null false;
      case (?run) {
        var found = false;
        let now = Time.now();
        run.faultResults := run.faultResults.map<T.FaultResult, T.FaultResult>(func(fr) {
          if (fr.faultId == faultId) {
            found := true;
            fr.status := status;
            fr.affectedInstances := affectedInstances;
            switch (status) {
              case (#executing) { fr.startedAt := ?now };
              case (#completed) { fr.completedAt := ?now };
              case (#failed) { fr.completedAt := ?now };
              case _ {};
            };
            fr
          } else { fr }
        });
        found;
      };
    };
  };

  public func addLogEntry(
    logs : List.List<T.LogEntry>,
    nextLogId : Nat,
    entry : {
      experimentRunId : Common.RunId;
      faultType : Text;
      action : Text;
      result : Text;
      affectedTarget : Text;
    },
  ) : T.LogEntry {
    let log : T.LogEntry = {
      id = nextLogId;
      experimentRunId = entry.experimentRunId;
      timestamp = Time.now();
      faultType = entry.faultType;
      action = entry.action;
      result = entry.result;
      affectedTarget = entry.affectedTarget;
    };
    logs.add(log);
    log;
  };

  public func getRunLogs(
    logs : List.List<T.LogEntry>,
    runId : Common.RunId,
  ) : [T.LogEntry] {
    logs.filter(func(l : T.LogEntry) : Bool { l.experimentRunId == runId }).toArray();
  };

  public func toView(run : T.ExecutionRun) : T.ExecutionRunView {
    {
      id = run.id;
      experimentId = run.experimentId;
      status = run.status;
      startedAt = run.startedAt;
      completedAt = run.completedAt;
      actualDurationSeconds = run.actualDurationSeconds;
      faultResults = run.faultResults.map<T.FaultResult, T.FaultResultView>(func(fr) { faultResultToView(fr) });
      metrics = run.metrics;
      resilienceScore = run.resilienceScore;
    };
  };

  public func faultResultToView(fr : T.FaultResult) : T.FaultResultView {
    {
      faultId = fr.faultId;
      status = fr.status;
      startedAt = fr.startedAt;
      completedAt = fr.completedAt;
      affectedInstances = fr.affectedInstances;
    };
  };
};
