import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';

// Server-only Supabase client using the SECRET key (sb_secret_...).
// This bypasses RLS — every server-side query MUST manually filter by the
// session's member_id (or member_id derived via household).
// Do not import from client components. If you accidentally do, the missing
// SUPABASE_SECRET_KEY env var will produce a runtime error rather than a
// silent bypass.

let _client: SupabaseClient<Database> | null = null;

export function getServerSupabase(): SupabaseClient<Database> {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error(
      'Missing Supabase server env: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SECRET_KEY. ' +
        'Copy .env.local.example to .env.local and fill in the values from your Supabase dashboard.'
    );
  }

  _client = createClient<Database>(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return _client;
}
