import { cn } from '@/lib/utils';

// Simple SVG-free bar chart used across the progress dashboard.
// Bars use flex-1 within a fixed-height container. All flex children set
// min-w-0 + overflow-hidden so long labels/hints can't push the row wider
// than the container (which caused the 30-day overflow bug).

export type BarPoint = {
  label: string;       // short label under each bar (weekday, day-of-month)
  value: number;       // primary value (kcal, %, etc.)
  target?: number;     // optional target that renders a small tick / line
  hint?: string;       // small text under the value
};

type Props = {
  points: BarPoint[];
  formatValue?: (v: number) => string;
  height?: number;
  maxOverride?: number;
  colorClass?: string;
  emphasisIndex?: number;
  showTargetLine?: boolean;
  hideNoData?: boolean;
};

export function BarChart({
  points,
  formatValue = (v) => Math.round(v).toLocaleString(),
  height = 140,
  maxOverride,
  colorClass = 'text-emerald-500',
  emphasisIndex,
  showTargetLine = true,
  hideNoData = false,
}: Props) {
  const values = points.map((p) => Math.max(0, p.value));
  const targets = points.map((p) => p.target ?? 0);
  const rawMax = Math.max(maxOverride ?? 0, ...values, ...targets);
  const max = rawMax > 0 ? rawMax * 1.1 : 1;

  // For dense views (>= ~14 points) hide most labels and all hints — otherwise
  // they overlap. Show every Nth label so the axis still reads as a time range.
  const dense = points.length > 14;
  const labelStride = dense ? Math.ceil(points.length / 6) : 1;

  return (
    <div className="w-full">
      <div className="flex items-end gap-[3px] sm:gap-1" style={{ height }}>
        {points.map((p, i) => {
          const barPct = (Math.max(0, p.value) / max) * 100;
          const targetPct = p.target ? (p.target / max) * 100 : null;
          const emphasised = emphasisIndex != null && i === emphasisIndex;
          const empty = hideNoData && p.value === 0 && (p.hint === 'no data' || !p.value);
          return (
            <div
              key={i}
              className="flex-1 min-w-0 flex flex-col items-center justify-end h-full"
            >
              <div className="w-full flex-1 flex flex-col justify-end relative">
                {showTargetLine && targetPct != null && (
                  <div
                    className="absolute inset-x-0 border-t border-dashed border-foreground/30"
                    style={{ bottom: `${targetPct}%` }}
                    aria-hidden
                  />
                )}
                <div
                  className={cn(
                    'w-full rounded-t-md transition-all',
                    empty ? 'bg-muted/40' : 'bg-current',
                    emphasised && !empty && 'ring-2 ring-offset-1 ring-emerald-300',
                    colorClass
                  )}
                  style={{ height: `${empty ? 6 : Math.max(barPct, 2)}%` }}
                  title={`${p.label}: ${formatValue(p.value)}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Labels row */}
      <div className="flex items-start gap-[3px] sm:gap-1 mt-1.5">
        {points.map((p, i) => {
          const showLabel = i % labelStride === 0 || i === points.length - 1;
          const showHint = !dense && !!p.hint;
          const emphasised = emphasisIndex != null && i === emphasisIndex;
          return (
            <div key={i} className="flex-1 min-w-0 text-center overflow-hidden">
              {showLabel && (
                <p
                  className={cn(
                    'text-[10px] font-medium tabular-nums leading-none truncate',
                    emphasised ? 'text-emerald-700' : 'text-muted-foreground'
                  )}
                >
                  {p.label}
                </p>
              )}
              {showHint && (
                <p className="text-[9px] text-muted-foreground/70 mt-0.5 tabular-nums leading-none truncate">
                  {p.hint}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
