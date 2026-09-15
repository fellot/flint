import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { apiError, ApiError, checkOrigin } from '@/lib/api-error';

export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    const { password } = await request.json();
    if (typeof password !== 'string' || password.length < 8) throw new ApiError(400, 'Use at least 8 characters.');
    const { supabase } = await requireUser();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new ApiError(400, 'Unable to update your password. Use a different password or request a new reset link.');
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
