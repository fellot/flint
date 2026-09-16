import { NextRequest, NextResponse } from 'next/server';
import { withJournal } from '@/lib/dal/journal';
import { requireCellar } from '@/lib/auth/session';
import { deleteWine, getWine, updateWine } from '@/lib/dal/wines';
import { apiError, checkOrigin } from '@/lib/api-error';

export const dynamic = 'force-dynamic';
type Context = { params: { id: string } };

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const { supabase, cellar, user } = await requireCellar(request.nextUrl.searchParams.get('dataSource'));
    return NextResponse.json((await withJournal(supabase, cellar.id, user.id, [await getWine(supabase, cellar.id, params.id)]))[0], { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return apiError(error); }
}

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    checkOrigin(request);
    const body = await request.json();
    const { supabase, cellar, user } = await requireCellar(request.nextUrl.searchParams.get('dataSource') ?? body?.dataSource);
    return NextResponse.json((await withJournal(supabase, cellar.id, user.id, [await updateWine(supabase, cellar.id, params.id, body)]))[0]);
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    checkOrigin(request);
    const { supabase, cellar, user } = await requireCellar(request.nextUrl.searchParams.get('dataSource'));
    await deleteWine(supabase, cellar.id, params.id);
    return NextResponse.json({ message: 'Wine deleted successfully' });
  } catch (error) { return apiError(error); }
}
