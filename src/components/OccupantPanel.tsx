"use client";

import { Card } from "./ui/Card";
import { Slider } from "./ui/controls";
import type { Preferences } from "@/lib/types";
import { DEFAULT_PREFS } from "@/lib/constants";

const PRESETS: { label: string; icon: string; prefs: Partial<Preferences> }[] = [
  {
    label: "Focused work",
    icon: "⌨️",
    prefs: { daylightTarget: 500, glareMax: 0.3, tempMove: 0, energyPriority: 0.2 },
  },
  {
    label: "Bright & airy",
    icon: "🌞",
    prefs: { daylightTarget: 650, glareMax: 0.38, tempMove: -0.2, energyPriority: 0.1 },
  },
  {
    label: "Cosy evening",
    icon: "🛋️",
    prefs: { daylightTarget: 250, glareMax: 0.3, tempMove: 0.6, energyPriority: 0.4 },
  },
  {
    label: "Maximum glare shield",
    icon: "🕶️",
    prefs: { daylightTarget: 280, glareMax: 0.24, tempMove: 0, energyPriority: 0.35 },
  },
  {
    label: "Energy miser",
    icon: "⚡",
    prefs: { daylightTarget: 320, glareMax: 0.35, tempMove: 0, energyPriority: 1 },
  },
];

export function OccupantPanel({
  prefs,
  override,
  onPref,
  onReset,
}: {
  prefs: Preferences;
  override: number;
  onPref: (key: keyof Preferences, value: number) => void;
  onReset: () => void;
}) {
  const overrideActive = override > 0;
  const overrideText = Math.ceil(override);

  return (
    <Card
      title="Occupant preferences"
      subtitle="Express a desired indoor state — the controller models the next-best façade action"
      badge={
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
            overrideActive
              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300"
              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
          }`}
        >
          {overrideActive ? `override ${overrideText}s` : "baseline"}
        </span>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                onPref("daylightTarget", p.prefs.daylightTarget ?? DEFAULT_PREFS.daylightTarget);
                onPref("glareMax", p.prefs.glareMax ?? DEFAULT_PREFS.glareMax);
                onPref("tempMove", p.prefs.tempMove ?? DEFAULT_PREFS.tempMove);
                onPref("energyPriority", p.prefs.energyPriority ?? DEFAULT_PREFS.energyPriority);
              }}
              className="rounded-xl border border-zinc-200 px-2 py-2 text-left transition-colors hover:border-sky-400 hover:bg-sky-50 dark:border-zinc-700 dark:hover:border-sky-600 dark:hover:bg-sky-900/20"
            >
              <div className="text-base leading-none">{p.icon}</div>
              <div className="mt-1 text-[11px] font-medium leading-tight text-zinc-700 dark:text-zinc-200">
                {p.label}
              </div>
            </button>
          ))}
        </div>

        <Slider
          label="Desired light level"
          value={prefs.daylightTarget}
          min={150}
          max={800}
          step={10}
          onChange={(v) => onPref("daylightTarget", v)}
          format={(v) => `${v} lux`}
          accent="#f59e0b"
        />
        <Slider
          label="Maximum acceptable glare"
          value={prefs.glareMax}
          min={0.2}
          max={0.45}
          step={0.01}
          onChange={(v) => onPref("glareMax", v)}
          format={(v) => `DGP ${v.toFixed(2)}`}
          accent="#ef4444"
        />
        <Slider
          label="Thermal preference"
          value={prefs.tempMove}
          min={-1}
          max={1}
          step={0.05}
          onChange={(v) => onPref("tempMove", v)}
          format={(v) => (v > 0.05 ? `warmer +${(v * 1.5).toFixed(1)}°C` : v < -0.05 ? `cooler ${(v * 1.5).toFixed(1)}°C` : "neutral")}
          accent="#0ea5e9"
        />
        <Slider
          label="Energy efficiency priority"
          value={prefs.energyPriority}
          min={0}
          max={1}
          onChange={(v) => onPref("energyPriority", v)}
          format={(v) => `${Math.round(v * 100)}%`}
          accent="#22c55e"
        />

        <div className="flex items-center justify-between">
          <p className="text-[11px] leading-relaxed text-zinc-400">
            {overrideActive
              ? "Preference shaping active — guidance returns to the energy-efficient baseline once satisfied."
              : "At the energy-efficient operating baseline."}
          </p>
          <button
            onClick={onReset}
            className="shrink-0 rounded-lg border border-zinc-200 px-3 py-1.5 text-[11px] font-medium text-zinc-600 transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500"
          >
            Reset
          </button>
        </div>
      </div>
    </Card>
  );
}