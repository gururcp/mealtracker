import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getTodayPlan, type MealSlot, type TodayPlan } from '@/lib/plan';
import {
  addNutrition,
  computeItemNutrition,
  emptyNutrition,
  plannedItemNutrition,
} from '@/lib/nutrition';
import type { FoodLite } from '@/lib/plan';
import { ItemCard } from './item-card';
import { HabitRow } from './habit-row';
import { SlotMarkAll } from './slot-mark-all';
import { ForecastCard } from './forecast-card';
import { MealSlotSection } from './meal-slot-section';
import { DailySummary } from './daily-summary';
import { logoutAction } from './actions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Today · आज',
};

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
  const dayPlannedTotals = computeDayPlannedTotals(plan.slots, plan.allowedVegs);
  const todayLabel = formatDateBilingual(plan.logDate, plan.member.timezone);
  const stepsToday = getStepsTodayFromHabits(plan.habits);

  return (
    <main className="min-h-dvh bg-background pb-16">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/70 backdrop-blur-md border-b border-border/50">
        <div className="max-w-md mx-auto px-5 py-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground tracking-wide">नमस्ते 🙏</p>
            <h1 className="text-xl font-semibold leading-tight tracking-tight">
              {plan.member.firstName}
            </h1>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <p className="text-[11px] text-muted-foreground">{todayLabel}</p>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-5 space-y-4">
        <DailySummary
          eatenItems={eatenItems}
          totalItems={totalItems}
          doneHabits={doneHabits}
          totalHabits={totalHabits}
          dayTotals={dayTotals}
          dayPlannedTotals={dayPlannedTotals}
        />

        {/* Weight-loss forecast */}
        <ForecastCard
          consumedKcal={dayTotals.cal}
          bmrKcal={plan.member.latestBmrKcal}
          weightKg={plan.member.latestWeightKg}
          stepsToday={stepsToday}
        />

        {/* Meal slots */}
        {plan.slots.map((slot) => {
          const eatenCount = slot.items.filter((i) => i.tick?.eaten).length;
          const totalCount = slot.items.length;
          const slotAllDone = totalCount > 0 && eatenCount === totalCount;
          return (
            <MealSlotSection
              key={slot.id}
              name={slot.name}
              eatenCount={eatenCount}
              totalCount={totalCount}
              approxKcal={slotPlannedKcal(slot, plan.allowedVegs)}
              initialCollapsed
              eatenKcal={slotEatenKcal(slot, plan.allowedVegs)}
              actionSlot={<SlotMarkAll mealSlotId={slot.id} allDone={slotAllDone} />}
            >
              {slot.items.map((item) => (
                <ItemCard key={item.id} item={item} allowedVegs={plan.allowedVegs} />
              ))}
            </MealSlotSection>
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

function slotPlannedKcal(slot: MealSlot, allowedVegs: FoodLite[]): number {
  let cal = 0;
  for (const item of slot.items) {
    cal += plannedItemNutrition(item, allowedVegs).cal;
  }
  return cal;
}

function slotEatenKcal(slot: MealSlot, allowedVegs: FoodLite[]): number {
  let cal = 0;
  for (const item of slot.items) {
    if (!item.tick?.eaten) continue;
    cal += computeItemNutrition(item, allowedVegs).cal;
  }
  return cal;
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

// Day planned totals: what the nutritionist prescribed. Includes open_veg
// slots using the average of allowed vegetables (since no single default veg
// exists). Every plan_item contributes — no silent skips.
function computeDayPlannedTotals(slots: MealSlot[], allowedVegs: FoodLite[]) {
  let total = emptyNutrition();
  for (const slot of slots) {
    for (const item of slot.items) {
      total = addNutrition(total, plannedItemNutrition(item, allowedVegs));
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
