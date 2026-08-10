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
};

export function ForecastCard({ consumedKcal, bmrKcal, weightKg, stepsToday }: Props) {
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

  const sedentaryBurn = Math.round(bmrKcal * SEDENTARY_ACTIVITY_FACTOR);
  const walkingBurn =
    stepsToday != null && stepsToday > 0
      ? Math.round(stepsToday * KCAL_PER_STEP_PER_KG * weightKg)
      : 0;
  const totalBurn = sedentaryBurn + walkingBurn;
  const net = totalBurn - consumedKcal;
  const weeklyDeltaGrams = Math.round((net * 7 * 1000) / KCAL_PER_KG_BODY_FAT);
  const isDeficit = net > 0;

  return (
    <section className="rounded-3xl border bg-card overflow-hidden">
      {/* Colored top strip — colour matches deficit/surplus state */}
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
              <p className="text-sm font-medium leading-tight">Progress forecast</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Today's pattern
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
            {Math.abs(net)}
          </span>
          <span className="text-sm text-muted-foreground">
            kcal {isDeficit ? 'deficit' : 'surplus'} today
          </span>
        </div>
      </div>

      {/* Flow breakdown */}
      <div className="px-5 py-3 space-y-2 text-sm border-t">
        <FlowRow label="Eaten today" value={consumedKcal} direction="in" />
        <FlowRow
          label="Burnt · basal"
          sub={`BMR ${Math.round(bmrKcal)} kcal × 1.2`}
          value={sedentaryBurn}
          direction="out"
        />
        <FlowRow
          label="Burnt · walking"
          sub={
            stepsToday && stepsToday > 0
              ? `${Math.round(stepsToday).toLocaleString()} steps`
              : 'log steps to include'
          }
          value={walkingBurn}
          direction="out"
        />
      </div>

      <p className="px-5 pb-4 flex items-start gap-1.5 text-[10px] text-muted-foreground">
        <Info className="h-3 w-3 mt-0.5 shrink-0" />
        <span>
          Rough estimate. Assumes ~7,700 kcal per kg body fat. Accuracy improves once we have a
          full week of logs.
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
          {sub && <p className="text-[10px] text-muted-foreground truncate">{sub}</p>}
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
