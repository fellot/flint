import { NextRequest, NextResponse } from 'next/server';
import { requireCellar } from '@/lib/auth/session';
import { apiError, checkOrigin } from '@/lib/api-error';
import { fridgeId, fridgeInput } from '@/lib/storage-data';
import { getStorage, storageError } from '@/lib/dal/storage';
import { listWines } from '@/lib/dal/wines';
import { withJournal } from '@/lib/dal/journal';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };

export async function GET(request: NextRequest) {
  try {
    const { supabase, cellar } = await requireCellar(request.nextUrl.searchParams.get('dataSource'));
    return NextResponse.json(await getStorage(supabase, cellar.id), { headers });
  } catch (error) { return apiError(error); }
}

async function mutate(request: NextRequest, remove: boolean) {
  try {
    checkOrigin(request);
    const { supabase, cellar, user } = await requireCellar(request.nextUrl.searchParams.get('dataSource'));
    const body = await request.json();
    if (remove) {
      const { error } = await supabase.rpc('delete_cellar_fridge', { p_cellar_id: cellar.id, p_id: fridgeId(body?.id) });
      storageError(error);
    } else {
      const input = fridgeInput(body);
      const { error } = await supabase.rpc('save_cellar_fridge', { p_cellar_id: cellar.id, p_name: input.name, p_level_count: input.levelCount, p_first_level: input.firstLevel, ...(input.id ? { p_id: input.id } : {}) });
      storageError(error);
    }
    const storage = await getStorage(supabase, cellar.id);
    const wines = await withJournal(supabase, cellar.id, user.id, await listWines(supabase, cellar.id));
    return NextResponse.json({ ...storage, wines }, { headers });
  } catch (error) { return apiError(error); }
}
export const POST = (request: NextRequest) => mutate(request, false);
export const DELETE = (request: NextRequest) => mutate(request, true);
