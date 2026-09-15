"use client";

import { Card } from "./ui/Card";
import type { ControlStep, TrainResult } from "@/lib/types";
import { localClock } from "@/lib/simulation";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

function timeKey(step: ControlStep): string {
  return localClock(step.hour);
}

export function PerformanceCharts({ history }: { history: ControlStep[] }) {
  const data = history.map((s) => ({
    t: timeKey(s),
    energy: Number(s.perf.energyW.toFixed(1)),
    illum: Number(s.perf.illuminance.toFixed(1)),
    dgp: Number(s.perf.dgp.toFixed(3)),
    pmv: Number(s.perf.pmv.toFixed(3)),
  }));

  return (
    <Card title="Closed-loop performance" subtitle="Recorded telemetry across control steps">
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wide text-zinc-400">
            <span>HVAC energy — W (cooling / heating)</span>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                <XAxis dataKey="t" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" width={40} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <ReferenceLine y={900} stroke="#f59e0b" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="energy" stroke="#0ea5e9" dot={false} strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wide text-zinc-400">
            <span>Work-plane illuminance — lux</span>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                <XAxis dataKey="t" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" width={36} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <ReferenceLine y={350} stroke="#f59e0b" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="illum" stroke="#f59e0b" dot={false} strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wide text-zinc-400">
            <span>Daylight glare — DGP</span>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                <XAxis dataKey="t" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" domain={[0, 0.6]} width={36} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <ReferenceLine y={0.35} stroke="#ef4444" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="dgp" stroke="#ef4444" dot={false} strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wide text-zinc-400">
            <span>Thermal comfort — PMV</span>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                <XAxis dataKey="t" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" domain={[-1, 1]} width={36} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <ReferenceLine y={0.5} stroke="#22c55e" strokeDasharray="4 4" />
                <ReferenceLine y={-0.5} stroke="#22c55e" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="pmv" stroke="#22c55e" dot={false} strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ParityPlot({ result }: { result: TrainResult }) {
  const points = result.parityTrue.map((y, i) => ({
    x: Number(y.toFixed(1)),
    y: Number(result.parityPred[i].toFixed(1)),
  }));
  const max = Math.max(...result.parityTrue) * 1.05;

  return (
    <Card
      title="Surrogate vs simulation"
      subtitle="Held-out validation — predicted vs simulated illuminance"
    >
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
            <XAxis type="number" dataKey="x" name="simulated lux" tick={{ fontSize: 10 }} stroke="#94a3b8" domain={[0, max]} />
            <YAxis type="number" dataKey="y" name="predicted lux" tick={{ fontSize: 10 }} stroke="#94a3b8" domain={[0, max]} />
            <ZAxis range={[16, 64]} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} cursor={{ strokeDasharray: "3 3" }} />
            <Scatter data={points} fill="#0ea5e9" fillOpacity={0.55} />
            <ReferenceLine
              segment={[{ x: 0, y: 0 }, { x: max, y: max }]}
              stroke="#22c55e"
              strokeDasharray="4 4"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function ControlLog({ history }: { history: ControlStep[] }) {
  const tail = history.slice(-8).reverse();
  return (
    <Card title="Actuation log" subtitle="Recent control steps — observe, predict, optimise, actuate">
      {tail.length === 0 ? (
        <p className="py-6 text-center text-xs text-zinc-400">
          Waiting for the first control step…
        </p>
      ) : (
        <ul className="space-y-1.5">
          {tail.map((s, i) => (
            <li
              key={history.length - i}
              className="flex items-center gap-3 rounded-lg bg-zinc-50 px-3 py-2 text-[11px] dark:bg-zinc-800/60"
            >
              <span className="font-mono text-zinc-400">{localClock(s.hour)}</span>
              <div className="flex-1">
                <span className="font-medium text-zinc-700 dark:text-zinc-200">{s.note}</span>
                <span className="ml-2 text-zinc-400">
                  shade {Math.round(s.config.blindDeploy * 100)}% · slat {s.config.slatAngle}° · vent{" "}
                  {Math.round(s.config.ventOpen * 100)}%
                </span>
              </div>
              <span
                className={`font-mono ${
                  s.perf.dgp > 0.35 ? "text-red-500" : "text-zinc-400"
                }`}
              >
                E {s.perf.illuminance.toFixed(0)} · DGP {s.perf.dgp.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}