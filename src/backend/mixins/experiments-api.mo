import Common "../types/common";
import T "../types/experiments";
import ExperimentsLib "../lib/experiments";
import List "mo:core/List";

mixin (
  experiments : List.List<T.Experiment>,
  nextExperimentId : { var val : Nat },
) {
  /// Create a new experiment (saved as draft)
  public shared ({ caller }) func createExperiment(input : T.ExperimentInput) : async T.ExperimentView {
    let exp = ExperimentsLib.createExperiment(experiments, nextExperimentId.val, input, caller);
    nextExperimentId.val += 1;
    ExperimentsLib.toView(exp);
  };

  /// Get a single experiment by ID
  public query func getExperiment(id : Common.ExperimentId) : async ?T.ExperimentView {
    switch (ExperimentsLib.getExperiment(experiments, id)) {
      case null null;
      case (?exp) ?ExperimentsLib.toView(exp);
    };
  };

  /// List all experiments
  public query func listExperiments() : async [T.ExperimentView] {
    ExperimentsLib.listExperiments(experiments);
  };

  /// List experiments saved as templates
  public query func listTemplates() : async [T.ExperimentView] {
    ExperimentsLib.listTemplates(experiments);
  };

  /// Update an existing experiment
  public shared ({ caller }) func updateExperiment(id : Common.ExperimentId, input : T.ExperimentInput) : async Bool {
    ExperimentsLib.updateExperiment(experiments, id, input, caller);
  };

  /// Delete an experiment
  public shared ({ caller }) func deleteExperiment(id : Common.ExperimentId) : async Bool {
    ExperimentsLib.deleteExperiment(experiments, id, caller);
  };

  /// Clone an existing experiment into a new draft
  public shared ({ caller }) func cloneExperiment(sourceId : Common.ExperimentId) : async ?T.ExperimentView {
    switch (ExperimentsLib.cloneExperiment(experiments, nextExperimentId.val, sourceId, caller)) {
      case null null;
      case (?exp) {
        nextExperimentId.val += 1;
        ?ExperimentsLib.toView(exp);
      };
    };
  };
};
