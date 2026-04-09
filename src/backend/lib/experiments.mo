import Common "../types/common";
import T "../types/experiments";
import List "mo:core/List";
import Time "mo:core/Time";

module {
  public func createExperiment(
    experiments : List.List<T.Experiment>,
    nextId : Nat,
    input : T.ExperimentInput,
    owner : Principal,
  ) : T.Experiment {
    let now = Time.now();
    let exp : T.Experiment = {
      id = nextId;
      name = input.name;
      description = input.description;
      hypothesis = input.hypothesis;
      infrastructureTarget = input.infrastructureTarget;
      var status = #draft;
      tags = input.tags;
      owner = owner;
      createdAt = now;
      var updatedAt = now;
      faults = input.faults;
      blastRadius = input.blastRadius;
      probes = input.probes;
      isTemplate = input.isTemplate;
    };
    experiments.add(exp);
    exp;
  };

  public func getExperiment(
    experiments : List.List<T.Experiment>,
    id : Common.ExperimentId,
  ) : ?T.Experiment {
    experiments.find(func(e) { e.id == id });
  };

  public func listExperiments(
    experiments : List.List<T.Experiment>,
  ) : [T.ExperimentView] {
    experiments.toArray().map<T.Experiment, T.ExperimentView>(func(e) { toView(e) });
  };

  public func listTemplates(
    experiments : List.List<T.Experiment>,
  ) : [T.ExperimentView] {
    experiments.filter(func(e : T.Experiment) : Bool { e.isTemplate }).map<T.Experiment, T.ExperimentView>(func(e) { toView(e) }).toArray();
  };

  public func updateExperiment(
    experiments : List.List<T.Experiment>,
    id : Common.ExperimentId,
    input : T.ExperimentInput,
    _caller : Principal,
  ) : Bool {
    switch (getExperiment(experiments, id)) {
      case null false;
      case (?exp) {
        let now = Time.now();
        // Replace in list with new record holding updated immutable fields
        experiments.mapInPlace(func(e : T.Experiment) : T.Experiment {
          if (e.id == id) {
            let updated : T.Experiment = {
              id = exp.id;
              name = input.name;
              description = input.description;
              hypothesis = input.hypothesis;
              infrastructureTarget = input.infrastructureTarget;
              var status = exp.status;
              tags = input.tags;
              owner = exp.owner;
              createdAt = exp.createdAt;
              var updatedAt = now;
              faults = input.faults;
              blastRadius = input.blastRadius;
              probes = input.probes;
              isTemplate = input.isTemplate;
            };
            updated
          } else { e }
        });
        true;
      };
    };
  };

  public func deleteExperiment(
    experiments : List.List<T.Experiment>,
    id : Common.ExperimentId,
    _caller : Principal,
  ) : Bool {
    let before = experiments.size();
    let filtered = experiments.filter(func(e : T.Experiment) : Bool { e.id != id });
    experiments.clear();
    experiments.append(filtered);
    experiments.size() < before;
  };

  public func cloneExperiment(
    experiments : List.List<T.Experiment>,
    nextId : Nat,
    sourceId : Common.ExperimentId,
    owner : Principal,
  ) : ?T.Experiment {
    switch (getExperiment(experiments, sourceId)) {
      case null null;
      case (?src) {
        let now = Time.now();
        let cloned : T.Experiment = {
          id = nextId;
          name = src.name # " (copy)";
          description = src.description;
          hypothesis = src.hypothesis;
          infrastructureTarget = src.infrastructureTarget;
          var status = #draft;
          tags = src.tags;
          owner = owner;
          createdAt = now;
          var updatedAt = now;
          faults = src.faults;
          blastRadius = src.blastRadius;
          probes = src.probes;
          isTemplate = false;
        };
        experiments.add(cloned);
        ?cloned;
      };
    };
  };

  public func updateStatus(
    experiments : List.List<T.Experiment>,
    id : Common.ExperimentId,
    newStatus : T.ExperimentStatus,
  ) : Bool {
    switch (getExperiment(experiments, id)) {
      case null false;
      case (?exp) {
        exp.status := newStatus;
        exp.updatedAt := Time.now();
        true;
      };
    };
  };

  public func toView(experiment : T.Experiment) : T.ExperimentView {
    {
      id = experiment.id;
      name = experiment.name;
      description = experiment.description;
      hypothesis = experiment.hypothesis;
      infrastructureTarget = experiment.infrastructureTarget;
      status = experiment.status;
      tags = experiment.tags;
      owner = experiment.owner.toText();
      createdAt = experiment.createdAt;
      updatedAt = experiment.updatedAt;
      faults = experiment.faults;
      blastRadius = experiment.blastRadius;
      probes = experiment.probes;
      isTemplate = experiment.isTemplate;
    };
  };
};
