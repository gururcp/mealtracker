// Fetches everything needed to render /today for one member in one place.
// Uses the server (secret-key) Supabase client — all filters are applied
// explicitly server-side; nothing relies on RLS in MVP.

import { getServerSupabase } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// Public shape returned to the page
// ---------------------------------------------------------------------------

export type Unit = 'g' | 'ml' | 'piece' | 'tsp' | 'tbsp';

export type Nutrition = {
  cal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  iron_mg: number;
  calcium_mg: number;
  magnesium_mg: number;
  phosphorus_mg: number;
  potassium_mg: number;
  sodium_mg: number;
  zinc_mg: number;
  vit_a_ug: number;
  vit_c_mg: number;
  vit_d_ug: number;
  vit_e_mg: number;
  vit_k_ug: number;
  thiamin_mg: number;
  riboflavin_mg: number;
  niacin_mg: number;
  vit_b6_mg: number;
  folate_ug: number;
  vit_b12_ug: number;
};

export type FoodLite = {
  id: string;
  enName: string;
  hiName: string | null;
  category: string;
  per100Unit: 'g' | 'ml';
  pieceGrams: number | null;
  tspGrams: number | null;
  tbspGrams: number | null;
  nutritionPer100: Nutrition;
};

export type Alternate = {
  id: string;
  position: number;
  kind: 'specific' | 'open_veg';
  isDefault: boolean;
  quantity: number;
  unit: Unit;
  food: FoodLite | null; // null for open_veg
};

export type Ingredient = {
  id: string;
  position: number;
  quantity: number;
  unit: Unit;
  note: string | null;
  food: FoodLite;
};

export type PlanItem = {
  id: string;
  position: number;
  kind: 'fixed' | 'choice';
  note: string | null;
  alternates: Alternate[];
  ingredients: Ingredient[];
  tick: {
    eaten: boolean;
    chosenFoodId: string | null;
    quantityEatenG: number | null;
  } | null;
};

export type MealSlot = {
  id: string;
  name: string;
  position: number;
  items: PlanItem[];
};

export type Habit = {
  id: string;
  enLabel: string;
  hiLabel: string | null;
  isBoolean: boolean;
  targetValue: number | null;
  targetMaxValue: number | null;
  targetUnit: string | null;
  tick: { done: boolean; value: number | null; valueUnit: string | null } | null;
};

export type TodayPlan = {
  member: {
    id: string;
    firstName: string;
    timezone: string;
    latestWeightKg: number | null; // for step-burn estimate
  };
  planVersion: {
    id: string;
    effectiveDate: string; // YYYY-MM-DD
    note: string | null;
  } | null;
  logDate: string; // YYYY-MM-DD in member's timezone
  slots: MealSlot[];
  allowedVegs: FoodLite[];
  habits: Habit[];
};

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------

// Foods have ~35 relevant columns; simpler to grab them all than list.
// Supabase's nested-select parser is finicky about whitespace in explicit
// column lists — using `*` sidesteps that.
const FOOD_COLUMNS = '*';

function toFoodLite(row: Record<string, unknown> | null): FoodLite | null {
  if (!row) return null;
  const n = (k: string) => Number(row[k] ?? 0);
  return {
    id: String(row.id),
    enName: String(row.en_name),
    hiName: (row.hi_name as string | null) ?? null,
    category: String(row.category),
    per100Unit: row.per_100_unit as 'g' | 'ml',
    pieceGrams: row.piece_grams == null ? null : Number(row.piece_grams),
    tspGrams: row.tsp_grams == null ? null : Number(row.tsp_grams),
    tbspGrams: row.tbsp_grams == null ? null : Number(row.tbsp_grams),
    nutritionPer100: {
      cal: n('cal'),
      protein_g: n('protein_g'),
      carbs_g: n('carbs_g'),
      fat_g: n('fat_g'),
      fiber_g: n('fiber_g'),
      iron_mg: n('iron_mg'),
      calcium_mg: n('calcium_mg'),
      magnesium_mg: n('magnesium_mg'),
      phosphorus_mg: n('phosphorus_mg'),
      potassium_mg: n('potassium_mg'),
      sodium_mg: n('sodium_mg'),
      zinc_mg: n('zinc_mg'),
      vit_a_ug: n('vit_a_ug'),
      vit_c_mg: n('vit_c_mg'),
      vit_d_ug: n('vit_d_ug'),
      vit_e_mg: n('vit_e_mg'),
      vit_k_ug: n('vit_k_ug'),
      thiamin_mg: n('thiamin_mg'),
      riboflavin_mg: n('riboflavin_mg'),
      niacin_mg: n('niacin_mg'),
      vit_b6_mg: n('vit_b6_mg'),
      folate_ug: n('folate_ug'),
      vit_b12_ug: n('vit_b12_ug'),
    },
  };
}

