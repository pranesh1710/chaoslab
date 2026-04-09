import Common "common";

module {
  public type RunStatus = {
    #queued;
    #running;
    #completed;
    #stopped;
    #error;
  };

  public type FaultRunStatus = {
    #pending;
    #executing;
    #completed;
    #failed;
  };

  public type FaultResult = {
    faultId : Common.FaultId;
    var status : FaultRunStatus;
    var startedAt : ?Common.Timestamp;
    var completedAt : ?Common.Timestamp;
    var affectedInstances : Nat;
  };

  public type ProbeResult = {
    probeId : Nat;
    probeName : Text;
    passed : Bool;
    message : Text;
    checkedAt : Common.Timestamp;
  };

  public type MetricsSnapshot = {
    errorRate : Float;
    latencyP50 : Float;
    latencyP95 : Float;
    latencyP99 : Float;
    cpuUtilization : Float;
    memoryUtilization : Float;
    affectedServiceCount : Nat;
    probeResults : [ProbeResult];
  };

  public type LogEntry = {
    id : Nat;
    experimentRunId : Common.RunId;
    timestamp : Common.Timestamp;
    faultType : Text;
    action : Text;
    result : Text;
    affectedTarget : Text;
  };

  public type ExecutionRun = {
    id : Common.RunId;
    experimentId : Common.ExperimentId;
    var status : RunStatus;
    var startedAt : ?Common.Timestamp;
    var completedAt : ?Common.Timestamp;
    var actualDurationSeconds : Nat;
    var faultResults : [FaultResult];
    var metrics : ?MetricsSnapshot;
    var resilienceScore : ?Nat; // 0-100
  };

  // Shared (immutable) version for API boundary
  public type FaultResultView = {
    faultId : Common.FaultId;
    status : FaultRunStatus;
    startedAt : ?Common.Timestamp;
    completedAt : ?Common.Timestamp;
    affectedInstances : Nat;
  };

  public type ExecutionRunView = {
    id : Common.RunId;
    experimentId : Common.ExperimentId;
    status : RunStatus;
    startedAt : ?Common.Timestamp;
    completedAt : ?Common.Timestamp;
    actualDurationSeconds : Nat;
    faultResults : [FaultResultView];
    metrics : ?MetricsSnapshot;
    resilienceScore : ?Nat;
  };
};
