import { PHYS } from "../constants";
import type { EnvState, FacadeConfig, Performance } from "../types";

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function blindTransmittance(config: FacadeConfig): number {
  const tauSlats = 0.05 + 0.3 * Math.cos((config.slatAngle * Math.PI) / 180);
  return (1 - config.blindDeploy) + config.blindDeploy * tauSlats;
}

export function simulateFacade(env: EnvState, config: FacadeConfig): Performance {
  const tau = blindTransmittance(config);
  const gEff = PHYS.gGlass * tau;
  const sunFactor = Math.max(0.2, Math.sin((env.solarElev * Math.PI) / 180));

  const illuminance = PHYS.illumK * env.ghi * tau * sunFactor;

  const glareGeom =
    env.solarElev < 15 ? 1 : env.solarElev >= 45 ? 0.25 : lerp(1, 0.25, (env.solarElev - 15) / 30);
  const dgp = clamp(
    0.05 + PHYS.glareCoeff * Math.pow(env.ghi / 1000, 0.6) * tau * glareGeom,
    0.05,
    0.95
  );

  const qSolar = env.ghi * PHYS.windowArea * gEff;
  const qInt = PHYS.internalGainWm2 * PHYS.floorArea * env.occupancy;

  const uWindowEff = PHYS.uWindow * (1 - 0.3 * config.blindDeploy);
  const ua = PHYS.uOpaque * PHYS.opaqueArea + uWindowEff * PHYS.windowArea;

  const deltaT = env.tOut - env.setpoint;
  const flowPotential = Math.sqrt(
    (2 * 9.81 * PHYS.stackH * Math.abs(deltaT)) / (273.15 + Math.max(env.tOut, 1))
  );
  const flow = clamp(config.ventOpen * PHYS.cd * PHYS.ventArea * flowPotential, 0, 0.14);
  const qVent = flow * PHYS.rhoCp * deltaT;

  const demandClean = ua * (env.setpoint - env.tOut) - qSolar - qInt - qVent;

  const loadFrac = demandClean / PHYS.hvacCapacity;
  let indoorTemp: number;
  let energyW: number;
  if (demandClean > PHYS.hvacCapacity) {
    indoorTemp = env.setpoint + 0.5 + (demandClean - PHYS.hvacCapacity) / ua;
    energyW = PHYS.hvacCapacity / PHYS.copHeat;
  } else if (demandClean < -PHYS.hvacCapacity) {
    indoorTemp = env.setpoint - 0.5 + (demandClean + PHYS.hvacCapacity) / ua;
    energyW = PHYS.hvacCapacity / PHYS.copCool;
  } else if (Math.abs(demandClean) < 4) {
    indoorTemp = env.setpoint + 0.5 * Math.tanh(loadFrac * 2.4);
    energyW = 4;
  } else if (demandClean > 0) {
    indoorTemp = env.setpoint + 0.5 * Math.tanh(loadFrac * 2.4);
    energyW = demandClean / PHYS.copHeat;
  } else {
    indoorTemp = env.setpoint + 0.5 * Math.tanh(loadFrac * 2.4);
    energyW = -demandClean / PHYS.copCool;
  }

  const pmv = clamp(0.5 * Math.tanh(indoorTemp - env.setpoint), -2, 2);

  return {
    illuminance,
    dgp,
    pmv,
    indoorTemp,
    energyW,
    solarGainW: qSolar,
    ventFlowW: qVent,
    transmittance: tau,
  };
}