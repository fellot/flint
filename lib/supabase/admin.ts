import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './config';

// Used only for the owner's account invitation action. Wine/journal operations
// always use the signed-in client's RLS; this key never reaches the browser.
export function invitationClient() {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || !process.env.NEXT_PUBLIC_SITE_URL) return null;
  return createClient(getSupabaseConfig().url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
