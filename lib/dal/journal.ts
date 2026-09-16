import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { Wine } from '@/types/wine';
import { attachJournal, reviewInput } from '@/lib/journal-data';
import { ApiError } from '@/lib/api-error';

type Client = SupabaseClient<Database>;

export async function getPeople(client: Client, cellarId: string, userId: string) {
  const [{ data, error }, membership] = await Promise.all([
    client.from('cellar_people').select('*').eq('cellar_id', cellarId).order('name'),
    client.from('cellar_members').select('role').eq('cellar_id', cellarId).eq('user_id', userId).single(),
  ]);
  if (error) throw error;
  if (membership.error) throw membership.error;
  return { people: data.map(person => ({ ...person, isMe: person.user_id === userId, active: person.user_id !== null })), isOwner: membership.data.role === 'owner' };
}

export async function withJournal(client: Client, cellarId: string, userId: string, wines: Wine[]) {
  if (!wines.length) return wines;
  // Paginate history/reviews too, not just the wine collection.
  async function pages<T>(page: (start: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
    const all: T[] = [];
    for (let start = 0; ; start += 1000) {
      const { data, error } = await page(start);
      if (error) throw error;
      all.push(...(data || []));
      if (!data || data.length < 1000) return all;
    }
  }
  const [people, participants, reviews] = await Promise.all([
    pages(start => client.from('cellar_people').select('*').eq('cellar_id', cellarId).order('id').range(start, start + 999)),
    pages(start => client.from('wine_participants').select('*').eq('cellar_id', cellarId).order('wine_id').order('person_id').range(start, start + 999)),
    pages(start => client.from('wine_reviews').select('*').eq('cellar_id', cellarId).order('wine_id').order('person_id').range(start, start + 999)),
  ]);
  return attachJournal(wines, people, participants, reviews, userId);
}

export async function saveReview(client: Client, cellarId: string, userId: string, wineId: string, body: unknown) {
  const values = reviewInput(body);
  const { data: person, error } = await client.from('cellar_people').select('id').eq('cellar_id', cellarId).eq('user_id', userId).single();
  if (error) throw error;
  const { data: participant, error: participantError } = await client.from('wine_participants').select('person_id')
    .eq('cellar_id', cellarId).eq('wine_id', wineId).eq('person_id', person.id).maybeSingle();
  if (participantError) throw participantError;
  if (!participant) throw new ApiError(403, 'You can review only a wine you shared.');
  const { error: saveError } = await client.from('wine_reviews').upsert({ cellar_id: cellarId, wine_id: wineId, person_id: person.id, ...values });
  if (saveError?.code === '42501') throw new ApiError(403, 'You can review only a consumed wine in your journal.');
  if (saveError) throw saveError;
  return { myRating: values.rating, myComment: values.comment };
}
