"use client";

import { Card } from "./ui/Card";
import { Slider, Toggle } from "./ui/controls";
import type { EnvState, Season } from "@/lib/types";
import { localClock } from "@/lib/simulation";

export function EnvironmentPanel({
  env,
  running,
  speed,
  season,
  cloud,
  freeConditions,
  onPlayPause,
  onSpeed,
  onSeason,
  onCloud,
  onFree,
  onHour,
  onTemp,
  onGhi,
  occupancy,
  onOccupancy,
}: {
  env: EnvState;
  running: boolean;
  speed: number;
  season: Season;
  cloud: number;
  freeConditions: boolean;
  onPlayPause: () => void;
  onSpeed: (s: number) => void;
  onSeason: (s: Season) => void;
  onCloud: (c: number) => void;
  onFree: (f: boolean) => void;
  onHour: (h: number) => void;
  onTemp: (t: number) => void;
  onGhi: (g: number) => void;
  occupancy: number;
  onOccupancy: (o: number) => void;
}) {
  return (
    <Card
      title="Environment"
      subtitle="Simulated sensor readings for the operating location"
      badge={
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
            running
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300"
              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
          }`}
        >
          {running ? "live" : "paused"}
        </span>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onPlayPause}
            className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {running ? "⏸ Pause" : "▶ Run"}
          </button>
          <div className="flex items-center gap-1 rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-700">
            {[0.5, 1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => onSpeed(s)}
                className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                  speed === s
                    ? "bg-sky-600 text-white"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Toggle label="Auto day cycle" checked={!freeConditions} onChange={(v) => onFree(!v)} />
          <Toggle
            label={season === "summer" ? "Summer" : "Winter"}
            checked={season === "summer"}
            onChange={(v) => onSeason(v ? "summer" : "winter")}
          />
        </div>

        <Slider
          label="Time of day"
          value={env.hour}
          min={6}
          max={19}
          step={0.1}
          onChange={onHour}
          format={(h) => localClock(h)}
          accent="#f59e0b"
        />

        <Slider
          label="Cloud cover"
          value={cloud}
          min={0}
          max={1}
          onChange={onCloud}
          format={(c) => `${Math.round(c * 100)}%`}
          accent="#94a3b8"
        />

        <Slider
          label="Occupancy"
          value={occupancy}
          min={0}
          max={1}
          onChange={onOccupancy}
          format={(o) => `${Math.round(o * 100)}%`}
          accent="#8b5cf6"
        />

        {freeConditions && (
          <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              Manual override
            </p>
            <Slider
              label="Outdoor temp"
              value={env.tOut}
              min={-8}
              max={38}
              onChange={onTemp}
              format={(t) => `${t.toFixed(1)} °C`}
              accent="#f43f5e"
            />
            <Slider
              label="Solar irradiance"
              value={env.ghi}
              min={0}
              max={1000}
              step={5}
              onChange={onGhi}
              format={(g) => `${g.toFixed(0)} W/m²`}
              accent="#eab308"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/60">
            <span className="text-zinc-400">Sensor · T_out</span>
            <div className="mt-0.5 font-mono font-semibold text-zinc-900 dark:text-zinc-100">
              {env.tOut.toFixed(1)} °C
            </div>
          </div>
          <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/60">
            <span className="text-zinc-400">Sensor · GHI</span>
            <div className="mt-0.5 font-mono font-semibold text-zinc-900 dark:text-zinc-100">
              {env.ghi.toFixed(0)} W/m²
            </div>
          </div>
          <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/60">
            <span className="text-zinc-400">Solar elevation</span>
            <div className="mt-0.5 font-mono font-semibold text-zinc-900 dark:text-zinc-100">
              {env.solarElev.toFixed(1)}°
            </div>
          </div>
          <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/60">
            <span className="text-zinc-400">Solar azimuth</span>
            <div className="mt-0.5 font-mono font-semibold text-zinc-900 dark:text-zinc-100">
              {env.solarAzimuth.toFixed(0)}°
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}