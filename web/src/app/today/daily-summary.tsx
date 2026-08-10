import { cn } from '@/lib/utils';
import { fmt } from '@/lib/nutrition';
import type { Nutrition } from '@/lib/plan';
import { ProgressRing } from './progress-ring';
import { NutritionPanel } from './nutrition-panel';

type Props = {
  eatenItems: number;
  totalItems: number;
  doneHabits: number;
  totalHabits: number;
  dayTotals: Nutrition;
  dayDefaultTotals: Nutrition;
};

export function DailySummary({
  eatenItems,
  totalItems,
  doneHabits,
  totalHabits,
  dayTotals,
  dayDefaultTotals,
}: Props) {
  return (
    <section className="rounded-3xl border bg-card p-4 space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest">Today</p>
          <p className="text-sm font-medium">आज का दिन</p>
        </div>
        <div className="flex gap-1.5">
          <ProgressPill done={eatenItems} total={totalItems} label="items" />
          <ProgressPill done={doneHabits} total={totalHabits} label="habits" />
        </div>
      </div>

      {/* Bento grid: ring | macro tiles */}
      <div className="grid grid-cols-5 gap-3">
        <div className="col-span-2 flex items-center justify-center">
          <ProgressRing
            value={dayTotals.cal}
            target={dayDefaultTotals.cal}
            label="kcal"
            size={148}
            strokeWidth={12}
            colorClass="text-emerald-500"
            trackClass="text-muted"
          />
        </div>
        <div className="col-span-3 grid grid-cols-3 gap-2">
          <MacroTile
            label="Protein"
            now={dayTotals.protein_g}
            target={dayDefaultTotals.protein_g}
            unit="g"
            accent="from-emerald-50 to-emerald-100/40 text-emerald-700"
          />
          <MacroTile
            label="Carbs"
            now={dayTotals.carbs_g}
            target={dayDefaultTotals.carbs_g}
            unit="g"
            accent="from-amber-50 to-amber-100/40 text-amber-700"
          />
          <MacroTile
            label="Fat"
            now={dayTotals.fat_g}
            target={dayDefaultTotals.fat_g}
            unit="g"
            accent="from-sky-50 to-sky-100/40 text-sky-700"
          />
          <MacroTile
            label="Fiber"
            now={dayTotals.fiber_g}
            target={dayDefaultTotals.fiber_g}
            unit="g"
            accent="from-lime-50 to-lime-100/40 text-lime-700"
          />
          <MacroTile
            label="Iron"
            now={dayTotals.iron_mg}
            target={dayDefaultTotals.iron_mg}
            unit="mg"
            accent="from-rose-50 to-rose-100/40 text-rose-700"
          />
          <MacroTile
            label="Calcium"
            now={dayTotals.calcium_mg}
            target={dayDefaultTotals.calcium_mg}
            unit="mg"
            accent="from-indigo-50 to-indigo-100/40 text-indigo-700"
            decimals={0}
          />
        </div>
      </div>

      <NutritionPanel
        nutrition={dayTotals}
        hideMacros
        toggleLabel="See day's full nutrition"
      />
    </section>
  );
}

function ProgressPill({ done, total, label }: { done: number; total: number; label: string }) {
  const complete = total > 0 && done === total;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full text-[11px] font-medium px-2 py-0.5 border tabular-nums',
        complete
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
          : 'bg-muted/60 border-transparent text-muted-foreground'
      )}
    >
      {done}/{total} {label}
    </span>
  );
}

function MacroTile({
  label,
  now,
  target,
  unit,
  accent,
  decimals = 1,
}: {
  label: string;
  now: number;
  target: number;
  unit: string;
  accent: string;
  decimals?: number;
}) {
  const pct = target > 0 ? Math.min(1, now / target) : 0;
  return (
    <div
      className={cn(
        'relative rounded-2xl border border-white/60 bg-gradient-to-br p-2.5 flex flex-col overflow-hidden',
        accent
      )}
    >
      <p className="text-[10px] uppercase tracking-wider opacity-80">{label}</p>
      <p className="text-base font-semibold tabular-nums leading-tight mt-0.5">
        {fmt(now, decimals)}
        <span className="text-[10px] opacity-70 font-normal ml-0.5">{unit}</span>
      </p>
      <p className="text-[10px] opacity-70 tabular-nums leading-tight">
        / {fmt(target, decimals)}
      </p>
      {/* Subtle progress bar at the bottom of the tile */}
      <div className="absolute inset-x-2.5 bottom-1.5 h-0.5 rounded-full bg-white/40 overflow-hidden">
        <div
          className="h-full rounded-full bg-current transition-all duration-500"
          style={{ width: `${pct * 100}%`, opacity: 0.6 }}
        />
      </div>
    </div>
  );
}
