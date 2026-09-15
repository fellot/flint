import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { apiError, ApiError, checkOrigin } from '@/lib/api-error';
import { safeRedirect } from '@/lib/auth/redirect';

export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    const { email, password, redirect } = await request.json();
    if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) throw new ApiError(400, 'Enter your email and password.');
    let supabase;
    try { supabase = createClient(); } catch { throw new ApiError(503, 'Sign-in is not configured yet.'); }
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw new ApiError(error.status === 429 ? 429 : 401, error.status === 429 ? 'Too many attempts. Please try again later.' : 'Unable to sign in. Check your email and password.');
    cookies().delete('pin_auth');
    cookies().delete('data_source');
    return NextResponse.json({ redirect: safeRedirect(typeof redirect === 'string' ? redirect : null) });
  } catch (error) { return apiError(error); }
}
