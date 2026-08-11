// Per-day rollups for the /progress dashboard.
// For each of the last N days, computes:
//   - kcal eaten (from ticked items, respecting quantity overrides + selections)
//   - kcal planned (from that day's plan_version)
//   - kcal burnt (BMR × 1.2 + walking from steps habit)
//   - items done / total
//   - habits done / total
//   - weight_kg on that date (if a reading exists)

import { getServerSupabase } from '@/lib/supabase/server';
import { computeItemNutrition, plannedItemNutrition } from '@/lib/nutrition';
import { getPlanForDate } from '@/lib/plan';

const SEDENTARY_FACTOR = 1.2;
const KCAL_PER_STEP_PER_KG = 0.0005;

export type DaySummary = {
  date: string;              // YYYY-MM-DD
  kcalEaten: number;
  kcalPlanned: number;
  kcalBurntBmr: number;
  kcalBurntWalking: number;
  kcalBurntTotal: number;
  netDeficit: number;         // burnt - eaten. positive = deficit.
  itemsDone: number;
  itemsTotal: number;
  habitsDone: number;
  habitsTotal: number;
  weightKg: number | null;
  steps: number | null;
  hasData: boolean;           // did any tick / selection / weight get logged that day
};

export type ProgressData = {
  member: {
    firstName: string;
    timezone: string;
    latestWeightKg: number | null;
    latestBmrKcal: number | null;
  };
  days: DaySummary[];         // oldest → newest
  weightSeries: Array<{ date: string; weightKg: number }>; // last 90 days
};

export type ProgressAverages = {
  daysWithData: number;
  avgKcalEaten: number;
  avgKcalPlanned: number;
  avgKcalBurnt: number;
  avgDeficit: number;              // burnt − eaten. positive = deficit.
  avgAdherencePct: number;         // items ticked / total, avg of days-with-data
  weightDeltaKg: number | null;    // first-to-last weighing in the window
};

// Reduce day rollups into single-number averages.
// Only counts days where the member logged at least one item — otherwise "0
// kcal eaten" would drag the mean far below reality on empty days.
export function summariseDays(days: DaySummary[]): ProgressAverages {
  const active = days.filter((d) => d.itemsDone > 0);
  const n = Math.max(1, active.length);
  const avgEaten = active.reduce((s, d) => s + d.kcalEaten, 0) / n;
  const avgPlanned = days.reduce((s, d) => s + d.kcalPlanned, 0) / Math.max(1, days.length);
  const avgBurnt = active.reduce((s, d) => s + d.kcalBurntTotal, 0) / n;
  const avgDeficit = active.reduce((s, d) => s + d.netDeficit, 0) / n;
  const avgAdherencePct =
    (active.reduce(
      (s, d) => s + (d.itemsTotal > 0 ? (d.itemsDone / d.itemsTotal) * 100 : 0),
      0
    ) / n) || 0;

  const withWeight = days.filter((d) => d.weightKg != null);
  let weightDeltaKg: number | null = null;
  if (withWeight.length >= 2) {
    weightDeltaKg = withWeight[withWeight.length - 1].weightKg! - withWeight[0].weightKg!;
  }

  return {
    daysWithData: active.length,
    avgKcalEaten: avgEaten,
    avgKcalPlanned: avgPlanned,
    avgKcalBurnt: avgBurnt,
    avgDeficit,
    avgAdherencePct,
    weightDeltaKg,
  };
}

function todayInTimezone(tz: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const t = Date.UTC(y, m - 1, d, 12, 0, 0) + days * 86400_000;
  const nd = new Date(t);
  return `${nd.getUTCFullYear()}-${String(nd.getUTCMonth() + 1).padStart(2, '0')}-${String(nd.getUTCDate()).padStart(2, '0')}`;
}

/**
 * Load progress rollups for the last N days.
 * Uses getPlanForDate under the hood — pragmatic (not the fastest) but keeps
 * the plan-version resolution + nutrition math consistent with /today.
 */
