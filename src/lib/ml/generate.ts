import { simulateFacade } from "../physics/facade";
import type { EnvState, FacadeConfig, Performance } from "../types";

export interface Sample {
  x: number[];
  y: number[];
}

export function rand(a: number, b: number): number {
  return a + Math.random() * (b - a);
}

export function generateSamples(count: number): Sample[] {
  const samples: Sample[] = [];
  let guard = 0;
  while (samples.length < count && guard < count * 8) {
    const tOut = rand(-8, 38);
    const solarElev = rand(2, 80);
    const ghi = rand(0, 1000) * Math.max(0.15, solarElev / 80);
    const occupancy = rand(0, 1);
    const setpoint = rand(18, 26);
    const blindDeploy = rand(0, 1);
    const slatAngle = rand(0, 90);
    const ventOpen = rand(0, 1);

    const env: EnvState = {
      tOut,
      ghi,
      solarElev,
      solarAzimuth: 100,
      occupancy,
      setpoint,
      cloud: rand(0, 1),
      hour: rand(6, 19),
    };
    const config: FacadeConfig = { blindDeploy, slatAngle, ventOpen };

    const p: Performance = simulateFacade(env, config);
    if (!Number.isFinite(p.illuminance) || !Number.isFinite(p.energyW)) {
      guard += 1;
      continue;
    }
    samples.push({
      x: [tOut, ghi, solarElev, occupancy, setpoint, blindDeploy, slatAngle, ventOpen],
      y: [p.illuminance, p.dgp, p.pmv, p.energyW],
    });
    guard += 1;
  }
  return samples;
}

export function splitSamples(samples: Sample[], valFraction: number): {
  train: Sample[];
  val: Sample[];
} {
  const shuffled = [...samples].sort(() => Math.random() - 0.5);
  const nVal = Math.floor(shuffled.length * valFraction);
  return {
    train: shuffled.slice(nVal),
    val: shuffled.slice(0, nVal),
  };
}