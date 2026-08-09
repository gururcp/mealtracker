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
// Helpers
// ---------------------------------------------------------------------------

async function requireAuthed(): Promise<{ memberId: string; timezone: string; planVersionId: string }> {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const supabase = getServerSupabase();
  const { data: member } = await supabase
    .from('members')
    .select('id, timezone')
    .eq('id', session.memberId)
    .maybeSingle();
  if (!member) throw new Error('Member not found');

  const { data: pv } = await supabase
    .from('plan_versions')
    .select('id')
    .eq('member_id', member.id)
    .eq('status', 'active')
    .maybeSingle();
  if (!pv) throw new Error('No active plan');

  return { memberId: member.id, timezone: member.timezone, planVersionId: pv.id };
}

function todayInTimezone(tz: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

async function getOrCreateDailyLog(
  memberId: string,
  planVersionId: string,
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

  const { data, error } = await supabase
    .from('daily_logs')
    .insert({ member_id: memberId, plan_version_id: planVersionId, log_date: logDate })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

// ---------------------------------------------------------------------------
// Meal tick
// ---------------------------------------------------------------------------

export async function toggleMealTick(
  planItemId: string,
  currentlyEaten: boolean,
  chosenFoodId: string | null
): Promise<void> {
  const { memberId, timezone, planVersionId } = await requireAuthed();
  const logDate = todayInTimezone(timezone);
  const dailyLogId = await getOrCreateDailyLog(memberId, planVersionId, logDate);

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

  revalidatePath('/today');
}

export async function pickAlternate(
  planItemId: string,
  chosenFoodId: string | null
): Promise<void> {
  const { memberId, timezone, planVersionId } = await requireAuthed();
  const logDate = todayInTimezone(timezone);
  const dailyLogId = await getOrCreateDailyLog(memberId, planVersionId, logDate);

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

  revalidatePath('/today');
}

// Set the actual grams eaten for a ticked item. Pass null to clear the override
// (revert to the planned quantity for nutrition calculations).
export async function setItemQuantity(
  planItemId: string,
  grams: number | null
): Promise<void> {
  const { memberId, timezone, planVersionId } = await requireAuthed();
  const logDate = todayInTimezone(timezone);
  const dailyLogId = await getOrCreateDailyLog(memberId, planVersionId, logDate);

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
      eaten: existing?.eaten ?? true, // logging a quantity implies eaten
      chosen_food_id: existing?.chosen_food_id ?? null,
      quantity_eaten_g: grams,
    },
    { onConflict: 'daily_log_id,plan_item_id' }
  );
  if (error) throw error;

  revalidatePath('/today');
}

// ---------------------------------------------------------------------------
// Veg selections (multi-veg picker for open_veg items)
// ---------------------------------------------------------------------------

// Ensures a meal_tick exists for the item; returns its id.
// If a new tick is created, seeds eaten=true (adding a selection implies eating).
async function getOrCreateMealTick(planItemId: string): Promise<string> {
  const { memberId, timezone, planVersionId } = await requireAuthed();
  const logDate = todayInTimezone(timezone);
  const dailyLogId = await getOrCreateDailyLog(memberId, planVersionId, logDate);

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

// Look up the current content_version for a food so selections stay pinned.
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
  grams: number
): Promise<void> {
  if (!Number.isFinite(grams) || grams <= 0) return;
  const tickId = await getOrCreateMealTick(planItemId);
  const contentVersion = await getFoodContentVersion(foodId);

  const supabase = getServerSupabase();

  // Determine next position for this tick
  const { data: existingSelections } = await supabase
    .from('meal_tick_veg_selections')
    .select('position, food_id')
    .eq('meal_tick_id', tickId);

  const existingForFood = (existingSelections ?? []).find((s) => s.food_id === foodId);
  if (existingForFood) {
    // Already present — update grams instead (idempotent add)
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

  // Adding a selection implies eating — set eaten=true.
  await supabase.from('meal_ticks').update({ eaten: true }).eq('id', tickId);

  revalidatePath('/today');
}

export async function updateVegSelection(selectionId: string, grams: number): Promise<void> {
  if (!Number.isFinite(grams) || grams <= 0) {
    // Zero or negative → treat as removal
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
  revalidatePath('/today');
}

export async function removeVegSelection(selectionId: string): Promise<void> {
  await requireAuthed();
  const supabase = getServerSupabase();

  // Look up parent tick so we can auto-un-tick if we removed the last selection.
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

  revalidatePath('/today');
}

// Mark every plan_item in the given meal slot as eaten with each item's
// resolved default food. Skips items that need an open_veg pick — those
// must be chosen explicitly first (nutrition would be zero otherwise).
export async function markSlotEaten(mealSlotId: string): Promise<{ skippedOpenVeg: number }> {
  const { memberId, timezone, planVersionId } = await requireAuthed();
  const logDate = todayInTimezone(timezone);
  const dailyLogId = await getOrCreateDailyLog(memberId, planVersionId, logDate);

  const supabase = getServerSupabase();

  // Pull items in this slot + their alternates + any existing ticks
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

    // For open_veg items with no chosen food, skip — user must pick.
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

  revalidatePath('/today');
  return { skippedOpenVeg };
}

// ---------------------------------------------------------------------------
// Habit tick
// ---------------------------------------------------------------------------

export async function toggleHabitBoolean(
  habitId: string,
  currentlyDone: boolean
): Promise<void> {
  const { memberId, timezone, planVersionId } = await requireAuthed();
  const logDate = todayInTimezone(timezone);
  const dailyLogId = await getOrCreateDailyLog(memberId, planVersionId, logDate);

  const supabase = getServerSupabase();
  const { error } = await supabase.from('habit_ticks').upsert(
    { daily_log_id: dailyLogId, plan_habit_id: habitId, done: !currentlyDone },
    { onConflict: 'daily_log_id,plan_habit_id' }
  );
  if (error) throw error;

  revalidatePath('/today');
}

export async function setHabitNumeric(
  habitId: string,
  value: number,
  valueUnit: string,
  targetValue: number
): Promise<void> {
  const { memberId, timezone, planVersionId } = await requireAuthed();
  const logDate = todayInTimezone(timezone);
  const dailyLogId = await getOrCreateDailyLog(memberId, planVersionId, logDate);

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

  revalidatePath('/today');
}
