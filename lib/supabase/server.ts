import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseConfig } from './config';
import type { Database } from '@/types/database';

export function createClient() {
  const cookieStore = cookies();
  const { url, key } = getSupabaseConfig();
  return createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => {
        // Used from route handlers and server actions, where cookies are writable.
        values.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      },
    },
  });
}
