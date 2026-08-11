import { cn } from '@/lib/utils';

// Minimal SVG line chart with dots at each data point. Used for the weight
// trend. Fixed viewBox for layout stability; container width scales fluidly.

type Point = { date: string; value: number };

type Props = {
  points: Point[];
  height?: number;
  colorClass?: string;
  formatY?: (v: number) => string;
};

export function LineChart({
  points,
  height = 140,
  colorClass = 'text-emerald-500',
  formatY = (v) => v.toFixed(1),
}: Props) {
  const W = 320;
  const H = 100;
  const padX = 8;
  const padTop = 8;
  const padBottom = 14;

  if (points.length === 0) {
    return (
      <div
        className="rounded-2xl bg-muted/30 border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground"
        style={{ height }}
      >
        No weight readings yet.
      </div>
    );
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(0.5, max - min); // avoid divide-by-zero with a single reading

  const plotW = W - padX * 2;
  const plotH = H - padTop - padBottom;

  const xFor = (i: number) => {
    if (points.length === 1) return W / 2;
    return padX + (i / (points.length - 1)) * plotW;
  };
  const yFor = (v: number) => padTop + (1 - (v - min) / span) * plotH;

  const pathD = points
    .map((p, i) => {
      const x = xFor(i).toFixed(1);
      const y = yFor(p.value).toFixed(1);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ height, width: '100%' }}
        preserveAspectRatio="none"
        aria-hidden
      >
        {/* Baseline */}
        <line
          x1={padX}
          x2={W - padX}
          y1={H - padBottom}
          y2={H - padBottom}
          className="text-border"
          stroke="currentColor"
          strokeWidth={1}
        />
        {/* Line */}
        <path
          d={pathD}
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          stroke="currentColor"
          className={colorClass}
        />
        {/* Dots */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={xFor(i)}
            cy={yFor(p.value)}
            r={2.5}
            fill="currentColor"
            className={colorClass}
          />
        ))}
      </svg>

      {/* Min / max labels */}
      <div className="flex justify-between text-[11px] text-muted-foreground mt-1 tabular-nums">
        <span>{formatY(min)}</span>
        <span
          className={cn(
            'font-medium',
            points[points.length - 1].value <= points[0].value
              ? 'text-emerald-700'
              : 'text-red-700'
          )}
        >
          Latest {formatY(points[points.length - 1].value)}
        </span>
        <span>{formatY(max)}</span>
      </div>
    </div>
  );
}
