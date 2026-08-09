// Scaling: foods store nutrition per 100 g/ml. Convert a serving (which may be
// in g/ml/piece/tsp/tbsp) to grams via the food's *_grams columns, then scale.

import type { FoodLite, Ingredient, Nutrition, PlanItem, Unit } from './plan';

// Nutrient metadata drives both the label and the % daily-value bar. Sources:
// NIH Office of Dietary Supplements (adult female, ≥51 years matches Vijaya's
// life stage). Values are conservative RDAs, not upper limits.
export type NutrientKey = keyof Nutrition;

export type NutrientMeta = {
  key: NutrientKey;
  labelEn: string;
  labelHi?: string;
  unit: string;
  dailyValue: number | null; // if null, no % DV bar (e.g. calories, macros — shown as absolute)
  group: 'macro' | 'mineral' | 'vitamin';
};

export const NUTRIENTS: NutrientMeta[] = [
  { key: 'cal',           labelEn: 'Calories',    labelHi: 'कैलोरी',    unit: 'kcal', dailyValue: null, group: 'macro' },
  { key: 'protein_g',     labelEn: 'Protein',     labelHi: 'प्रोटीन',    unit: 'g',    dailyValue: 46,   group: 'macro' },
  { key: 'carbs_g',       labelEn: 'Carbs',       labelHi: 'कार्ब्स',     unit: 'g',    dailyValue: 130,  group: 'macro' },
  { key: 'fat_g',         labelEn: 'Fat',         labelHi: 'वसा',        unit: 'g',    dailyValue: 60,   group: 'macro' },
  { key: 'fiber_g',       labelEn: 'Fiber',       labelHi: 'फाइबर',      unit: 'g',    dailyValue: 21,   group: 'macro' },

  { key: 'iron_mg',       labelEn: 'Iron',        labelHi: 'आयरन',       unit: 'mg',   dailyValue: 8,    group: 'mineral' },
  { key: 'calcium_mg',    labelEn: 'Calcium',     labelHi: 'कैल्शियम',    unit: 'mg',   dailyValue: 1200, group: 'mineral' },
  { key: 'magnesium_mg',  labelEn: 'Magnesium',   labelHi: 'मैग्नीशियम',  unit: 'mg',   dailyValue: 320,  group: 'mineral' },
  { key: 'phosphorus_mg', labelEn: 'Phosphorus',  labelHi: 'फास्फोरस',    unit: 'mg',   dailyValue: 700,  group: 'mineral' },
  { key: 'potassium_mg',  labelEn: 'Potassium',   labelHi: 'पोटैशियम',   unit: 'mg',   dailyValue: 2600, group: 'mineral' },
  { key: 'sodium_mg',     labelEn: 'Sodium',      labelHi: 'सोडियम',     unit: 'mg',   dailyValue: 1500, group: 'mineral' },
  { key: 'zinc_mg',       labelEn: 'Zinc',        labelHi: 'ज़िंक',       unit: 'mg',   dailyValue: 8,    group: 'mineral' },

  { key: 'vit_a_ug',      labelEn: 'Vitamin A',   labelHi: 'विटामिन A',   unit: 'µg',   dailyValue: 700,  group: 'vitamin' },
  { key: 'vit_c_mg',      labelEn: 'Vitamin C',   labelHi: 'विटामिन C',   unit: 'mg',   dailyValue: 75,   group: 'vitamin' },
  { key: 'vit_d_ug',      labelEn: 'Vitamin D',   labelHi: 'विटामिन D',   unit: 'µg',   dailyValue: 20,   group: 'vitamin' },
  { key: 'vit_e_mg',      labelEn: 'Vitamin E',   labelHi: 'विटामिन E',   unit: 'mg',   dailyValue: 15,   group: 'vitamin' },
  { key: 'vit_k_ug',      labelEn: 'Vitamin K',   labelHi: 'विटामिन K',   unit: 'µg',   dailyValue: 90,   group: 'vitamin' },
  { key: 'thiamin_mg',    labelEn: 'Thiamin (B1)', labelHi: 'थायमिन',     unit: 'mg',   dailyValue: 1.1,  group: 'vitamin' },
  { key: 'riboflavin_mg', labelEn: 'Riboflavin (B2)', labelHi: 'राइबोफ्लेविन', unit: 'mg', dailyValue: 1.1, group: 'vitamin' },
  { key: 'niacin_mg',     labelEn: 'Niacin (B3)', labelHi: 'नियासिन',     unit: 'mg',   dailyValue: 14,   group: 'vitamin' },
  { key: 'vit_b6_mg',     labelEn: 'Vitamin B6',  labelHi: 'विटामिन B6',  unit: 'mg',   dailyValue: 1.5,  group: 'vitamin' },
  { key: 'folate_ug',     labelEn: 'Folate',      labelHi: 'फोलेट',       unit: 'µg',   dailyValue: 400,  group: 'vitamin' },
  { key: 'vit_b12_ug',    labelEn: 'Vitamin B12', labelHi: 'विटामिन B12', unit: 'µg',   dailyValue: 2.4,  group: 'vitamin' },
];

