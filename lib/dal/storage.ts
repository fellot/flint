import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, CellarStorage, StorageLocation } from '@/types/database';
import { ApiError } from '@/lib/api-error';

export async function getStorage(client: SupabaseClient<Database>, cellarId: string): Promise<CellarStorage> {
  const { data: fridges, error } = await client.from('cellar_fridges').select('*').eq('cellar_id', cellarId).order('name');
  if (error) throw error;
  const locations: StorageLocation[] = [];
  for (let start = 0; ; start += 1000) {
    const result = await client.from('cellar_storage_locations').select('*').eq('cellar_id', cellarId).order('label').range(start, start + 999);
    if (result.error) throw result.error;
    locations.push(...result.data);
    if (result.data.length < 1000) break;
  }
  return { fridges, locations };
}

export function storageError(error: { code?: string; message: string } | null) {
  if (!error) return;
  if (error.code === '42501') throw new ApiError(403, 'Only the cellar owner can manage wine fridges.');
  if (error.code === 'P0002') throw new ApiError(404, 'Wine fridge not found.');
  if (error.code === '22023') throw new ApiError(400, error.message);
  if (error.code === '23505') throw new ApiError(409, 'That fridge or location name already exists. Choose another name.');
  if (error.code === '23503') throw new ApiError(409, 'Move the wines out of these levels before removing them.');
  throw error;
}
