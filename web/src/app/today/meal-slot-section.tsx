'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  name: string;
  eatenCount: number;
  totalCount: number;
  approxKcal: number;
  actionSlot?: ReactNode; // e.g. SlotMarkAll button
  children: ReactNode;    // pre-rendered ItemCards from the server component
  initialCollapsed?: boolean;
};

export function MealSlotSection({
  name,
  eatenCount,
  totalCount,
  approxKcal,
  actionSlot,
  children,
  initialCollapsed = false,
}: Props) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const allDone = totalCount > 0 && eatenCount === totalCount;

  return (
    <section className="space-y-2">
      <div
        className={cn(
          'rounded-2xl transition-colors',
          collapsed && 'border bg-card'
        )}
      >
        <div className="flex items-stretch">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            aria-expanded={!collapsed}
            className={cn(
              'flex-1 flex items-center gap-3 text-left transition-colors',
              collapsed ? 'px-3 py-3' : 'px-1 py-1'
            )}
          >
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                collapsed && '-rotate-90'
              )}
            />
            <div className="flex-1 min-w-0">
              <h2
                className={cn(
                  'font-semibold uppercase tracking-wider',
                  collapsed
                    ? 'text-sm text-foreground'
                    : 'text-sm text-muted-foreground'
                )}
              >
                {name}
              </h2>
              {collapsed && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  <span className={cn('tabular-nums', allDone && 'text-emerald-700 font-medium')}>
                    {eatenCount}/{totalCount} done
                  </span>
                  <span className="mx-1.5">·</span>
                  <span className="tabular-nums">~{Math.round(approxKcal)} kcal</span>
                </p>
              )}
            </div>
          </button>

          {!collapsed && (
            <div className="flex items-center gap-2 pr-1 shrink-0">
              <span className="text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">
                ~{Math.round(approxKcal)} kcal
              </span>
              {actionSlot}
            </div>
          )}
        </div>
      </div>

      {!collapsed && <div className="space-y-2">{children}</div>}
    </section>
  );
}
