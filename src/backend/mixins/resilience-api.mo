import ET "../types/experiments";
import ExT "../types/execution";
import T "../types/resilience";
import ResilienceLib "../lib/resilience";
import List "mo:core/List";
import Time "mo:core/Time";

mixin (
  experiments : List.List<ET.Experiment>,
  runs : List.List<ExT.ExecutionRun>,
  scoreHistory : List.List<T.ScoreHistoryEntry>,
) {
  /// Get organization-wide resilience stats (score, trend, breakdowns)
  public query func getOrganizationStats() : async T.OrganizationStats {
    ResilienceLib.getOrganizationStats(scoreHistory, runs, experiments, Time.now());
  };

  /// Get recent experiment runs summarized for the dashboard
  public query func getRecentRuns(limit : Nat) : async [T.RecentRunSummary] {
    ResilienceLib.getRecentRuns(runs, experiments, limit);
  };

  /// Get top failure modes across all experiments
  public query func getTopFailureModes() : async [T.FailureMode] {
    ResilienceLib.getTopFailureModes(runs, experiments);
  };

  /// Filter runs by date range, infrastructure type, and/or service name
  public query func filterRuns(
    dateRange : T.DateRangeFilter,
    infrastructure : ?Text,
    service : ?Text,
  ) : async [T.RecentRunSummary] {
    ResilienceLib.filterRuns(runs, experiments, dateRange, infrastructure, service);
  };
};
