'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NUTRIENTS, fmt, pctOfDV, type NutrientMeta } from '@/lib/nutrition';
import type { Nutrition } from '@/lib/plan';

type Props = {
  nutrition: Nutrition;
  defaultOpen?: boolean;
  className?: string;
};

const MACROS: NutrientMeta[] = NUTRIENTS.filter((n) => n.group === 'macro');
const MINERALS: NutrientMeta[] = NUTRIENTS.filter((n) => n.group === 'mineral');
const VITAMINS: NutrientMeta[] = NUTRIENTS.filter((n) => n.group === 'vitamin');

export function NutritionPanel({ nutrition, defaultOpen = false, className }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn('rounded-2xl bg-muted/30 border overflow-hidden', className)}>
      {/* Macros are always visible */}
      <div className="p-3 grid grid-cols-4 gap-2">
        {MACROS.slice(0, 4).map((m) => (
          <MacroTile key={m.key} meta={m} value={nutrition[m.key]} />
        ))}
      </div>

      {/* Fiber gets its own bar since it has a DV */}
      <div className="px-3 pb-3">
        <BarRow meta={MACROS.find((m) => m.key === 'fiber_g')!} value={nutrition.fiber_g} />
      </div>

      {/* Toggle for micronutrients */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground border-t transition-colors"
      >
        <ChevronDown
          className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
          strokeWidth={2}
        />
        {open ? 'Hide' : 'See full nutrition'}
      </button>

      {open && (
        <div className="border-t bg-background/50 p-3 space-y-4">
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Minerals
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {MINERALS.map((m) => (
                <BarRow key={m.key} meta={m} value={nutrition[m.key]} compact />
              ))}
            </div>
          </section>
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Vitamins
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {VITAMINS.map((m) => (
                <BarRow key={m.key} meta={m} value={nutrition[m.key]} compact />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function MacroTile({ meta, value }: { meta: NutrientMeta; value: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-1">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
        {meta.labelEn}
      </span>
      <span className="text-lg font-semibold tabular-nums">
        {fmt(value, meta.key === 'cal' ? 0 : 1)}
      </span>
      <span className="text-[10px] text-muted-foreground">{meta.unit}</span>
    </div>
  );
}

function BarRow({
  meta,
  value,
  compact = false,
}: {
  meta: NutrientMeta;
  value: number;
  compact?: boolean;
}) {
  const pct = pctOfDV(value, meta.dailyValue);
  return (
    <div className={cn('space-y-1', compact ? 'text-xs' : 'text-sm')}>
      <div className="flex items-baseline justify-between gap-2">
        <span className={cn('truncate', compact && 'text-[11px]')}>{meta.labelEn}</span>
        <span className="tabular-nums text-muted-foreground shrink-0">
          {fmt(value, 1)} {meta.unit}
          {pct != null && (
            <span className="ml-1 text-muted-foreground/60">· {pct}%</span>
          )}
        </span>
      </div>
      {pct != null && (
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              'h-full transition-all',
              pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-emerald-400' : 'bg-emerald-300'
            )}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
