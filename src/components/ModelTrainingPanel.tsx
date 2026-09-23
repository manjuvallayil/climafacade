"use client";

import { Card } from "./ui/Card";
import type { TrainProgress, TrainResult } from "@/lib/types";
import { serialiseModel } from "@/lib/ml/surrogate";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function LossChart({ result }: { result: TrainResult }) {
  const data = result.history.map((h) => ({
    epoch: h.epoch,
    train: Number(h.trainLoss.toExponential(3)),
    val: Number(h.valLoss.toExponential(3)),
  }));
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
          <XAxis dataKey="epoch" tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <YAxis
            tick={{ fontSize: 11 }}
            stroke="#94a3b8"
            width={72}
            tickFormatter={(v) => v.toExponential(0)}
          />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8 }}
            labelFormatter={(l) => `epoch ${l}`}
          />
          <Line type="monotone" dataKey="train" stroke="#0ea5e9" dot={false} strokeWidth={1.5} />
          <Line type="monotone" dataKey="val" stroke="#22c55e" dot={false} strokeWidth={1.5} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ModelTrainingPanel({
  training,
  progress,
  result,
  onRetrain,
}: {
  training: boolean;
  progress: TrainProgress;
  result: TrainResult | null;
  onRetrain: () => void;
}) {
  const pct = Math.round(progress.fraction * 100);

  const download = () => {
    if (!result) return;
    const blob = new Blob([serialiseModel(result.model)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "facade-surrogate.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card
      title="Surrogate model · the intelligence inside the controller"
      subtitle="Deep-learning proxy for building-performance simulation, trained in your browser and deployed in closed loop"
      badge={
        result ? (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
            deployed · {result.samples.toLocaleString()} sims
          </span>
        ) : (
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700 dark:bg-sky-900/60 dark:text-sky-300">
            {training ? `${pct}%` : "idle"}
          </span>
        )
      }
    >
      {!result ? (
        <div className="space-y-3">
          <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-sky-600 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">{progress.message}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <LossChart result={result} />

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-zinc-50 py-2 dark:bg-zinc-800/60">
              <div className="font-mono text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                {(result.r2 * 100).toFixed(1)}%
              </div>
              <div className="text-[11px] uppercase tracking-wide text-zinc-500">val R²</div>
            </div>
            <div className="rounded-lg bg-zinc-50 py-2 dark:bg-zinc-800/60">
              <div className="font-mono text-lg font-semibold text-sky-600 dark:text-sky-400">
                {result.mae.toFixed(1)}
              </div>
              <div className="text-[11px] uppercase tracking-wide text-zinc-500">mean abs err</div>
            </div>
            <div className="rounded-lg bg-zinc-50 py-2 dark:bg-zinc-800/60">
              <div className="font-mono text-lg font-semibold text-violet-600 dark:text-violet-400">
                {result.evalTimeUs.toFixed(0)}
              </div>
              <div className="text-[11px] uppercase tracking-wide text-zinc-500">µs · eval</div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onRetrain}
              disabled={training}
              className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-[13px] font-medium text-zinc-600 transition-colors hover:border-zinc-400 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500"
            >
              {training ? "Training…" : "Retrain surrogate"}
            </button>
            <button
              onClick={download}
              className="flex-1 rounded-lg border border-sky-600 bg-sky-600 px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-sky-500"
            >
              Export weights (.json)
            </button>
          </div>

          <p className="text-xs leading-relaxed text-zinc-500">
            Trained on {result.samples.toLocaleString()} simulation-generated scenarios (8 operating
            inputs mapping to 4 performance targets), validated on held-out data (val R²{" "}
            <b>{(result.r2 * 100).toFixed(1)}%</b>, MAE <b>{result.mae.toFixed(1)}</b>). Each façade
            configuration is evaluated in <b>{result.evalTimeUs.toFixed(0)} µs</b>, compatible with
            sub-second closed-loop re-optimisation in real time.
          </p>
        </div>
      )}
    </Card>
  );
}