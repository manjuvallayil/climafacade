"use client";

import Link from "next/link";
import { useSim } from "@/hooks/useSim";
import { EnvironmentPanel } from "@/components/EnvironmentPanel";
import { OccupantPanel } from "@/components/OccupantPanel";
import { FacadeVisualizer } from "@/components/FacadeVisualizer";
import { ModelTrainingPanel } from "@/components/ModelTrainingPanel";
import { PerformanceCharts, ParityPlot, ControlLog } from "@/components/PerformanceCharts";
import { Card } from "@/components/ui/Card";
import { localClock, makeEnv } from "@/lib/simulation";
import { simulateFacade } from "@/lib/physics/facade";
import { predictDeployed } from "@/lib/ml/surrogate";

export default function Home() {
  const {
    sim,
    running,
    speed,
    model,
    training,
    trainProgress,
    trainResult,
    history,
    actions,
  } = useSim();

  const env = makeEnv(sim.hour, sim.cloud, sim.season, sim.occupancy, sim.freeEnv);
  const measured = simulateFacade(env, sim.config);
  const predicted = model
    ? predictDeployed(model, [
        env.tOut,
        env.ghi,
        env.solarElev,
        env.occupancy,
        env.setpoint,
        sim.config.blindDeploy,
        sim.config.slatAngle,
        sim.config.ventOpen,
      ])
    : null;
  const override = Math.max(0, sim.overrideTimer);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-sky-500 to-cyan-400 text-sm text-white">
              ◫
            </span>
            <div>
              <div className="text-sm font-semibold tracking-tight">ClimaFaçade</div>
              <div className="text-[10px] text-zinc-400">
                closed-loop adaptive shading · surrogate + MPC
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`hidden items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium sm:flex ${
                model
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  model ? "bg-emerald-500" : "bg-zinc-400"
                }`}
              />
              {model ? "control model online" : "training surrogate…"}
            </span>
            <Link
              href="/about"
              className="rounded-full border border-zinc-200 px-3 py-1 text-[11px] font-medium text-zinc-600 transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
            >
              How it works
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-5 py-6">
        <section className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              An adaptive façade that balances comfort, daylight, glare and energy
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
              A deep-learning surrogate is trained in your browser on building-performance
              simulation data, then deployed inside a model-predictive controller that re-optimises
              the shading configuration in closed loop — responding in real time to the occupant.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="rounded-lg bg-zinc-100 px-3 py-2 font-mono dark:bg-zinc-900">
              <span className="text-zinc-400">clock </span>
              <span className="font-semibold">{localClock(env.hour)}</span>
            </div>
            <div className="rounded-lg bg-zinc-100 px-3 py-2 font-mono dark:bg-zinc-900">
              <span className="text-zinc-400">energy </span>
              <span className="font-semibold text-sky-600 dark:text-sky-400">
                {sim.energyKWh.toFixed(2)} kWh
              </span>
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-12">
          <div className="space-y-5 xl:col-span-3">
            <EnvironmentPanel
              env={env}
              running={running}
              speed={speed}
              season={sim.season}
              cloud={sim.cloud}
              freeConditions={sim.freeConditions}
              onPlayPause={running ? actions.pause : actions.play}
              onSpeed={actions.setSpeed}
              onSeason={actions.setSeason}
              onCloud={actions.setManualCloud}
              onFree={actions.setFree}
              onHour={actions.setManualHour}
              onTemp={actions.setManualTemp}
              onGhi={actions.setManualGhi}
              occupancy={sim.occupancy}
              onOccupancy={actions.setOccupancy}
            />
            <ModelTrainingPanel
              training={training}
              progress={trainProgress}
              result={trainResult}
              onRetrain={actions.retrain}
            />
          </div>

          <div className="space-y-5 xl:col-span-6">
            <Card
              title="Operating room · east façade · Wellington NZ"
              subtitle="Simulated sensor feedback keeps the loop closed"
              badge={
                override > 0 ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                    occupant override · {Math.ceil(override)}s
                  </span>
                ) : (
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    energy-efficient baseline
                  </span>
                )
              }
            >
              <FacadeVisualizer env={env} config={sim.config} perf={measured} />
            </Card>

            <Card
              title="Current control decision"
              subtitle="Surrogate-predicted vs simulated response"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 text-xs">
                  {[
                    {
                      k: "Shade deployment",
                      v: `${Math.round(sim.config.blindDeploy * 100)}%`,
                    },
                    { k: "Slat angle", v: `${sim.config.slatAngle}°` },
                    { k: "Vent opening", v: `${Math.round(sim.config.ventOpen * 100)}%` },
                    { k: "Objective cost", v: sim.lastCost.toFixed(3) },
                  ].map((r) => (
                    <div
                      key={r.k}
                      className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-1.5 dark:bg-zinc-800/60"
                    >
                      <span className="text-zinc-400">{r.k}</span>
                      <span className="font-mono font-medium">{r.v}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5 text-xs">
                  {[
                    {
                      k: "Surrogate predicts",
                      v: predicted
                        ? `E ${predicted[0].toFixed(0)} · DGP ${predicted[1].toFixed(2)}`
                        : "—",
                    },
                    {
                      k: "Simulation confirms",
                      v: `E ${measured.illuminance.toFixed(0)} · DGP ${measured.dgp.toFixed(2)}`,
                    },
                    { k: "Indoor T", v: `${measured.indoorTemp.toFixed(1)} °C` },
                    { k: "Last action", v: sim.lastNote },
                  ].map((r) => (
                    <div
                      key={r.k}
                      className="flex items-center justify-between gap-2 rounded-lg bg-zinc-50 px-3 py-1.5 dark:bg-zinc-800/60"
                    >
                      <span className="shrink-0 text-zinc-400">{r.k}</span>
                      <span className="truncate font-mono font-medium">{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-5 xl:col-span-3">
            <OccupantPanel
              prefs={{
                daylightTarget: sim.prefs.daylightTarget,
                glareMax: sim.prefs.glareMax,
                tempMove: sim.prefs.tempMove,
                energyPriority: sim.prefs.energyPriority,
              }}
              override={override}
              onPref={actions.setPref}
              onReset={actions.resetPrefs}
            />
          </div>
        </div>

        <PerformanceCharts history={history} />

        <div className="grid gap-5 lg:grid-cols-2">
          {trainResult && <ParityPlot result={trainResult} />}
          <ControlLog history={history} />
        </div>
      </main>

      <footer className="mx-auto max-w-7xl px-5 py-6 text-center text-[11px] text-zinc-400">
        Research demonstrator — surrogate neural network + model predictive control for adaptive
        building façades. All computation runs locally in your browser.
      </footer>
    </div>
  );
}