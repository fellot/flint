import { NextRequest, NextResponse } from 'next/server';
import { requireCellar, setCellarCookie } from '@/lib/auth/session';
import { apiError, ApiError, checkOrigin } from '@/lib/api-error';

export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    const { cellarId } = await request.json();
    if (typeof cellarId !== 'string') throw new ApiError(400, 'Choose a cellar.');
    const { cellar } = await requireCellar(cellarId);
    setCellarCookie(cellar.id);
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
