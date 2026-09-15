export interface EnvState {
  tOut: number;
  ghi: number;
  solarElev: number;
  solarAzimuth: number;
  occupancy: number;
  setpoint: number;
  cloud: number;
  hour: number;
}

export interface FacadeConfig {
  blindDeploy: number;
  slatAngle: number;
  ventOpen: number;
}

export interface Performance {
  illuminance: number;
  dgp: number;
  pmv: number;
  indoorTemp: number;
  energyW: number;
  solarGainW: number;
  ventFlowW: number;
  transmittance: number;
}

export interface Preferences {
  daylightTarget: number;
  glareMax: number;
  tempMove: number;
  energyPriority: number;
}

export interface ControlStep {
  hour: number;
  env: EnvState;
  config: FacadeConfig;
  perf: Performance;
  predicted: Performance;
  cost: number;
  override: number;
  note: string;
}

export interface TrainingHistoryPoint {
  epoch: number;
  trainLoss: number;
  valLoss: number;
}

export interface SurrogateModel {
  inputMean: number[];
  inputStd: number[];
  outputMean: number[];
  outputStd: number[];
  w1: number[][];
  b1: number[];
  w2: number[][];
  b2: number[];
  w3: number[][];
  b3: number[];
}

export interface TrainResult {
  model: SurrogateModel;
  history: TrainingHistoryPoint[];
  r2: number;
  mae: number;
  parityTrue: number[];
  parityPred: number[];
  evalTimeUs: number;
  samples: number;
}

export type Season = "summer" | "winter";

export interface SimState {
  hour: number;
  cloud: number;
  season: Season;
  occupancy: number;
  freeConditions: boolean;
  freeEnv: Partial<EnvState>;
  config: FacadeConfig;
  prefs: Preferences;
  overrideTimer: number;
  history: ControlStep[];
  energyKWh: number;
  lastNote: string;
  lastCost: number;
}

export interface TrainProgress {
  phase: "generating" | "training" | "evaluating" | "done";
  fraction: number;
  epoch: number;
  trainLoss: number;
  valLoss: number;
  message: string;
}