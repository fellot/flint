import { NextRequest, NextResponse } from 'next/server';
import { requireCellar } from '@/lib/auth/session';
import { addWine, listWines } from '@/lib/dal/wines';
import { apiError, checkOrigin } from '@/lib/api-error';
import { withJournal } from '@/lib/dal/journal';
import { filterWines } from '@/lib/wine-data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const { supabase, cellar, user } = await requireCellar(params.get('dataSource'));
    return NextResponse.json(filterWines(await withJournal(supabase, cellar.id, user.id, await listWines(supabase, cellar.id)), params), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    const body = await request.json();
    const { supabase, cellar, user } = await requireCellar(request.nextUrl.searchParams.get('dataSource') ?? body?.dataSource);
    return NextResponse.json((await withJournal(supabase, cellar.id, user.id, [await addWine(supabase, cellar.id, body)]))[0], { status: 201 });
  } catch (error) { return apiError(error); }
}
