import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { newWineInput, rowToWine, wineInput } from '@/lib/wine-data';
import { participantInput, reviewInput } from '@/lib/journal-data';
import { ApiError } from '@/lib/api-error';

type Client = SupabaseClient<Database>;

export async function listWines(client: Client, cellarId: string) {
  // Supabase limits responses to 1,000 rows by default. Fetch every page.
  const wines = [];
  for (let start = 0; ; start += 1000) {
    const { data, error } = await client.from('wines').select('*').eq('cellar_id', cellarId)
      .order('created_at').order('id').range(start, start + 999);
    if (error) throw error;
    wines.push(...data.map(rowToWine));
    if (data.length < 1000) return wines;
  }
}

export async function getWine(client: Client, cellarId: string, id: string) {
  const { data, error } = await client.from('wines').select('*').eq('cellar_id', cellarId).eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, 'Wine not found.');
  return rowToWine(data);
}

export async function addWine(client: Client, cellarId: string, body: unknown) {
  const input = newWineInput(body);
  if (input.status === 'consumed') {
    const review = reviewInput(body);
    const { data, error } = await client.rpc('log_consumed_wine', {
      p_cellar_id: cellarId, p_wine: { ...input, notes: '', rating: null },
      p_person_ids: participantInput(body), p_rating: review.rating, p_comment: review.comment,
    });
    if (error?.code === '22023') throw new ApiError(400, error.message);
    if (error) throw error;
    return rowToWine(data);
  }
  const { data, error } = await client.from('wines').insert({ ...input, cellar_id: cellarId })
    .select('*').single();
  if (error) throw error;
  return rowToWine(data);
}

export async function updateWine(client: Client, cellarId: string, id: string, body: unknown) {
  const values = wineInput(body, true);
  if (values.status !== undefined) {
    const current = await getWine(client, cellarId, id);
    if (current.status !== values.status && (current.status === 'consumed' || values.status === 'consumed')) {
      throw new ApiError(400, 'Use Open a bottle to record consumption and choose participants. Consumed records stay in the journal.');
    }
  }
  if (!Object.keys(values).length) throw new ApiError(400, 'No wine fields supplied.');
  const { data, error } = await client.from('wines').update(values).eq('cellar_id', cellarId).eq('id', id).select('*').maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, 'Wine not found.');
  return rowToWine(data);
}

export async function deleteWine(client: Client, cellarId: string, id: string) {
  const { data, error } = await client.from('wines').delete().eq('cellar_id', cellarId).eq('id', id).select('id').maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, 'Wine not found.');
}
