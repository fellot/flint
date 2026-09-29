import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { ApiError } from '@/lib/api-error';
import { DEFAULT_PALATE, buildPalate, palateInput } from '@/lib/palate';
import { listWines } from './wines';
import { withJournal } from './journal';

function checkStorage(error: { code?: string } | null) {
  if (error?.code === '42P01' || error?.code === 'PGRST205') {
    throw new ApiError(503, 'My palate needs its database update. Run 20260928000000_personal_palate.sql in Supabase SQL Editor.');
  }
  if (error) throw error;
}

export async function loadPalate(client: SupabaseClient<Database>, cellarId: string, userId: string) {
  const [result, wines] = await Promise.all([
    client.from('palate_preferences').select('*').eq('user_id', userId).maybeSingle(),
    listWines(client, cellarId).then(wines => withJournal(client, cellarId, userId, wines)),
  ]);
  checkStorage(result.error);
  const preferences = result.data ? palateInput(result.data) : { ...DEFAULT_PALATE, dismissed_patterns: [] };
  // Recompute from current reviews each time. Edits, removals and access changes
  // are reflected immediately; no stale AI summaries or cross-user caches.
  return { wines, profile: buildPalate(wines, preferences) };
}

export async function savePalate(client: SupabaseClient<Database>, userId: string, body: unknown) {
  const preferences = palateInput(body);
  const { error } = await client.from('palate_preferences').upsert({ ...preferences, user_id: userId });
  checkStorage(error);
}
