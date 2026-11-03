export function ProgressBar({
  value,
  max,
  label,
  className = '',
}: {
  value: number;
  max: number;
  label: string;
  className?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${value} of ${max}`}
      className={`h-2.5 overflow-hidden rounded-full bg-surface-2 ${className}`}
    >
      <div
        className="relative h-full rounded-full bg-gradient-to-r from-brand to-spark transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%` }}
      >
        {pct > 0 && pct < 100 && (
          <span className="absolute top-1/2 right-0 size-2.5 -translate-y-1/2 animate-pulse rounded-full bg-accent" />
        )}
      </div>
    </div>
  );
}
