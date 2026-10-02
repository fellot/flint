import { NextRequest, NextResponse } from 'next/server';
import { requireCellar } from '@/lib/auth/session';
import { apiError, ApiError, checkOrigin } from '@/lib/api-error';
import { loadPalate, savePalate } from '@/lib/dal/palate';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };

export async function GET(request: NextRequest) {
  try {
    const { supabase, cellar, user } = await requireCellar(request.nextUrl.searchParams.get('cellarId'));
    return NextResponse.json((await loadPalate(supabase, cellar.id, user.id)).profile, { headers });
  } catch (error) { return apiError(error); }
}

export async function PUT(request: NextRequest) {
  try {
    checkOrigin(request);
    const { supabase, cellar, user } = await requireCellar(request.nextUrl.searchParams.get('cellarId'));
    const raw = await request.text();
    if (raw.length > 30000) throw new ApiError(413, 'Your palate notes are too long.');
    await savePalate(supabase, user.id, JSON.parse(raw));
    return NextResponse.json((await loadPalate(supabase, cellar.id, user.id)).profile, { headers });
  } catch (error) { return apiError(error); }
}
