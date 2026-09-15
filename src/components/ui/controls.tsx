export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
  accent,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  accent?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
          {label}
        </span>
        <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
          {format ? format(value) : value.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step ?? 0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-sky-600 dark:bg-zinc-700"
        style={accent ? { accentColor: accent } : undefined}
      />
    </label>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        checked
          ? "border-sky-600 bg-sky-600 text-white"
          : "border-zinc-300 bg-transparent text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${checked ? "bg-white" : "bg-zinc-400"}`}
      />
      {label}
    </button>
  );
}