// Compute today's YYYY-MM-DD in a given IANA timezone.
function todayInTimezone(tz: string): string {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(now); // en-CA formats as YYYY-MM-DD
}

export async function getTodayPlan(memberId: string): Promise<TodayPlan> {
  const supabase = getServerSupabase();

  // 1. Member
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id, name, timezone')
    .eq('id', memberId)
    .single();
  if (memberError || !member) throw new Error('Member not found');

  const firstName = (member.name ?? '').split(/\s+/)[0] || member.name || '';
  const logDate = todayInTimezone(member.timezone);

  // 1b. Latest weight reading (for step-burn estimate)
  const { data: latestWeight } = await supabase
    .from('weight_readings')
    .select('weight_kg')
    .eq('member_id', memberId)
    .order('reading_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  const latestWeightKg = latestWeight?.weight_kg != null ? Number(latestWeight.weight_kg) : null;

  // 2. Active plan version
  const { data: planVersion } = await supabase
    .from('plan_versions')
    .select('id, effective_date, note')
    .eq('member_id', memberId)
    .eq('status', 'active')
    .maybeSingle();

  if (!planVersion) {
    return {
      member: { id: member.id, firstName, timezone: member.timezone, latestWeightKg },
      planVersion: null,
      logDate,
      slots: [],
      allowedVegs: [],
      habits: [],
    };
  }

  // 3. Meal slots
  const { data: slotRows, error: slotErr } = await supabase
    .from('meal_slots')
    .select('id, name, position')
    .eq('plan_version_id', planVersion.id)
    .order('position');
  if (slotErr) throw new Error(`meal_slots: ${slotErr.message}`);

  // 4. Plan items
  const { data: itemRows, error: itemErr } = await supabase
    .from('plan_items')
    .select('id, meal_slot_id, position, kind, note')
    .eq('plan_version_id', planVersion.id)
    .order('position');
  if (itemErr) throw new Error(`plan_items: ${itemErr.message}`);

  // 5. Alternates + join food (explicit FK name avoids nested-select ambiguity)
  const itemIds = (itemRows ?? []).map((i) => i.id);
  const inClauseIds = itemIds.length ? itemIds : ['00000000-0000-0000-0000-000000000000'];

  const { data: altRows, error: altErr } = await supabase
    .from('plan_item_alternates')
    .select(
      `id, plan_item_id, position, kind, is_default, quantity, unit,
       food:foods!plan_item_alternates_food_id_fkey(${FOOD_COLUMNS})`
    )
    .in('plan_item_id', inClauseIds);
  if (altErr) throw new Error(`plan_item_alternates: ${altErr.message}`);

  // 5b. Ingredients + join food (always-specific, so FK is non-null)
  const { data: ingredientRows, error: ingErr } = await supabase
    .from('plan_item_ingredients')
    .select(
      `id, plan_item_id, position, quantity, unit, note,
       food:foods!plan_item_ingredients_food_id_fkey(${FOOD_COLUMNS})`
    )
    .in('plan_item_id', inClauseIds);
  if (ingErr) throw new Error(`plan_item_ingredients: ${ingErr.message}`);

  // 6. Allowed vegs
  const { data: allowedVegRows, error: vegErr } = await supabase
    .from('plan_allowed_vegs')
    .select(`food:foods!plan_allowed_vegs_food_id_fkey(${FOOD_COLUMNS})`)
    .eq('plan_version_id', planVersion.id);
  if (vegErr) throw new Error(`plan_allowed_vegs: ${vegErr.message}`);

  // 7. Habits
  const { data: habitRows, error: habitErr } = await supabase
    .from('plan_habits')
    .select(
      'id, position, en_label, hi_label, is_boolean, target_value, target_max_value, target_unit'
    )
    .eq('plan_version_id', planVersion.id)
    .order('position');
  if (habitErr) throw new Error(`plan_habits: ${habitErr.message}`);

  // 8. Today's daily log + ticks (if any)
  const { data: dailyLog } = await supabase
    .from('daily_logs')
    .select('id')
    .eq('member_id', memberId)
    .eq('log_date', logDate)
    .maybeSingle();

  let mealTicksById: Record<
    string,
    { eaten: boolean; chosen_food_id: string | null; quantity_eaten_g: number | null }
  > = {};
  let habitTicksById: Record<
    string,
    { done: boolean; value: number | null; value_unit: string | null }
  > = {};

  if (dailyLog?.id) {
    const [{ data: mt }, { data: ht }] = await Promise.all([
      supabase
        .from('meal_ticks')
        .select('plan_item_id, eaten, chosen_food_id, quantity_eaten_g')
        .eq('daily_log_id', dailyLog.id),
      supabase
        .from('habit_ticks')
        .select('plan_habit_id, done, value, value_unit')
        .eq('daily_log_id', dailyLog.id),
    ]);
    mealTicksById = Object.fromEntries(
      (mt ?? []).map((r) => [
        r.plan_item_id,
        {
          eaten: r.eaten,
          chosen_food_id: r.chosen_food_id,
          quantity_eaten_g: r.quantity_eaten_g == null ? null : Number(r.quantity_eaten_g),
        },
      ])
    );
    habitTicksById = Object.fromEntries(
      (ht ?? []).map((r) => [
        r.plan_habit_id,
        { done: r.done, value: r.value == null ? null : Number(r.value), value_unit: r.value_unit },
      ])
    );
  }

  // Shape response
  const altsByItem = new Map<string, Alternate[]>();
  for (const a of altRows ?? []) {
    // Supabase types the joined `food` as an array when the relationship is
    // ambiguous. Our select uses a single-row alias so it's always at most one row.
    const food = Array.isArray(a.food) ? (a.food[0] ?? null) : a.food;
    const alt: Alternate = {
      id: a.id,
      position: a.position,
      kind: a.kind as 'specific' | 'open_veg',
      isDefault: a.is_default,
      quantity: Number(a.quantity),
      unit: a.unit as Unit,
      food: toFoodLite(food as Record<string, unknown> | null),
    };
    const list = altsByItem.get(a.plan_item_id) ?? [];
    list.push(alt);
    altsByItem.set(a.plan_item_id, list);
  }
  for (const list of altsByItem.values()) list.sort((a, b) => a.position - b.position);

  const ingsByItem = new Map<string, Ingredient[]>();
  for (const r of ingredientRows ?? []) {
    const foodRaw = Array.isArray(r.food) ? (r.food[0] ?? null) : r.food;
    const food = toFoodLite(foodRaw as Record<string, unknown> | null);
    if (!food) continue;
    const ing: Ingredient = {
      id: r.id,
      position: r.position,
      quantity: Number(r.quantity),
      unit: r.unit as Unit,
      note: r.note,
      food,
    };
    const list = ingsByItem.get(r.plan_item_id) ?? [];
    list.push(ing);
    ingsByItem.set(r.plan_item_id, list);
  }
  for (const list of ingsByItem.values()) list.sort((a, b) => a.position - b.position);

  const itemsBySlot = new Map<string, PlanItem[]>();
  for (const i of itemRows ?? []) {
    const item: PlanItem = {
      id: i.id,
      position: i.position,
      kind: i.kind as 'fixed' | 'choice',
      note: i.note,
      alternates: altsByItem.get(i.id) ?? [],
      ingredients: ingsByItem.get(i.id) ?? [],
      tick: mealTicksById[i.id]
        ? {
            eaten: mealTicksById[i.id].eaten,
            chosenFoodId: mealTicksById[i.id].chosen_food_id,
            quantityEatenG: mealTicksById[i.id].quantity_eaten_g,
          }
        : null,
    };
    const list = itemsBySlot.get(i.meal_slot_id) ?? [];
    list.push(item);
    itemsBySlot.set(i.meal_slot_id, list);
  }
  for (const list of itemsBySlot.values()) list.sort((a, b) => a.position - b.position);

  const slots: MealSlot[] = (slotRows ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    position: s.position,
    items: itemsBySlot.get(s.id) ?? [],
  }));

  const allowedVegs: FoodLite[] = (allowedVegRows ?? [])
    .map((r) => {
      const f = Array.isArray(r.food) ? r.food[0] ?? null : r.food;
      return toFoodLite(f as Record<string, unknown> | null);
    })
    .filter((f): f is FoodLite => f !== null)
    .sort((a, b) => a.enName.localeCompare(b.enName));

  const habits: Habit[] = (habitRows ?? []).map((h) => ({
    id: h.id,
    enLabel: h.en_label,
    hiLabel: h.hi_label,
    isBoolean: h.is_boolean,
    targetValue: h.target_value == null ? null : Number(h.target_value),
    targetMaxValue: h.target_max_value == null ? null : Number(h.target_max_value),
    targetUnit: h.target_unit,
    tick: habitTicksById[h.id]
      ? {
          done: habitTicksById[h.id].done,
          value: habitTicksById[h.id].value,
          valueUnit: habitTicksById[h.id].value_unit,
        }
      : null,
  }));

  return {
    member: { id: member.id, firstName, timezone: member.timezone, latestWeightKg },
    planVersion: {
      id: planVersion.id,
      effectiveDate: planVersion.effective_date,
      note: planVersion.note,
    },
    logDate,
    slots,
    allowedVegs,
    habits,
  };
}
