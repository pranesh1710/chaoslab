import Common "common";

module {
  public type InfrastructureTarget = {
    #kubernetes;
    #aws;
    #azure;
    #linux;
    #custom;
  };

  public type ExperimentStatus = {
    #draft;
    #scheduled;
    #running;
    #completed;
    #stopped;
    #error;
  };

  public type FaultParameter = {
    key : Text;
    value : Text;
  };

  public type FaultConfig = {
    id : Common.FaultId;
    faultType : Text;
    severityWeight : Nat; // 1-10
    durationSeconds : Nat;
    parameters : [FaultParameter];
    sequenceOrder : Nat;
  };

  public type BlastRadiusConfig = {
    instancePercentage : Nat; // 0-100
    trafficPercentage : Nat;  // 0-100
    geographicScope : { #single; #multi; #global };
    maxDurationSeconds : Nat;
    autoRollback : Bool;
  };

  public type ProbeType = {
    #http : { url : Text; expectedStatusCode : Nat; timeoutSeconds : Nat };
    #metricThreshold : { metricName : Text; operator : Text; threshold : Float };
    #custom : { description : Text; command : Text };
  };

  public type ProbeConfig = {
    id : Nat;
    name : Text;
    probeType : ProbeType;
  };

  public type Experiment = {
    id : Common.ExperimentId;
    name : Text;
    description : Text;
    hypothesis : Text;
    infrastructureTarget : InfrastructureTarget;
    var status : ExperimentStatus;
    tags : [Text];
    owner : Principal;
    createdAt : Common.Timestamp;
    var updatedAt : Common.Timestamp;
    faults : [FaultConfig];
    blastRadius : BlastRadiusConfig;
    probes : [ProbeConfig];
    isTemplate : Bool;
  };

  public type ExperimentInput = {
    name : Text;
    description : Text;
    hypothesis : Text;
    infrastructureTarget : InfrastructureTarget;
    tags : [Text];
    faults : [FaultConfig];
    blastRadius : BlastRadiusConfig;
    probes : [ProbeConfig];
    isTemplate : Bool;
  };

  // Shared (immutable) version for API boundary
  public type ExperimentView = {
    id : Common.ExperimentId;
    name : Text;
    description : Text;
    hypothesis : Text;
    infrastructureTarget : InfrastructureTarget;
    status : ExperimentStatus;
    tags : [Text];
    owner : Text; // Principal as Text
    createdAt : Common.Timestamp;
    updatedAt : Common.Timestamp;
    faults : [FaultConfig];
    blastRadius : BlastRadiusConfig;
    probes : [ProbeConfig];
    isTemplate : Bool;
  };
};
