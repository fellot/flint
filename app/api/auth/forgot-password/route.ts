import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiError, ApiError, checkOrigin } from '@/lib/api-error';

export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    const { email } = await request.json();
    if (typeof email !== 'string' || !email.trim()) throw new ApiError(400, 'Enter your email address.');
    let supabase;
    try { supabase = createClient(); } catch { throw new ApiError(503, 'Sign-in is not configured yet.'); }
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) throw new ApiError(503, 'Password recovery is not configured yet.');
    const redirectTo = new URL('/auth/callback?next=/reset-password', siteUrl).toString();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    if (error) throw new ApiError(400, 'Unable to send a reset link. Please try again later.');
    return NextResponse.json({ message: 'If an account exists for that email, a reset link is on its way.' });
  } catch (error) { return apiError(error); }
}
