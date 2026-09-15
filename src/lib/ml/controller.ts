import { predictDeployed } from "./surrogate";
import type { EnvState, FacadeConfig, Preferences, Performance, SurrogateModel } from "../types";

export interface ControlDecision {
  config: FacadeConfig;
  predicted: Performance;
  measured: Performance;
  cost: number;
  note: string;
}

const DEPLOY_GRID = [0, 0.3, 0.6, 0.85, 1];
const ANGLE_GRID = [0, 25, 50, 75];
const VENT_GRID = [0, 0.5, 1];

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function relu(v: number): number {
  return Math.max(0, v);
}

export function evaluateCandidateCost(
  p: Performance,
  prefs: Preferences,
  env: EnvState,
  weightEnergy: number
): number {
  const eTarget = Math.max(100, prefs.daylightTarget);
  const gMax = prefs.glareMax;
  const comfortCenter = env.setpoint + 1.5 * prefs.tempMove;

  const dayViol = relu(eTarget - p.illuminance) / eTarget;
  const glareViol = relu(p.dgp - gMax) / gMax;
  const thViol = relu(Math.abs(p.pmv + (env.setpoint - comfortCenter) * 0.5) - 0.5) / 0.5;
  const enNorm = clamp(p.energyW / 1600, 0, 3);

  return (
    1.0 * dayViol +
    1.4 * glareViol +
    1.2 * thViol +
    weightEnergy * enNorm
  );
}

export function mpcControl(
  model: SurrogateModel,
  env: EnvState,
  prev: FacadeConfig,
  prefs: Preferences,
  measuredRef: Performance
): ControlDecision {
  const weightEnergy = 0.7 + prefs.energyPriority * 1.6;
  let best: ControlDecision | null = null;

  for (const blindDeploy of DEPLOY_GRID) {
    for (const slatAngle of ANGLE_GRID) {
      for (const ventOpen of VENT_GRID) {
        const config: FacadeConfig = { blindDeploy, slatAngle, ventOpen };
        const out = predictDeployed(model, [
          env.tOut,
          env.ghi,
          env.solarElev,
          env.occupancy,
          env.setpoint,
          blindDeploy,
          slatAngle,
          ventOpen,
        ]);
        const predicted: Performance = {
          illuminance: Math.max(0, out[0]),
          dgp: clamp(out[1], 0.05, 0.95),
          pmv: clamp(out[2], -2, 2),
          indoorTemp: env.setpoint + out[2] / 0.5,
          energyW: Math.max(0, out[3]),
          solarGainW: 0,
          ventFlowW: 0,
          transmittance: (1 - blindDeploy) + blindDeploy * (0.05 + 0.3 * Math.cos((slatAngle * Math.PI) / 180)),
        };
        const baseCost = evaluateCandidateCost(predicted, prefs, env, weightEnergy);
        const switchPenalty =
          0.14 *
          (Math.abs(blindDeploy - prev.blindDeploy) +
            Math.abs(slatAngle - prev.slatAngle) / 90 +
            Math.abs(ventOpen - prev.ventOpen));
        const cost = baseCost + switchPenalty;
        if (!best || cost < best.cost) {
          best = {
            config,
            predicted,
            measured: measuredRef,
            cost,
            note: "",
          };
        }
      }
    }
  }

  if (!best) {
    throw new Error("no config evaluated");
  }

  const { predicted } = best;
  const shortage: string[] = [];
  if (predicted.illuminance < prefs.daylightTarget - 20) shortage.push("daylight");
  if (predicted.dgp > prefs.glareMax + 0.01) shortage.push("glare");
  if (Math.abs(predicted.pmv) > 0.5 + 0.01) shortage.push("thermal");
  if (predicted.energyW > 900) shortage.push("energy");

  return {
    ...best,
    config: best.config,
    note: shortage.length ? `Mitigating: ${shortage.join(", ")}` : "Balancing all objectives",
  };
}