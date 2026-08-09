import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';

// Server-only Supabase client using the service_role key.
// This bypasses RLS — every server-side query MUST manually filter by the
// session's member_id (or member_id derived via household).
// Do not import from client components. If you accidentally do, the missing
// SERVICE_ROLE key will produce a build error rather than a silent bypass.

let _client: SupabaseClient<Database> | null = null;

export function getServerSupabase(): SupabaseClient<Database> {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase server env: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY. ' +
        'Copy .env.local.example to .env.local and fill in the values from your Supabase dashboard.'
    );
  }

  _client = createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return _client;
}
