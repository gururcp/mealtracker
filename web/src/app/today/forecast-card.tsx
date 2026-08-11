import { ArrowDown, ArrowUp, Flame, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const SEDENTARY_ACTIVITY_FACTOR = 1.2;
const KCAL_PER_STEP_PER_KG = 0.0005;
const KCAL_PER_KG_BODY_FAT = 7700;

type Props = {
  consumedKcal: number;
  bmrKcal: number | null;
  weightKg: number | null;
  stepsToday: number | null;

  // Rolling averages (last N days where the member logged at least one item).
  // When daysWithData >= 2 we use these for the weekly projection; today's
  // numbers become the secondary line. When < 2 we fall back to today only.
  avgDeficitKcal?: number | null;
  daysWithData?: number;
};

export function ForecastCard({
  consumedKcal,
  bmrKcal,
  weightKg,
  stepsToday,
  avgDeficitKcal,
  daysWithData,
}: Props) {
  if (bmrKcal == null || weightKg == null) {
    return (
      <section className="rounded-3xl border bg-card p-5">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
            <Flame className="h-4 w-4 text-emerald-600" />
          </span>
          Progress forecast
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Log a weight reading with BMR to see your daily deficit and weekly weight-change forecast.
        </p>
      </section>
    );
  }

  // Today's snapshot ------------------------------------------------------
  const todaySedentaryBurn = Math.round(bmrKcal * SEDENTARY_ACTIVITY_FACTOR);
  const todayWalkingBurn =
    stepsToday != null && stepsToday > 0
      ? Math.round(stepsToday * KCAL_PER_STEP_PER_KG * weightKg)
      : 0;
  const todayTotalBurn = todaySedentaryBurn + todayWalkingBurn;
  const todayNet = todayTotalBurn - consumedKcal;

  // Rolling window (preferred for the weekly projection) ------------------
  const useAvg = avgDeficitKcal != null && (daysWithData ?? 0) >= 2;
  const hero = useAvg
    ? { deficit: avgDeficitKcal!, label: `${daysWithData}-day average` }
    : { deficit: todayNet, label: "Today's pattern" };

  const weeklyDeltaGrams = Math.round((hero.deficit * 7 * 1000) / KCAL_PER_KG_BODY_FAT);
  const isDeficit = hero.deficit > 0;

  return (
    <section className="rounded-3xl border bg-card overflow-hidden">
      {/* Colored top strip */}
      <div
        className={cn(
          'px-5 pt-5 pb-4',
          isDeficit
            ? 'bg-gradient-to-b from-emerald-50/70 to-transparent'
            : 'bg-gradient-to-b from-red-50/70 to-transparent'
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center',
                isDeficit ? 'bg-emerald-100/80' : 'bg-red-100/80'
              )}
            >
              <Flame
                className={cn('h-4 w-4', isDeficit ? 'text-emerald-600' : 'text-red-600')}
              />
            </span>
            <div>
              <p className="text-base font-medium leading-tight">Progress forecast</p>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mt-0.5">
                {hero.label}
              </p>
            </div>
          </div>
          <div
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums',
              isDeficit ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
            )}
          >
            {isDeficit ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
            {formatWeightDelta(Math.abs(weeklyDeltaGrams))} / week
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              'font-display text-5xl leading-none tabular-nums',
              isDeficit ? 'text-emerald-700' : 'text-red-700'
            )}
          >
            {isDeficit ? '−' : '+'}
            {Math.abs(Math.round(hero.deficit))}
          </span>
          <span className="text-sm text-muted-foreground">
            kcal {isDeficit ? 'deficit' : 'surplus'} / day
          </span>
        </div>
      </div>

      {/* Today's snapshot — always shown for immediate feedback */}
      <div className="px-5 py-3 space-y-2 text-sm border-t">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Today so far
          </p>
          <p className="text-[11px] font-medium tabular-nums">
            <span className={cn(todayNet >= 0 ? 'text-emerald-700' : 'text-red-700')}>
              {todayNet >= 0 ? '−' : '+'}
              {Math.abs(todayNet)}
            </span>
            <span className="text-muted-foreground ml-1">kcal</span>
          </p>
        </div>
        <FlowRow label="Eaten" value={consumedKcal} direction="in" />
        <FlowRow
          label="Burnt · basal"
          sub={`BMR ${Math.round(bmrKcal)} × 1.2`}
          value={todaySedentaryBurn}
          direction="out"
        />
        <FlowRow
          label="Burnt · walking"
          sub={
            stepsToday && stepsToday > 0
              ? `${Math.round(stepsToday).toLocaleString()} steps`
              : 'no steps logged yet'
          }
          value={todayWalkingBurn}
          direction="out"
        />
      </div>

      <p className="px-5 pb-4 flex items-start gap-1.5 text-[12px] text-muted-foreground border-t pt-3">
        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>
          {useAvg
            ? `Weekly projection uses the average of the last ${daysWithData} logged days — improves as more days are logged.`
            : 'Weekly projection uses today only for now. Log meals + steps for a few days and it will average over that window automatically.'}{' '}
          Assumes ~7,700 kcal per kg body fat.
        </span>
      </p>
    </section>
  );
}

function FlowRow({
  label,
  sub,
  value,
  direction,
}: {
  label: string;
  sub?: string;
  value: number;
  direction: 'in' | 'out';
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 flex items-center gap-2">
        <span
          className={cn(
            'h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold',
            direction === 'in'
              ? 'bg-muted text-muted-foreground'
              : 'bg-emerald-50 text-emerald-700'
          )}
        >
          {direction === 'in' ? '+' : '−'}
        </span>
        <div className="min-w-0">
          <p className="text-sm truncate">{label}</p>
          {sub && <p className="text-[12px] text-muted-foreground truncate">{sub}</p>}
        </div>
      </div>
      <span className="tabular-nums shrink-0 text-sm">
        {Math.round(value)} kcal
      </span>
    </div>
  );
}

function formatWeightDelta(grams: number): string {
  if (grams < 1000) return `${grams} g`;
  return `${(grams / 1000).toFixed(2).replace(/\.?0+$/, '')} kg`;
}
