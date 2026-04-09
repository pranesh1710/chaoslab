import Common "common";

module {
  public type ScoreHistoryEntry = {
    timestamp : Common.Timestamp;
    score : Nat; // 0-100
    runId : Common.RunId;
  };

  public type InfraBreakdown = {
    infrastructure : Text;
    averageScore : Nat;
    runCount : Nat;
  };

  public type ServiceBreakdown = {
    service : Text;
    averageScore : Nat;
    failureCount : Nat;
  };

  public type FailureMode = {
    faultType : Text;
    occurrenceCount : Nat;
    averageSeverity : Nat;
  };

  public type OrganizationStats = {
    currentScore : Nat; // weighted avg of last 30 days
    scoreHistory : [ScoreHistoryEntry];
    breakdownByInfrastructure : [InfraBreakdown];
    breakdownByService : [ServiceBreakdown];
    topFailureModes : [FailureMode];
  };

  public type RecentRunSummary = {
    runId : Common.RunId;
    experimentId : Common.ExperimentId;
    experimentName : Text;
    date : Common.Timestamp;
    score : ?Nat;
    faultCount : Nat;
    probePassRate : Float; // 0.0 - 1.0
    status : Text;
  };

  public type DateRangeFilter = {
    fromTs : ?Common.Timestamp;
    toTs : ?Common.Timestamp;
  };
};
