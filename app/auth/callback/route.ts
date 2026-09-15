import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requestOrigin } from '@/lib/auth/request';
import { safeRedirect } from '@/lib/auth/redirect';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get('code');
  const tokenHash = params.get('token_hash');
  const type = params.get('type');
  try {
    const supabase = createClient();
    const result = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : tokenHash && (type === 'invite' || type === 'recovery')
        ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
        : null;
    if (result && !result.error) {
      const next = type === 'invite' || type === 'recovery' ? '/reset-password' : safeRedirect(params.get('next'));
      return NextResponse.redirect(new URL(next, requestOrigin(request)));
    }
  } catch { /* Show the same expired-link message for all failed callbacks. */ }
  return NextResponse.redirect(new URL('/login?error=invalid_link', requestOrigin(request)));
}
