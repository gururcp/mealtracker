// Weight-reading data helpers used by /weight and /progress.

import { getServerSupabase } from '@/lib/supabase/server';

export type WeightReading = {
  id: string;
  readingDate: string;         // YYYY-MM-DD
  weightKg: number;
  fatMassKg: number | null;
  leanMassKg: number | null;
  muscleMassKg: number | null;
  boneMassKg: number | null;
  bodyFatPct: number | null;
  subcutaneousFatPct: number | null;
  visceralFat: number | null;
  bmrKcal: number | null;
  proteinPct: number | null;
  metabolicAge: number | null;
  bmi: number | null;
  note: string | null;
  createdAt: string;           // ISO timestamptz
};

function toReading(row: Record<string, unknown>): WeightReading {
  const num = (k: string) => (row[k] == null ? null : Number(row[k]));
  return {
    id: String(row.id),
    readingDate: String(row.reading_date),
    weightKg: Number(row.weight_kg),
    fatMassKg: num('fat_mass_kg'),
    leanMassKg: num('lean_mass_kg'),
    muscleMassKg: num('muscle_mass_kg'),
    boneMassKg: num('bone_mass_kg'),
    bodyFatPct: num('body_fat_pct'),
    subcutaneousFatPct: num('subcutaneous_fat_pct'),
    visceralFat: num('visceral_fat'),
    bmrKcal: num('bmr_kcal'),
    proteinPct: num('protein_pct'),
    metabolicAge: row.metabolic_age == null ? null : Number(row.metabolic_age),
    bmi: num('bmi'),
    note: (row.note as string | null) ?? null,
    createdAt: String(row.created_at),
  };
}

const SELECT_COLS = `
  id, reading_date, weight_kg,
  fat_mass_kg, lean_mass_kg, muscle_mass_kg, bone_mass_kg,
  body_fat_pct, subcutaneous_fat_pct, visceral_fat,
  bmr_kcal, protein_pct, metabolic_age, bmi,
  note, created_at
`;

export async function getRecentWeightReadings(
  memberId: string,
  limit = 20
): Promise<WeightReading[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('weight_readings')
    .select(SELECT_COLS)
    .eq('member_id', memberId)
    .order('reading_date', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`weight_readings: ${error.message}`);
  return (data ?? []).map((r) => toReading(r as unknown as Record<string, unknown>));
}

export async function getWeightReadingByDate(
  memberId: string,
  readingDate: string
): Promise<WeightReading | null> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('weight_readings')
    .select(SELECT_COLS)
    .eq('member_id', memberId)
    .eq('reading_date', readingDate)
    .maybeSingle();
  if (error) throw new Error(`weight_readings: ${error.message}`);
  return data ? toReading(data as unknown as Record<string, unknown>) : null;
}
