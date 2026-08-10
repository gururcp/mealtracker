import { cn } from '@/lib/utils';

// Circular progress ring used for the primary daily-calorie tile.
// Purely SVG — animates smoothly via CSS transition on stroke-dashoffset.

type Props = {
  value: number;           // e.g. kcal consumed today
  target: number;          // e.g. kcal planned for today
  label: string;           // "kcal", "steps", etc.
  size?: number;           // px, default 160
  strokeWidth?: number;    // px, default 12
  colorClass?: string;     // Tailwind text-* / class controlling stroke via currentColor
  trackClass?: string;
  children?: React.ReactNode; // optional custom center content (overrides default value/target)
};

export function ProgressRing({
  value,
  target,
  label,
  size = 160,
  strokeWidth = 12,
  colorClass = 'text-emerald-500',
  trackClass = 'text-muted',
  children,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = target > 0 ? Math.min(1, Math.max(0, value / target)) : 0;
  const dashOffset = circumference * (1 - pct);
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden
      >
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          className={trackClass}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeOpacity="0.6"
        />
        {/* Progress */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          className={cn(colorClass, 'transition-[stroke-dashoffset] duration-700 ease-out')}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
        {children ?? (
          <>
            <span className="font-display text-5xl leading-none tabular-nums">
              {Math.round(value)}
            </span>
            <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mt-2">
              {label}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