export async function getProgress(memberId: string, days = 7): Promise<ProgressData> {
  const supabase = getServerSupabase();

  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id, name, timezone')
    .eq('id', memberId)
    .single();
  if (memberError || !member) throw new Error('Member not found');

  const firstName = (member.name ?? '').split(/\s+/)[0] || member.name || '';
  const todayISO = todayInTimezone(member.timezone);

  // Weight readings for the last ~90 days (for the trend line)
  const startTrend = addDaysISO(todayISO, -90);
  const { data: weightRows } = await supabase
    .from('weight_readings')
    .select('reading_date, weight_kg, bmr_kcal')
    .eq('member_id', memberId)
    .gte('reading_date', startTrend)
    .order('reading_date', { ascending: true });

  const latestWeight = (weightRows ?? []).slice(-1)[0] ?? null;
  const latestWeightKg = latestWeight?.weight_kg != null ? Number(latestWeight.weight_kg) : null;
  const latestBmrKcal = latestWeight?.bmr_kcal != null ? Number(latestWeight.bmr_kcal) : null;

  // Build a date→weight lookup (most recent-per-date if duplicates)
  const weightByDate = new Map<string, number>();
  for (const r of weightRows ?? []) {
    if (r.weight_kg != null) weightByDate.set(String(r.reading_date), Number(r.weight_kg));
  }

  // Fetch a plan snapshot per day in parallel. For an MVP with ~7-30 days this
  // is fine; if this ever becomes a bottleneck, replace with a single joined SQL.
  const dateList: string[] = [];
  for (let i = days - 1; i >= 0; i--) dateList.push(addDaysISO(todayISO, -i));

  const snapshots = await Promise.all(
    dateList.map(async (date) => {
      const plan = await getPlanForDate(memberId, date);
      return { date, plan };
    })
  );

  const dayData: DaySummary[] = snapshots.map(({ date, plan }) => {
    const itemsDone = plan.slots.reduce(
      (sum, s) => sum + s.items.filter((i) => i.tick?.eaten).length,
      0
    );
    const itemsTotal = plan.slots.reduce((sum, s) => sum + s.items.length, 0);
    const habitsDone = plan.habits.filter((h) => h.tick?.done).length;
    const habitsTotal = plan.habits.length;

    let kcalEaten = 0;
    let planned = 0;
    for (const slot of plan.slots) {
      for (const item of slot.items) {
        if (item.tick?.eaten) {
          kcalEaten += computeItemNutrition(item, plan.allowedVegs).cal;
        }
        planned += plannedItemNutrition(item, plan.allowedVegs).cal;
      }
    }

    const stepsHabit = plan.habits.find((h) => h.targetUnit === 'steps');
    const steps = stepsHabit?.tick?.value != null ? Number(stepsHabit.tick.value) : null;

    // Use latestBmr / latestWeight as best-available; a proper implementation
    // could use the weight reading closest to `date`, but for a rough backfill
    // the latest is close enough.
    const weightForDay = weightByDate.get(date) ?? latestWeightKg ?? null;
    const kcalBurntBmr = latestBmrKcal != null ? Math.round(latestBmrKcal * SEDENTARY_FACTOR) : 0;
    const kcalBurntWalking =
      steps != null && steps > 0 && weightForDay != null
        ? Math.round(steps * KCAL_PER_STEP_PER_KG * weightForDay)
        : 0;
    const kcalBurntTotal = kcalBurntBmr + kcalBurntWalking;

    const hasData = itemsDone > 0 || habitsDone > 0 || weightForDay !== latestWeightKg;

    return {
      date,
      kcalEaten: Math.round(kcalEaten),
      kcalPlanned: Math.round(planned),
      kcalBurntBmr,
      kcalBurntWalking,
      kcalBurntTotal,
      netDeficit: kcalBurntTotal - Math.round(kcalEaten),
      itemsDone,
      itemsTotal,
      habitsDone,
      habitsTotal,
      weightKg: weightByDate.get(date) ?? null,
      steps,
      hasData,
    };
  });

  const weightSeries = (weightRows ?? [])
    .filter((r) => r.weight_kg != null)
    .map((r) => ({ date: String(r.reading_date), weightKg: Number(r.weight_kg) }));

  return {
    member: {
      firstName,
      timezone: member.timezone,
      latestWeightKg,
      latestBmrKcal,
    },
    days: dayData,
    weightSeries,
  };
}
