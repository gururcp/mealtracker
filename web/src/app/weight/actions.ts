'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getServerSupabase } from '@/lib/supabase/server';

async function requireMemberId(): Promise<string> {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session.memberId;
}

// Parse a form-data value into a number-or-null. Empty string → null.
function num(v: FormDataEntryValue | null): number | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function intOrNull(v: FormDataEntryValue | null): number | null {
  const n = num(v);
  if (n == null) return null;
  return Math.round(n);
}

export type SaveWeightState = {
  error?: string;
  savedFor?: string; // reading_date on success
};

export async function saveWeightReading(
  _prev: SaveWeightState,
  formData: FormData
): Promise<SaveWeightState> {
  const memberId = await requireMemberId();

  const readingDate = String(formData.get('reading_date') ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(readingDate)) {
    return { error: 'Please pick a valid date.' };
  }

  const weightKg = num(formData.get('weight_kg'));
  if (weightKg == null || weightKg <= 0 || weightKg > 500) {
    return { error: 'Weight is required and must be between 1 and 500 kg.' };
  }

  const row = {
    member_id: memberId,
    reading_date: readingDate,
    weight_kg: weightKg,
    fat_mass_kg: num(formData.get('fat_mass_kg')),
    lean_mass_kg: num(formData.get('lean_mass_kg')),
    muscle_mass_kg: num(formData.get('muscle_mass_kg')),
    bone_mass_kg: num(formData.get('bone_mass_kg')),
    body_fat_pct: num(formData.get('body_fat_pct')),
    subcutaneous_fat_pct: num(formData.get('subcutaneous_fat_pct')),
    visceral_fat: num(formData.get('visceral_fat')),
    bmr_kcal: num(formData.get('bmr_kcal')),
    protein_pct: num(formData.get('protein_pct')),
    metabolic_age: intOrNull(formData.get('metabolic_age')),
    bmi: num(formData.get('bmi')),
    note: (() => {
      const n = String(formData.get('note') ?? '').trim();
      return n === '' ? null : n;
    })(),
    entered_by_member_id: memberId,
  };

  const supabase = getServerSupabase();
  const { error } = await supabase
    .from('weight_readings')
    .upsert(row, { onConflict: 'member_id,reading_date' });
  if (error) {
    return { error: `Could not save: ${error.message}` };
  }

  revalidatePath('/weight');
  revalidatePath('/progress');
  revalidatePath('/today');
  return { savedFor: readingDate };
}

export async function deleteWeightReading(readingId: string): Promise<void> {
  const memberId = await requireMemberId();
  const supabase = getServerSupabase();
  const { error } = await supabase
    .from('weight_readings')
    .delete()
    .eq('id', readingId)
    .eq('member_id', memberId);
  if (error) throw error;
  revalidatePath('/weight');
  revalidatePath('/progress');
  revalidatePath('/today');
}

// Redirect after save so the URL / prefill state resets. Used by client after
// receiving savedFor from useActionState.
export async function goToWeight(readingDate?: string): Promise<void> {
  redirect(readingDate ? `/weight?date=${readingDate}` : '/weight');
}