// Convert one serving (quantity in `unit`) to grams (or ml for liquids).
// Returns null if the unit isn't supported for this food (e.g. asking for tsp
// on a food that doesn't set tsp_grams).
export function servingToGrams(food: FoodLite, quantity: number, unit: Unit): number | null {
  switch (unit) {
    case 'g':
    case 'ml':
      return quantity;
    case 'piece':
      return food.pieceGrams != null ? quantity * food.pieceGrams : null;
    case 'tsp':
      return food.tspGrams != null ? quantity * food.tspGrams : null;
    case 'tbsp':
      return food.tbspGrams != null ? quantity * food.tbspGrams : null;
  }
}

// Scale per-100 nutrition to serving size. Returns zeros if unit lookup failed.
export function scaleNutrition(food: FoodLite, quantity: number, unit: Unit): Nutrition {
  const grams = servingToGrams(food, quantity, unit) ?? 0;
  const factor = grams / 100;
  const src = food.nutritionPer100;
  const out = {} as Nutrition;
  for (const meta of NUTRIENTS) {
    out[meta.key] = round(src[meta.key] * factor, meta.key === 'cal' ? 0 : 2);
  }
  return out;
}

// Sum two nutrition objects (for meal-slot / day totals).
export function addNutrition(a: Nutrition, b: Nutrition): Nutrition {
  const out = {} as Nutrition;
  for (const meta of NUTRIENTS) out[meta.key] = round(a[meta.key] + b[meta.key], meta.key === 'cal' ? 0 : 2);
  return out;
}

export function emptyNutrition(): Nutrition {
  const out = {} as Nutrition;
  for (const meta of NUTRIENTS) out[meta.key] = 0;
  return out;
}

// Formatting helpers
export function fmt(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return '—';
  if (value === 0) return '0';
  if (value < 0.05 && value > 0) return '<0.1';
  return value.toFixed(decimals).replace(/\.0+$/, '');
}

export function pctOfDV(value: number, dv: number | null): number | null {
  if (dv == null || dv <= 0) return null;
  return Math.round((value / dv) * 100);
}

function round(v: number, decimals: number): number {
  const m = Math.pow(10, decimals);
  return Math.round(v * m) / m;
}

// ---------------------------------------------------------------------------
// Item-level composition (primary alternate + ingredients)
// ---------------------------------------------------------------------------

export type ItemBreakdown = {
  primary: { food: FoodLite; quantity: number; unit: Unit; nutrition: Nutrition } | null;
  ingredients: Array<{ ing: Ingredient; nutrition: Nutrition }>;
  total: Nutrition;
};

// Compute an item's full nutrition (primary + ingredients) given a resolved
// primary food and its quantity (possibly overridden from the planned amount
// by the user's actual eaten quantity).
export function computeItemBreakdown(
  primary: { food: FoodLite; quantity: number; unit: Unit } | null,
  ingredients: Ingredient[]
): ItemBreakdown {
  const primaryEntry = primary
    ? {
        food: primary.food,
        quantity: primary.quantity,
        unit: primary.unit,
        nutrition: scaleNutrition(primary.food, primary.quantity, primary.unit),
      }
    : null;

  const ingredientEntries = ingredients.map((ing) => ({
    ing,
    nutrition: scaleNutrition(ing.food, ing.quantity, ing.unit),
  }));

  let total = primaryEntry ? primaryEntry.nutrition : emptyNutrition();
  for (const e of ingredientEntries) total = addNutrition(total, e.nutrition);

  return { primary: primaryEntry, ingredients: ingredientEntries, total };
}

// Convenience: pick the currently-relevant primary for an item using the tick.
// - fixed items: always use the (single) default alternate.
// - choice items: use the alternate matching tick.chosen_food_id, else default.
// - open_veg items: if chosen_food_id is set and matches an allowedVeg, use that.
// - quantityEatenG override: if set on tick, use it (in grams) via a synthesized
//   'g' unit for the primary — ingredients are unaffected (their grams stay
//   fixed since they're seasoning-scale, not user-varied).
export function resolvePrimary(
  item: PlanItem,
  allowedVegs: FoodLite[]
): { food: FoodLite; quantity: number; unit: Unit } | null {
  const chosenId = item.tick?.chosenFoodId ?? null;

  let alt =
    (chosenId
      ? item.alternates.find(
          (a) => a.kind === 'specific' && a.food?.id === chosenId
        )
      : null) ??
    item.alternates.find((a) => a.isDefault) ??
    item.alternates[0] ??
    null;

  if (!alt) return null;

  let food: FoodLite | null = alt.food;
  if (alt.kind === 'open_veg') {
    if (chosenId) food = allowedVegs.find((v) => v.id === chosenId) ?? null;
    else food = null; // no veg chosen yet
  }
  if (!food) return null;

  // Apply quantity_eaten_g override if the user recorded actual grams.
  if (item.tick?.quantityEatenG != null) {
    return { food, quantity: item.tick.quantityEatenG, unit: 'g' };
  }
  return { food, quantity: alt.quantity, unit: alt.unit };
}
