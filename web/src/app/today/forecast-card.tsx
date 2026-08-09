import { ArrowDown, ArrowUp, Flame, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// Constants
const SEDENTARY_ACTIVITY_FACTOR = 1.2;        // BMR × factor = baseline daily burn without exercise
const KCAL_PER_STEP_PER_KG = 0.0005;          // walking energy cost (empirical)
const KCAL_PER_KG_BODY_FAT = 7700;            // rule-of-thumb energy content

type Props = {
  consumedKcal: number;
  bmrKcal: number | null;
  weightKg: number | null;
  stepsToday: number | null;
};

export function ForecastCard({ consumedKcal, bmrKcal, weightKg, stepsToday }: Props) {
  if (bmrKcal == null || weightKg == null) {
    return (
      <section className="rounded-2xl border p-4 bg-card">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Flame className="h-4 w-4 text-emerald-600" />
          Progress forecast
        </div>
        <p className="text-xs text-muted-foreground mt-2">
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
  const net = totalBurn - consumedKcal; // positive = deficit, negative = surplus
  const weeklyDeltaGrams = Math.round((net * 7 * 1000) / KCAL_PER_KG_BODY_FAT);
  const weeklyDeltaKg = weeklyDeltaGrams / 1000;

  const isDeficit = net > 0;

  return (
    <section className="rounded-2xl border p-4 bg-card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Flame className="h-4 w-4 text-emerald-600" />
          Progress forecast
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Today's pattern
        </span>
      </div>

      {/* Four flow rows: In, Out(base), Out(walk), Net */}
      <div className="space-y-1.5 text-sm">
        <FlowRow label="Eaten today" value={consumedKcal} direction="in" />
        <FlowRow
          label="Burnt (BMR × 1.2)"
          sub="basal + light activity"
          value={sedentaryBurn}
          direction="out"
        />
        <FlowRow
          label="Burnt (walking)"
          sub={stepsToday ? `${Math.round(stepsToday).toLocaleString()} steps` : 'log steps to include'}
          value={walkingBurn}
          direction="out"
        />
        <div className="border-t pt-2 mt-1">
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {isDeficit ? 'Deficit' : 'Surplus'}
            </span>
            <span
              className={cn(
                'tabular-nums font-semibold',
                isDeficit ? 'text-emerald-700' : 'text-red-600'
              )}
            >
              {isDeficit ? '−' : '+'}
              {Math.abs(net)} kcal
            </span>
          </div>
        </div>
      </div>

      {/* Weekly projection */}
      <div
        className={cn(
          'rounded-xl px-3 py-2.5 flex items-center gap-3',
          isDeficit ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'
        )}
      >
        {isDeficit ? (
          <ArrowDown className="h-5 w-5 text-emerald-700 shrink-0" />
        ) : (
          <ArrowUp className="h-5 w-5 text-red-600 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground leading-tight">
            If this pattern continues 7 days
          </p>
          <p
            className={cn(
              'text-base font-semibold tabular-nums leading-tight',
              isDeficit ? 'text-emerald-700' : 'text-red-600'
            )}
          >
            {isDeficit ? '−' : '+'}
            {formatWeightDelta(Math.abs(weeklyDeltaGrams))} / week
          </p>
        </div>
      </div>

      <p className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
        <Info className="h-3 w-3 mt-0.5 shrink-0" />
        <span>
          Rough estimate. Tick meals + enter steps as you go — accuracy climbs as more days are
          logged. Assumes ~7,700 kcal per kg of body fat.
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
      <div className="min-w-0">
        <p className="text-sm truncate">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground truncate">{sub}</p>}
      </div>
      <span
        className={cn(
          'tabular-nums shrink-0 text-sm',
          direction === 'in' ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {direction === 'in' ? '+' : '−'}
        {Math.round(value)} kcal
      </span>
    </div>
  );
}

function formatWeightDelta(grams: number): string {
  if (grams < 1000) return `${grams} g`;
  return `${(grams / 1000).toFixed(2).replace(/\.?0+$/, '')} kg`;
}
