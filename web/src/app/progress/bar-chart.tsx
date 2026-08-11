import { cn } from '@/lib/utils';

// Simple SVG bar chart used across the progress dashboard.
// Bars are drawn against a fixed pixel canvas; the container CSS scales it
// down responsively. Includes an optional target line + baseline axis.

export type BarPoint = {
  label: string;       // short label under each bar (weekday)
  value: number;       // primary value (kcal, %, etc.)
  target?: number;     // optional target that renders a small tick / line
  hint?: string;       // small text under the value (e.g. exact number, "no data")
};

type Props = {
  points: BarPoint[];
  formatValue?: (v: number) => string;
  height?: number;
  maxOverride?: number;      // clamp Y axis (e.g. force 100 for %)
  colorClass?: string;       // Tailwind text-* controlling bar fill via currentColor
  emphasisIndex?: number;    // which bar to highlight (usually last / today)
  showTargetLine?: boolean;
  hideNoData?: boolean;      // hide bars flagged as "no data" (renders empty slot)
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
  const targets = points.map((p) => (p.target ?? 0));
  const rawMax = Math.max(
    maxOverride ?? 0,
    ...values,
    ...targets
  );
  const max = rawMax > 0 ? rawMax * 1.1 : 1;

  return (
    <div className="w-full">
      <div className="flex items-end gap-1.5" style={{ height }}>
        {points.map((p, i) => {
          const barPct = (Math.max(0, p.value) / max) * 100;
          const targetPct = p.target ? (p.target / max) * 100 : null;
          const emphasised = emphasisIndex != null && i === emphasisIndex;
          const empty = hideNoData && p.value === 0 && (p.hint === 'no data' || !p.value);
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
              <div className="w-full flex-1 flex flex-col justify-end relative">
                {/* Target tick — thin dashed line on the bar column */}
                {showTargetLine && targetPct != null && (
                  <div
                    className="absolute inset-x-0 border-t border-dashed border-foreground/30"
                    style={{ bottom: `${targetPct}%` }}
                    aria-hidden
                  />
                )}
                {/* Bar */}
                <div
                  className={cn(
                    'w-full rounded-t-lg transition-all',
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

      {/* Labels row (weekday) */}
      <div className="flex items-start gap-1.5 mt-1.5">
        {points.map((p, i) => (
          <div key={i} className="flex-1 text-center">
            <p
              className={cn(
                'text-[11px] font-medium tabular-nums leading-none',
                emphasisIndex != null && i === emphasisIndex
                  ? 'text-emerald-700'
                  : 'text-muted-foreground'
              )}
            >
              {p.label}
            </p>
            {p.hint && (
              <p className="text-[10px] text-muted-foreground/70 mt-0.5 tabular-nums leading-none">
                {p.hint}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
