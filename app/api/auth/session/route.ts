import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSessionContext, selectCellar, setCellarCookie } from '@/lib/auth/session';
import { apiError } from '@/lib/api-error';

export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const { user, cellars } = await getSessionContext();
    const cellar = cellars.length ? selectCellar(cellars, null, cookies().get('data_source')?.value) : null;
    if (cellar) setCellarCookie(cellar.id);
    return NextResponse.json({ user: { email: user.email }, cellars, cellar }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return apiError(error); }
}
