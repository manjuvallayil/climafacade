"use client";

import type { EnvState, FacadeConfig, Performance } from "@/lib/types";
import { localClock } from "@/lib/simulation";

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

const W0 = 380;
const W1 = 680;
const Y0 = 150;
const Y1 = 440;
const N_SLATS = 10;

export function FacadeVisualizer({
  env,
  config,
  perf,
}: {
  env: EnvState;
  config: FacadeConfig;
  perf: Performance;
}) {
  const sunVisible = clamp(
    Math.cos(((env.solarAzimuth - 90) * Math.PI) / 180),
    0,
    1
  );
  const sunStrength = sunVisible * clamp(env.ghi / 900, 0, 1);
  const beamOpacity = 0.15 + 0.55 * sunStrength;

  const sunX = clamp(30 + (env.solarAzimuth - 70) * 0.9, 20, 310);
  const sunY = 470 - env.solarElev * 4.2;

  const nSlats = Math.ceil(N_SLATS * config.blindDeploy);
  const slatSpacing = (Y1 - Y0 - 20) / (N_SLATS - 1);
  const glareOpacity = clamp((perf.dgp - 0.3) / 0.45, 0, 0.85);
  const daylightGlow = clamp(perf.illuminance / 1400, 0, 0.7);
  const energyFrac = clamp(perf.energyW / 1800, 0, 1);

  const timeOfDay = localClock(env.hour);
  const isLowSun = env.solarElev < 18;

  const rows = Array.from({ length: N_SLATS }, (_, i) => {
    const y = Y0 + 30 + i * slatSpacing;
    const visible = i < nSlats;
    const angle = config.slatAngle;
    return { y, visible, angle };
  });

  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <svg
        viewBox="0 0 920 560"
        className="block w-full"
        role="img"
        aria-label="Façade cross-section visualisation"
      >
        <defs>
          <linearGradient id="sky-day" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="70%" stopColor="#bfdbfe" />
            <stop offset="100%" stopColor="#e0f2fe" />
          </linearGradient>
          <linearGradient id="sky-low" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="60%" stopColor="#fcd34d" />
            <stop offset="100%" stopColor="#fef08a" />
          </linearGradient>
          <linearGradient id="sky-dawn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="55%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#fecdd3" />
          </linearGradient>
          <linearGradient id="wallShade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
          <radialGradient id="sunGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#fef9c3" stopOpacity="1" />
            <stop offset="100%" stopColor="#fef9c3" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="beam" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fde68a" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#fef9c3" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="glareOverlay" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#fca5a5" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="daylightGlow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fde68a" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#fef9c3" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="920" height="560" fill="url(#skyGrad)" />

        <circle cx={sunX} cy={sunY} r="60" fill="url(#sunGlow)" />
        <circle cx={sunX} cy={sunY} r="22" fill="#fde047" stroke="#f59e0b" strokeWidth="2" />

        {sunStrength > 0.05 && (
          <g opacity={beamOpacity}>
            {[0, 1, 2, 3].map((i) => {
              const entryY = Y0 + 26 + i * 62;
              return (
                <line
                  key={i}
                  x1={sunX + 16}
                  y1={sunY + 8}
                  x2={W0 + 4}
                  y2={entryY}
                  stroke="url(#beam)"
                  strokeWidth={10 - i}
                  strokeLinecap="round"
                />
              );
            })}
          </g>
        )}

        <rect x="0" y="500" width="380" height="60" fill="#16a34a" />
        <rect x="0" y="498" width="380" height="4" fill="#15803d" />
        <rect x="0" y="500" width="380" height="4" fill="#4ade80" opacity="0.6" />
        <g fill="#166534" opacity="0.85">
          <rect x="40" y="470" width="8" height="32" />
          <circle cx="44" cy="466" r="7" />
          <rect x="120" y="480" width="8" height="22" />
          <circle cx="124" cy="477" r="6" />
        </g>

        <rect x="370" y="120" width="14" height="360" fill="url(#wallShade)" />
        <rect x="368" y="112" width="18" height="24" fill="#cbd5e1" />

        <rect x={W0} y={Y0} width={W1 - W0} height={Y1 - Y0} fill="#7dd3fc" opacity="0.55" />
        <rect x={W0} y={Y0} width={W1 - W0} height={Y1 - Y0} fill="none" stroke="#334155" strokeWidth="3" />
        <line x1={W0} y1={(Y0 + Y1) / 2} x2={W1} y2={(Y0 + Y1) / 2} stroke="#475569" strokeWidth="1.5" opacity="0.5" />

        {rows.map((row, i) =>
          row.visible ? (
            <g key={i} style={{ transition: "transform 700ms ease" }}>
              <rect
                x={W0 + 2}
                y={row.y - 3}
                width={W1 - W0 - 4}
                height="6"
                rx="3"
                fill="#94a3b8"
                stroke="#64748b"
                strokeWidth="0.75"
                transform={
                  row.angle > 0
                    ? `rotate(${row.angle * 0.6}, ${(W0 + W1) / 2}, ${row.y})`
                    : undefined
                }
              />
            </g>
          ) : null
        )}

        <line
          x1="384"
          y1={Y0 + 30 + nSlats * slatSpacing}
          x2="676"
          y2={Y0 + 30 + nSlats * slatSpacing}
          stroke={config.blindDeploy > 0 ? "#0ea5e9" : "#cbd5e1"}
          strokeWidth="2"
          strokeDasharray="4 4"
        />

        <rect x={W0 + 2} y={Y0 + 4} width="60" height="16" rx="3" fill="#f8fafc" stroke="#334155">
        </rect>
        <text x={W0 + 8} y={Y0 + 16} fontSize="10" fill="#475569" fontFamily="monospace">
          {Math.round(config.slatAngle)}°
        </text>

        <rect x="690" y="120" width="10" height="340" fill="#94a3b8" />
        <rect x="880" y="150" width="14" height="310" fill="#e2e8f0" />
        <rect x="700" y="452" width="220" height="14" fill="#b45309" />
        <rect x="700" y="466" width="220" height="60" fill="#92400e" />
        <rect x="700" y="452" width="220" height="5" fill="#f59e0b" opacity="0.8" />
        <rect x="690" y="440" width="230" height="12" fill="#78716c" />

        <rect x="640" y="356" width="86" height="8" rx="2" fill="#92400e" />
        <rect x="640" y="348" width="20" height="16" rx="2" fill="#78350f" />
        <g transform="translate(652,214)">
          <rect x="-28" y="40" width="56" height="150" rx="6" fill="#fbbf24" />
          <circle cx="0" cy="20" r="22" fill="#fdba74" />
          <rect x="-30" y="190" width="60" height="14" rx="4" fill="#d97706" />
        </g>

        <circle cx="452" cy="196" r="5" fill={perf.dgp > 0.35 ? "#ef4444" : "#22c55e"} />
        <rect x="160" y="150" width="118" height="34" rx="5" fill="rgba(15,23,42,0.22)" />
        <text x="172" y="172" fontSize="11" fill="white" fontFamily="monospace">
          {timeOfDay}
        </text>

        <rect x="0" y="0" width={W0} height="560" fill="#fda4af" opacity={glareOpacity * 0.35} pointerEvents="none" />
        <rect x={W0} y={Y0} width={W1 - W0} height={Y1 - Y0} fill="url(#glareOverlay)" opacity={glareOpacity * 0.55} pointerEvents="none" />
        <rect x={W1} y={Y0} width="220" height={Y1 - Y0} fill="#fda4af" opacity={glareOpacity * 0.3} pointerEvents="none" />

        {isLowSun && sunStrength > 0.2 && (
          <g>
            <rect x={W0} y={Y0} width={W1 - W0} height={Y1 - Y0} fill="none" stroke="#ef4444" strokeWidth="3" strokeDasharray="8 6" opacity="0.9" />
            <text x={(W0 + W1) / 2 - 40} y={Y0 - 12} fontSize="11" fill="#ef4444" fontWeight="600">
              LOW-SUN GLARE RISK
            </text>
          </g>
        )}

        <rect x={W1} y={Y0} width="220" height={Y1 - Y0} fill="url(#daylightGlow)" opacity={daylightGlow} pointerEvents="none" />

        <rect x="0" y="540" width="920" height="20" fill="rgba(2,6,23,0.55)" />
        <rect x="16" y="544" width={340 * energyFrac} height="12" rx="4" fill={energyFrac < 0.25 ? "#22c55e" : energyFrac < 0.6 ? "#f59e0b" : "#ef4444"} />
        <g fill="white" fontFamily="monospace" fontSize="10">
          <text x={372} y={554}>HVAC {perf.energyW.toFixed(0)} W</text>
          <text x={520} y={554}>E {perf.illuminance.toFixed(0)} lux</text>
          <text x={640} y={554}>DGP {perf.dgp.toFixed(2)}</text>
          <text x={750} y={554}>PMV {perf.pmv.toFixed(2)}</text>
        </g>
        <text x="876" y="556" fontSize="9" fill="#94a3b8" textAnchor="end" fontFamily="monospace">
          {env.ghi.toFixed(0)} W/m²
        </text>
      </svg>
      <div className="pointer-events-none absolute bottom-7 left-4 rounded-lg bg-black/35 px-3 py-2 text-[11px] font-medium text-white backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: config.blindDeploy > 0.6 ? "#0ea5e9" : "#94a3b8" }}
          />
          Shade {Math.round(config.blindDeploy * 100)}% · Slat {Math.round(config.slatAngle)}° · Vent {Math.round(config.ventOpen * 100)}%
        </div>
      </div>
    </div>
  );
}