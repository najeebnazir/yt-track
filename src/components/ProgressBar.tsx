export function ProgressBar({ ratio, className = "" }: { ratio: number; className?: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, ratio)) * 100);
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`h-1 w-full overflow-hidden rounded-full bg-surface-2 ${className}`}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ease-out ${pct === 100 ? "bg-success" : "bg-foreground"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
