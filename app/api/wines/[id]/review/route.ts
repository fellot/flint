import { NextRequest, NextResponse } from 'next/server';
import { requireCellar } from '@/lib/auth/session';
import { apiError, checkOrigin } from '@/lib/api-error';
import { saveReview } from '@/lib/dal/journal';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    checkOrigin(request);
    const { supabase, cellar, user } = await requireCellar(request.nextUrl.searchParams.get('dataSource'));
    const saved = await saveReview(supabase, cellar.id, user.id, params.id, await request.json());
    return NextResponse.json(saved, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return apiError(error); }
}
