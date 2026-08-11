import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LineChart, Scale } from 'lucide-react';
import { getSession } from '@/lib/session';
import { getPlanForDate, type MealSlot, type TodayPlan } from '@/lib/plan';
import { getProgress, summariseDays } from '@/lib/progress';
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
import { DateNav } from './date-nav';
import { logoutAction } from './actions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Today · आज',
};

function todayInTimezone(tz: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function normaliseDateParam(input: string | undefined, todayISO: string): string {
  if (!input) return todayISO;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return todayISO;
  if (input > todayISO) return todayISO;
  return input;
}

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  // Resolve the target date: URL param → validated → default to today
  const params = await searchParams;
  // Read member timezone first (needed to compute "today" & normalise the param).
  const plan = await getPlanForDate(session.memberId, params.d);
  const todayISO = todayInTimezone(plan.member.timezone);
  const logDate = plan.logDate;
  const isToday = logDate === todayISO;
  // If the URL param was invalid/future, the plan will already reflect the
  // corrected date. Optionally, redirect to a clean URL — skipped for simplicity.
  void normaliseDateParam;

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
  const stepsToday = getStepsTodayFromHabits(plan.habits);

  // Rolling-average forecast — only bother computing this for today's view;
  // historical days show today-only forecast (or none, since ForecastCard is
  // hidden on past days).
  let rollingAvgDeficit: number | null = null;
  let rollingDaysWithData = 0;
  if (isToday) {
    const progress = await getProgress(session.memberId, 7);
    const avgs = summariseDays(progress.days);
    rollingDaysWithData = avgs.daysWithData;
    if (avgs.daysWithData >= 2) rollingAvgDeficit = avgs.avgDeficit;
  }

  return (
    <main className="min-h-dvh bg-background pb-16">
      {/* Sticky header + date nav */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-md mx-auto px-5 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground tracking-wide">नमस्ते 🙏</p>
            <h1 className="text-xl font-semibold leading-tight tracking-tight">
              {plan.member.firstName}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/weight"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full border bg-card hover:bg-muted transition-colors"
              aria-label="Log weight"
            >
              <Scale className="h-3.5 w-3.5" />
              Weight
            </Link>
            <Link
              href="/progress"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full border bg-card hover:bg-muted transition-colors"
              aria-label="View progress"
            >
              <LineChart className="h-3.5 w-3.5" />
              Progress
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
        {/* Date nav row */}
        <div className="border-t border-border/40">
          <DateNav logDate={logDate} today={todayISO} timezone={plan.member.timezone} />
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-5 space-y-4">
        {/* Historical view banner */}
        {!isToday && (
          <div className="rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 text-sm px-4 py-2.5">
            You're viewing a past day. Any changes save to that date.
          </div>
        )}

        <DailySummary
          eatenItems={eatenItems}
          totalItems={totalItems}
          doneHabits={doneHabits}
          totalHabits={totalHabits}
          dayTotals={dayTotals}
          dayPlannedTotals={dayPlannedTotals}
        />

        {/* Forecast only makes sense for today (uses live BMR + steps) */}
        {isToday && (
          <ForecastCard
            consumedKcal={dayTotals.cal}
            bmrKcal={plan.member.latestBmrKcal}
            weightKg={plan.member.latestWeightKg}
            stepsToday={stepsToday}
            avgDeficitKcal={rollingAvgDeficit}
            daysWithData={rollingDaysWithData}
          />
        )}

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
              actionSlot={
                <SlotMarkAll mealSlotId={slot.id} allDone={slotAllDone} logDate={logDate} />
              }
            >
              {slot.items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  allowedVegs={plan.allowedVegs}
                  logDate={logDate}
                />
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
                <HabitRow
                  key={h.id}
                  habit={h}
                  weightKg={plan.member.latestWeightKg}
                  logDate={logDate}
                />
              ))}
            </div>
          </section>
        )}

        <p className="text-[12px] text-center text-muted-foreground pt-4">
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

function computeDayPlannedTotals(slots: MealSlot[], allowedVegs: FoodLite[]) {
  let total = emptyNutrition();
  for (const slot of slots) {
    for (const item of slot.items) {
      total = addNutrition(total, plannedItemNutrition(item, allowedVegs));
    }
  }
  return total;
}

function getStepsTodayFromHabits(habits: TodayPlan['habits']): number | null {
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
