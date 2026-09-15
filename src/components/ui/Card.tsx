import type { ReactNode } from "react";

export function Card({
  title,
  subtitle,
  children,
  className = "",
  badge,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  badge?: ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${className}`}
    >
      {(title || badge) && (
        <header className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-3.5 dark:border-zinc-800">
          <div>
            {title && (
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {subtitle}
              </p>
            )}
          </div>
          {badge}
        </header>
      )}
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}