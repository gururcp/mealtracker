'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { clearSession, getSession } from '@/lib/session';
import { getServerSupabase } from '@/lib/supabase/server';

export async function logoutAction() {
  await clearSession();
  redirect('/login');
}

// ---------------------------------------------------------------------------
// Auth + date resolution
// ---------------------------------------------------------------------------

async function requireAuthed(): Promise<{ memberId: string; timezone: string }> {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const supabase = getServerSupabase();
  const { data: member } = await supabase
    .from('members')
    .select('id, timezone')
    .eq('id', session.memberId)
    .maybeSingle();
  if (!member) throw new Error('Member not found');
  return { memberId: member.id, timezone: member.timezone };
}

function todayInTimezone(tz: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

// Validate + clamp a client-supplied logDate. Falls back to today in the
// member's timezone. Never allows future dates (defensive; the UI blocks it too).
function resolveLogDate(input: string | null | undefined, timezone: string): string {
  const today = todayInTimezone(timezone);
  if (!input) return today;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return today;
  if (input > today) return today; // future → clamp
  return input;
}

// Get the plan_version_id to pin to a NEW daily_log. If a daily_log for this
// date already exists, we reuse its stored plan_version_id (see getOrCreateDailyLog).
async function getActivePlanVersionId(memberId: string): Promise<string> {
  const supabase = getServerSupabase();
  const { data } = await supabase
    .from('plan_versions')
    .select('id')
    .eq('member_id', memberId)
    .eq('status', 'active')
    .maybeSingle();
  if (!data) throw new Error('No active plan version');
  return data.id;
}

async function getOrCreateDailyLog(
  memberId: string,
  logDate: string
): Promise<string> {
  const supabase = getServerSupabase();
  const { data: existing } = await supabase
    .from('daily_logs')
    .select('id')
    .eq('member_id', memberId)
    .eq('log_date', logDate)
    .maybeSingle();
  if (existing) return existing.id;

  const planVersionId = await getActivePlanVersionId(memberId);
  const { data, error } = await supabase
    .from('daily_logs')
    .insert({ member_id: memberId, plan_version_id: planVersionId, log_date: logDate })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

// After any action, revalidate both the current-day view and the history dashboard.
// /today is always live-safe. /progress may or may not be cached; revalidate too.
function revalidateViews() {
  revalidatePath('/today');
  revalidatePath('/progress');
}

// ---------------------------------------------------------------------------
// Meal tick
// ---------------------------------------------------------------------------

export async function toggleMealTick(
  planItemId: string,
  currentlyEaten: boolean,
  chosenFoodId: string | null,
  logDate?: string
): Promise<void> {
  const { memberId, timezone } = await requireAuthed();
  const date = resolveLogDate(logDate, timezone);
  const dailyLogId = await getOrCreateDailyLog(memberId, date);

  const supabase = getServerSupabase();
  const { error } = await supabase.from('meal_ticks').upsert(
    {
      daily_log_id: dailyLogId,
      plan_item_id: planItemId,
      eaten: !currentlyEaten,
      chosen_food_id: !currentlyEaten ? chosenFoodId : null,
    },
    { onConflict: 'daily_log_id,plan_item_id' }
  );
  if (error) throw error;
  revalidateViews();
}

export async function pickAlternate(
  planItemId: string,
  chosenFoodId: string | null,
  logDate?: string
): Promise<void> {
  const { memberId, timezone } = await requireAuthed();
  const date = resolveLogDate(logDate, timezone);
  const dailyLogId = await getOrCreateDailyLog(memberId, date);

  const supabase = getServerSupabase();
  const { data: existing } = await supabase
    .from('meal_ticks')
    .select('eaten')
    .eq('daily_log_id', dailyLogId)
    .eq('plan_item_id', planItemId)
    .maybeSingle();

  const { error } = await supabase.from('meal_ticks').upsert(
    {
      daily_log_id: dailyLogId,
      plan_item_id: planItemId,
      eaten: existing?.eaten ?? false,
      chosen_food_id: chosenFoodId,
    },
    { onConflict: 'daily_log_id,plan_item_id' }
  );
  if (error) throw error;
  revalidateViews();
}

export async function setItemQuantity(
  planItemId: string,
  grams: number | null,
  logDate?: string
): Promise<void> {
  const { memberId, timezone } = await requireAuthed();
  const date = resolveLogDate(logDate, timezone);
  const dailyLogId = await getOrCreateDailyLog(memberId, date);

  const supabase = getServerSupabase();
  const { data: existing } = await supabase
    .from('meal_ticks')
    .select('eaten, chosen_food_id')
    .eq('daily_log_id', dailyLogId)
    .eq('plan_item_id', planItemId)
    .maybeSingle();

  const { error } = await supabase.from('meal_ticks').upsert(
    {
      daily_log_id: dailyLogId,
      plan_item_id: planItemId,
      eaten: existing?.eaten ?? true,
      chosen_food_id: existing?.chosen_food_id ?? null,
      quantity_eaten_g: grams,
    },
    { onConflict: 'daily_log_id,plan_item_id' }
  );
  if (error) throw error;
  revalidateViews();
}

// ---------------------------------------------------------------------------
// Veg selections
// ---------------------------------------------------------------------------

async function getOrCreateMealTick(
  planItemId: string,
  logDate: string,
  memberId: string
): Promise<string> {
  const dailyLogId = await getOrCreateDailyLog(memberId, logDate);
  const supabase = getServerSupabase();
  const { data: existing } = await supabase
    .from('meal_ticks')
    .select('id')
    .eq('daily_log_id', dailyLogId)
    .eq('plan_item_id', planItemId)
    .maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from('meal_ticks')
    .insert({ daily_log_id: dailyLogId, plan_item_id: planItemId, eaten: true })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function getFoodContentVersion(foodId: string): Promise<number> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('foods')
    .select('content_version')
    .eq('id', foodId)
    .single();
  if (error || !data) throw new Error(`Food ${foodId} not found`);
  return data.content_version;
}

export async function addVegSelection(
  planItemId: string,
  foodId: string,
  grams: number,
  logDate?: string
): Promise<void> {
  if (!Number.isFinite(grams) || grams <= 0) return;
  const { memberId, timezone } = await requireAuthed();
  const date = resolveLogDate(logDate, timezone);
  const tickId = await getOrCreateMealTick(planItemId, date, memberId);
  const contentVersion = await getFoodContentVersion(foodId);

  const supabase = getServerSupabase();

  const { data: existingSelections } = await supabase
    .from('meal_tick_veg_selections')
    .select('position, food_id')
    .eq('meal_tick_id', tickId);

  const existingForFood = (existingSelections ?? []).find((s) => s.food_id === foodId);
  if (existingForFood) {
    const { error } = await supabase
      .from('meal_tick_veg_selections')
      .update({ grams })
      .eq('meal_tick_id', tickId)
      .eq('food_id', foodId);
    if (error) throw error;
  } else {
    const nextPos = Math.max(0, ...(existingSelections ?? []).map((s) => s.position)) + 1;
    const { error } = await supabase.from('meal_tick_veg_selections').insert({
      meal_tick_id: tickId,
      food_id: foodId,
      food_content_version: contentVersion,
      grams,
      position: nextPos,
    });
    if (error) throw error;
  }

  await supabase.from('meal_ticks').update({ eaten: true }).eq('id', tickId);
  revalidateViews();
}

export async function updateVegSelection(selectionId: string, grams: number): Promise<void> {
  if (!Number.isFinite(grams) || grams <= 0) {
    await removeVegSelection(selectionId);
    return;
  }
  await requireAuthed();
  const supabase = getServerSupabase();
  const { error } = await supabase
    .from('meal_tick_veg_selections')
    .update({ grams })
    .eq('id', selectionId);
  if (error) throw error;
  revalidateViews();
}

export async function removeVegSelection(selectionId: string): Promise<void> {
  await requireAuthed();
  const supabase = getServerSupabase();

  const { data: sel } = await supabase
    .from('meal_tick_veg_selections')
    .select('meal_tick_id')
    .eq('id', selectionId)
    .maybeSingle();

  const { error } = await supabase.from('meal_tick_veg_selections').delete().eq('id', selectionId);
  if (error) throw error;

  if (sel?.meal_tick_id) {
    const { count } = await supabase
      .from('meal_tick_veg_selections')
      .select('*', { count: 'exact', head: true })
      .eq('meal_tick_id', sel.meal_tick_id);
    if ((count ?? 0) === 0) {
      await supabase.from('meal_ticks').update({ eaten: false }).eq('id', sel.meal_tick_id);
    }
  }

  revalidateViews();
}

// ---------------------------------------------------------------------------
// Mark all in a slot
// ---------------------------------------------------------------------------

export async function markSlotEaten(
  mealSlotId: string,
  logDate?: string
): Promise<{ skippedOpenVeg: number }> {
  const { memberId, timezone } = await requireAuthed();
  const date = resolveLogDate(logDate, timezone);
  const dailyLogId = await getOrCreateDailyLog(memberId, date);

  const supabase = getServerSupabase();

  const { data: items, error: itemsErr } = await supabase
    .from('plan_items')
    .select(
      `id,
       plan_item_alternates(kind, food_id, is_default),
       meal_ticks(chosen_food_id, daily_log_id)`
    )
    .eq('meal_slot_id', mealSlotId);
  if (itemsErr) throw itemsErr;

  let skippedOpenVeg = 0;
  const upserts: Array<{
    daily_log_id: string;
    plan_item_id: string;
    eaten: boolean;
    chosen_food_id: string | null;
  }> = [];

  for (const item of items ?? []) {
    const alts = (item.plan_item_alternates ?? []) as Array<{
      kind: 'specific' | 'open_veg';
      food_id: string | null;
      is_default: boolean;
    }>;
    const defaultAlt = alts.find((a) => a.is_default) ?? alts[0];

    const existingTick = ((item.meal_ticks ?? []) as Array<{
      chosen_food_id: string | null;
      daily_log_id: string;
    }>).find((t) => t.daily_log_id === dailyLogId);

    if (defaultAlt?.kind === 'open_veg' && !existingTick?.chosen_food_id) {
      skippedOpenVeg++;
      continue;
    }

    upserts.push({
      daily_log_id: dailyLogId,
      plan_item_id: item.id,
      eaten: true,
      chosen_food_id: existingTick?.chosen_food_id ?? defaultAlt?.food_id ?? null,
    });
  }

  if (upserts.length > 0) {
    const { error } = await supabase
      .from('meal_ticks')
      .upsert(upserts, { onConflict: 'daily_log_id,plan_item_id' });
    if (error) throw error;
  }

  revalidateViews();
  return { skippedOpenVeg };
}

// ---------------------------------------------------------------------------
// Habit tick
// ---------------------------------------------------------------------------

export async function toggleHabitBoolean(
  habitId: string,
  currentlyDone: boolean,
  logDate?: string
): Promise<void> {
  const { memberId, timezone } = await requireAuthed();
  const date = resolveLogDate(logDate, timezone);
  const dailyLogId = await getOrCreateDailyLog(memberId, date);

  const supabase = getServerSupabase();
  const { error } = await supabase.from('habit_ticks').upsert(
    { daily_log_id: dailyLogId, plan_habit_id: habitId, done: !currentlyDone },
    { onConflict: 'daily_log_id,plan_habit_id' }
  );
  if (error) throw error;
  revalidateViews();
}

export async function setHabitNumeric(
  habitId: string,
  value: number,
  valueUnit: string,
  targetValue: number,
  logDate?: string
): Promise<void> {
  const { memberId, timezone } = await requireAuthed();
  const date = resolveLogDate(logDate, timezone);
  const dailyLogId = await getOrCreateDailyLog(memberId, date);

  const supabase = getServerSupabase();
  const { error } = await supabase.from('habit_ticks').upsert(
    {
      daily_log_id: dailyLogId,
      plan_habit_id: habitId,
      done: value >= targetValue,
      value,
      value_unit: valueUnit,
    },
    { onConflict: 'daily_log_id,plan_habit_id' }
  );
  if (error) throw error;
  revalidateViews();
}
