'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  name: string;
  eatenCount: number;
  totalCount: number;
  approxKcal: number;    // plan target kcal for this slot
  eatenKcal?: number;    // kcal already logged from ticked items
  actionSlot?: ReactNode;
  children: ReactNode;
  initialCollapsed?: boolean;
};

export function MealSlotSection({
  name,
  eatenCount,
  totalCount,
  approxKcal,
  eatenKcal = 0,
  actionSlot,
  children,
  initialCollapsed = false,
}: Props) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const allDone = totalCount > 0 && eatenCount === totalCount;
  const pct = totalCount > 0 ? eatenCount / totalCount : 0;

  return (
    <section>
      <div
        className={cn(
          'rounded-3xl border bg-card transition-shadow',
          collapsed
            ? 'shadow-[0_1px_0_rgba(0,0,0,0.02)]'
            : 'shadow-[0_1px_0_rgba(0,0,0,0.02)]'
        )}
      >
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          aria-expanded={!collapsed}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
        >
          {/* Progress dot */}
          <div
            className={cn(
              'shrink-0 h-9 w-9 rounded-full flex items-center justify-center transition-colors',
              allDone
                ? 'bg-emerald-500 text-white'
                : eatenCount > 0
                ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-200'
                : 'bg-muted text-muted-foreground border border-border'
            )}
            aria-hidden
          >
            {allDone ? (
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z" />
              </svg>
            ) : (
              <span className="text-[11px] font-medium tabular-nums">
                {eatenCount}/{totalCount}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold tracking-tight leading-tight">{name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
              {eatenKcal > 0 ? (
                <>
                  <span className={cn(allDone ? 'text-emerald-700 font-medium' : 'text-foreground/70')}>
                    {Math.round(eatenKcal)}
                  </span>{' '}
                  / {Math.round(approxKcal)} kcal
                </>
              ) : (
                <>{Math.round(approxKcal)} kcal planned</>
              )}
            </p>
            {/* Slim progress bar under the meta line */}
            <div className="mt-1.5 h-0.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-500',
                  allDone ? 'bg-emerald-500' : 'bg-emerald-400/70'
                )}
                style={{ width: `${pct * 100}%` }}
              />
            </div>
          </div>

          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
              collapsed && '-rotate-90'
            )}
          />
        </button>

        {!collapsed && actionSlot && (
          <div className="px-4 pb-3 -mt-1 flex justify-end">{actionSlot}</div>
        )}
      </div>

      {!collapsed && <div className="mt-2 space-y-2">{children}</div>}
    </section>
  );
}
