'use server';

import { redirect } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase/server';
import { setSession } from '@/lib/session';

export type LoginState = { error?: string };

// PIN auth for V0.1. pin_hash currently stores the plaintext PIN (MVP
// trade-off, documented in CLAUDE.md). V0.2 swaps this for bcrypt +
// Supabase Auth before any second user joins.
export async function loginWithPin(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const pin = String(formData.get('pin') ?? '').trim();

  if (!/^\d{4}$/.test(pin)) {
    return { error: 'PIN must be 4 digits' };
  }

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('members')
    .select('id, is_active')
    .eq('pin_hash', pin)
    .limit(1)
    .maybeSingle();

  if (error) {
    return { error: 'Something went wrong. Please try again.' };
  }

  if (!data) {
    return { error: 'Wrong PIN. Try again.' };
  }

  if (!data.is_active) {
    return { error: 'Account is inactive. Contact your nutritionist.' };
  }

  await setSession(data.id);
  redirect('/today');
}
