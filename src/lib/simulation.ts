import {
  DAY_START_H,
  DAY_END_H,
  DEFAULT_PREFS,
  SETPOINT,
} from "./constants";
import { sunElevationAt, sunAzimuthAt } from "./physics/solar";
import type {
  EnvState,
  Preferences,
  Season,
  SimState,
  SurrogateModel,
  ControlStep,
} from "./types";
import { simulateFacade } from "./physics/facade";
import { mpcControl } from "./ml/controller";

export function makeEnv(
  hour: number,
  cloud: number,
  season: Season,
  occupancy: number,
  speedOverride?: Partial<EnvState>
): EnvState {
  const elev = Math.max(0, sunElevationAt(hour));
  const baseGhi =
    950 * Math.pow(Math.max(0, Math.sin((elev * Math.PI) / 180)), 1.25);
  const ghi =
    speedOverride?.ghi ?? (baseGhi * (0.12 + 0.88 * (1 - cloud)) + 18);

  const seasonBase = season === "winter" ? 0 : 11;
  const tOut =
    speedOverride?.tOut ??
    seasonBase +
      9 +
      8 * Math.sin(((hour - DAY_START_H) / (DAY_END_H - DAY_START_H)) * Math.PI) -
      5 * cloud;

  const occ = speedOverride?.occupancy ?? occupancy;

  return {
    tOut,
    ghi: Math.max(0, ghi),
    solarElev: elev,
    solarAzimuth: sunAzimuthAt(hour),
    occupancy: occ,
    setpoint: speedOverride?.setpoint ?? SETPOINT,
    cloud,
    hour,
  };
}

export function localClock(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.floor((hour - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function initialSimState(): SimState {
  const hour = 10;
  return {
    hour,
    cloud: 0.35,
    season: "summer",
    occupancy: 1,
    freeConditions: false,
    freeEnv: {},
    config: { blindDeploy: 0.5, slatAngle: 30, ventOpen: 0.3 },
    prefs: { ...DEFAULT_PREFS },
    overrideTimer: 0,
    history: [],
    energyKWh: 0,
    lastNote: "Awaiting control model",
    lastCost: 0,
  };
}

export function stepSimulation(
  state: SimState,
  model: SurrogateModel | null,
  dtHours: number
): { state: SimState; step?: ControlStep } {
  const hour = state.freeConditions
    ? state.hour
    : Math.min(DAY_END_H, state.hour + dtHours);

  const cloud =
    state.freeConditions
      ? state.cloud
      : Math.max(0.05, Math.min(0.95, state.cloud + 0.06 * Math.sin((hour - 6) / 2.1)));

  const env = makeEnv(hour, cloud, state.season, state.occupancy, state.freeEnv);

  const override = Math.max(0, state.overrideTimer - dtHours);
  const blend = Math.min(1, override / 30);

  const prefs: Preferences = {
    daylightTarget:
      DEFAULT_PREFS.daylightTarget +
      (state.prefs.daylightTarget - DEFAULT_PREFS.daylightTarget) * blend,
    glareMax:
      DEFAULT_PREFS.glareMax +
      (state.prefs.glareMax - DEFAULT_PREFS.glareMax) * blend,
    tempMove: state.prefs.tempMove * blend,
    energyPriority:
      DEFAULT_PREFS.energyPriority +
      (state.prefs.energyPriority - DEFAULT_PREFS.energyPriority) * blend,
  };

  const measured = simulateFacade(env, state.config);

  let config = state.config;
  let cost = 0;
  let note = "";
  let predicted = measured;
  if (model) {
    const decision = mpcControl(model, env, state.config, prefs, measured);
    config = decision.config;
    cost = decision.cost;
    note = decision.note;
    predicted = decision.predicted;
  }

  const nextPerf = simulateFacade(env, config);
  const energyKWh = state.energyKWh + (nextPerf.energyW / 1000) * dtHours;

  const step: ControlStep = {
    hour,
    env,
    config,
    perf: nextPerf,
    predicted,
    cost,
    override: blend,
    note: note || state.lastNote,
  };

  return {
    state: {
      ...state,
      hour,
      cloud,
      config,
      prefs,
      overrideTimer: override,
      energyKWh,
      lastNote: note || state.lastNote,
      lastCost: cost,
    },
    step,
  };
}