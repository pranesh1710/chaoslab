import Time "mo:core/Time";

module {
  public type Timestamp = Time.Time; // Int nanoseconds
  public type ExperimentId = Nat;
  public type RunId = Nat;
  public type FaultId = Nat;
};
