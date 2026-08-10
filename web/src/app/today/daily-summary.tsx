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
  dayTotals: Nutrition;         // what she has eaten so far today
  dayPlannedTotals: Nutrition;  // what the nutritionist prescribed for the whole day
};

export function DailySummary({
  eatenItems,
  totalItems,
  doneHabits,
  totalHabits,
  dayTotals,
  dayPlannedTotals,
}: Props) {
  const remainingItems = Math.max(0, totalItems - eatenItems);
  const remainingKcal = Math.max(0, Math.round(dayPlannedTotals.cal - dayTotals.cal));

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
        <div className="col-span-2 flex flex-col items-center justify-center gap-2">
          <ProgressRing
            value={dayTotals.cal}
            target={dayPlannedTotals.cal}
            label="kcal eaten"
            size={148}
            strokeWidth={12}
            colorClass="text-emerald-500"
            trackClass="text-muted"
          />
          <p className="text-[10px] text-muted-foreground text-center leading-tight tabular-nums">
            {Math.round(dayPlannedTotals.cal)} kcal planned today
          </p>
        </div>
        <div className="col-span-3 grid grid-cols-3 gap-2">
          <MacroTile
            label="Protein"
            now={dayTotals.protein_g}
            target={dayPlannedTotals.protein_g}
            unit="g"
            accent="from-emerald-50 to-emerald-100/40 text-emerald-700"
          />
          <MacroTile
            label="Carbs"
            now={dayTotals.carbs_g}
            target={dayPlannedTotals.carbs_g}
            unit="g"
            accent="from-amber-50 to-amber-100/40 text-amber-700"
          />
          <MacroTile
            label="Fat"
            now={dayTotals.fat_g}
            target={dayPlannedTotals.fat_g}
            unit="g"
            accent="from-sky-50 to-sky-100/40 text-sky-700"
          />
          <MacroTile
            label="Fiber"
            now={dayTotals.fiber_g}
            target={dayPlannedTotals.fiber_g}
            unit="g"
            accent="from-lime-50 to-lime-100/40 text-lime-700"
          />
          <MacroTile
            label="Iron"
            now={dayTotals.iron_mg}
            target={dayPlannedTotals.iron_mg}
            unit="mg"
            accent="from-rose-50 to-rose-100/40 text-rose-700"
          />
          <MacroTile
            label="Calcium"
            now={dayTotals.calcium_mg}
            target={dayPlannedTotals.calcium_mg}
            unit="mg"
            accent="from-indigo-50 to-indigo-100/40 text-indigo-700"
            decimals={0}
          />
        </div>
      </div>

      {/* Prominent "still to eat" line so mom never mistakes the ring for a limit */}
      {remainingItems > 0 && (
        <p className="text-xs text-center tabular-nums px-2 py-2 rounded-xl bg-emerald-50/60 text-emerald-800 border border-emerald-100">
          <span className="font-medium">{remainingItems} item{remainingItems === 1 ? '' : 's'} left</span>
          {remainingKcal > 0 && (
            <>
              <span className="mx-1.5 text-emerald-700/60">·</span>
              <span>{remainingKcal} kcal to go for full plan</span>
            </>
          )}
        </p>
      )}

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
        of {fmt(target, decimals)}
      </p>
      <div className="absolute inset-x-2.5 bottom-1.5 h-0.5 rounded-full bg-white/40 overflow-hidden">
        <div
          className="h-full rounded-full bg-current transition-all duration-500"
          style={{ width: `${pct * 100}%`, opacity: 0.6 }}
        />
      </div>
    </div>
  );
}
