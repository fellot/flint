import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSessionContext, selectCellar, setCellarCookie } from '@/lib/auth/session';
import { apiError } from '@/lib/api-error';
import { avatarFromMetadata } from '@/lib/sommelier-avatar';

export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const { user, cellars } = await getSessionContext();
    const cellar = cellars.length ? selectCellar(cellars, null, cookies().get('data_source')?.value) : null;
    if (cellar) setCellarCookie(cellar.id);
    return NextResponse.json({ user: { id: user.id, email: user.email, sommelierAvatar: avatarFromMetadata(user.user_metadata) }, cellars, cellar }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return apiError(error); }
}
