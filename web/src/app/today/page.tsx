import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getTodayPlan, type MealSlot, type TodayPlan } from '@/lib/plan';
import {
  addNutrition,
  computeItemBreakdown,
  computeItemNutrition,
  emptyNutrition,
  fmt,
} from '@/lib/nutrition';
import type { FoodLite } from '@/lib/plan';
import { ItemCard } from './item-card';
import { HabitRow } from './habit-row';
import { SlotMarkAll } from './slot-mark-all';
import { NutritionPanel } from './nutrition-panel';
import { ForecastCard } from './forecast-card';
import { logoutAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function TodayPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const plan = await getTodayPlan(session.memberId);

  if (!plan.planVersion) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-10">
        <p className="text-sm text-muted-foreground text-center">
          No active plan yet. Your nutritionist will assign one soon.
        </p>
      </main>
    );
  }

  const totalItems = plan.slots.reduce((sum, s) => sum + s.items.length, 0);
  const eatenItems = plan.slots.reduce(
    (sum, s) => sum + s.items.filter((i) => i.tick?.eaten).length,
    0
  );
  const totalHabits = plan.habits.length;
  const doneHabits = plan.habits.filter((h) => h.tick?.done).length;
  const dayTotals = computeDayTotals(plan.slots, plan.allowedVegs);
  const dayDefaultTotals = computeDayDefaultTotals(plan.slots, plan.allowedVegs);
  const todayLabel = formatDateBilingual(plan.logDate, plan.member.timezone);
  const stepsToday = getStepsTodayFromHabits(plan.habits);

  return (
    <main className="min-h-dvh bg-background pb-16">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground">नमस्ते 🙏</p>
            <h1 className="text-lg font-semibold leading-tight">{plan.member.firstName}</h1>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground">{todayLabel}</p>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 space-y-6">
        {/* Daily summary */}
        <section className="rounded-2xl border p-4 bg-card space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Today · आज</span>
            <span className="text-xs text-muted-foreground">
              {eatenItems}/{totalItems} items · {doneHabits}/{totalHabits} habits
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <Stat label="kcal" now={dayTotals.cal} target={dayDefaultTotals.cal} decimals={0} />
            <Stat label="Protein" now={dayTotals.protein_g} target={dayDefaultTotals.protein_g} unit="g" />
            <Stat label="Carbs" now={dayTotals.carbs_g} target={dayDefaultTotals.carbs_g} unit="g" />
            <Stat label="Fat" now={dayTotals.fat_g} target={dayDefaultTotals.fat_g} unit="g" />
          </div>
          <NutritionPanel
            nutrition={dayTotals}
            hideMacros
            toggleLabel="See day's full nutrition"
          />
        </section>

        {/* Weight-loss forecast */}
        <ForecastCard
          consumedKcal={dayTotals.cal}
          bmrKcal={plan.member.latestBmrKcal}
          weightKg={plan.member.latestWeightKg}
          stepsToday={stepsToday}
        />

        {/* Meal slots */}
        {plan.slots.map((slot) => {
          const slotAllDone =
            slot.items.length > 0 && slot.items.every((i) => i.tick?.eaten);
          return (
            <section key={slot.id} className="space-y-2">
              <div className="flex items-baseline justify-between gap-3 px-1">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
                  {slot.name}
                </h2>
                <div className="flex items-center gap-2">
                  <SlotSummary slot={slot} allowedVegs={plan.allowedVegs} />
                  <SlotMarkAll mealSlotId={slot.id} allDone={slotAllDone} />
                </div>
              </div>
              <div className="space-y-2">
                {slot.items.map((item) => (
                  <ItemCard key={item.id} item={item} allowedVegs={plan.allowedVegs} />
                ))}
              </div>
            </section>
          );
        })}

        {/* Habits */}
        {plan.habits.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground px-1">
              Habits · अभ्यास
            </h2>
            <div className="space-y-2">
              {plan.habits.map((h) => (
                <HabitRow key={h.id} habit={h} weightKg={plan.member.latestWeightKg} />
              ))}
            </div>
          </section>
        )}

        <p className="text-[11px] text-center text-muted-foreground pt-4">
          Plan issued {formatDateBilingual(plan.planVersion.effectiveDate, plan.member.timezone)}
        </p>
      </div>
    </main>
  );
}

function Stat({
  label,
  now,
  target,
  unit,
  decimals = 1,
}: {
  label: string;
  now: number;
  target: number;
  unit?: string;
  decimals?: number;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-lg font-semibold tabular-nums leading-none">{fmt(now, decimals)}</p>
      <p className="text-[10px] text-muted-foreground leading-none">
        / {fmt(target, decimals)}
        {unit ? ` ${unit}` : ''}
      </p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}

function SlotSummary({ slot, allowedVegs }: { slot: MealSlot; allowedVegs: FoodLite[] }) {
  let cal = 0;
  for (const item of slot.items) {
    // Default primary (ignoring tick state) — this is the plan target for the slot.
    const alt = item.alternates.find((a) => a.isDefault) ?? item.alternates[0];
    if (!alt?.food) continue;
    const primary = { food: alt.food, quantity: alt.quantity, unit: alt.unit };
    cal += computeItemBreakdown(primary, item.ingredients).total.cal;
  }
  return (
    <span className="text-[11px] text-muted-foreground tabular-nums">~{Math.round(cal)} kcal</span>
  );
}

// Day totals: eaten items only. Uses computeItemNutrition which handles both
// open_veg items (sum of veg selections) and specific/choice items (primary
// alternate + quantity override + ingredients).
function computeDayTotals(slots: MealSlot[], allowedVegs: FoodLite[]) {
  let total = emptyNutrition();
  for (const slot of slots) {
    for (const item of slot.items) {
      if (!item.tick?.eaten) continue;
      total = addNutrition(total, computeItemNutrition(item, allowedVegs));
    }
  }
  return total;
}

// Plan default totals: full plan as prescribed (every item's default alternate).
function computeDayDefaultTotals(slots: MealSlot[], _allowedVegs: FoodLite[]) {
  let total = emptyNutrition();
  for (const slot of slots) {
    for (const item of slot.items) {
      const alt = item.alternates.find((a) => a.isDefault) ?? item.alternates[0];
      if (!alt?.food) continue;
      const primary = { food: alt.food, quantity: alt.quantity, unit: alt.unit };
      total = addNutrition(total, computeItemBreakdown(primary, item.ingredients).total);
    }
  }
  return total;
}

function getStepsTodayFromHabits(
  habits: TodayPlan['habits']
): number | null {
  const stepsHabit = habits.find((h) => h.targetUnit === 'steps');
  if (!stepsHabit) return null;
  return stepsHabit.tick?.value ?? null;
}

function formatDateBilingual(iso: string, tz: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: tz,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}
