import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseConfig } from '@/lib/supabase/config';
import { requestOrigin } from '@/lib/auth/request';
import { PUBLIC_PAGES } from '@/lib/auth/redirect';

const publicRoutes = [...PUBLIC_PAGES, '/auth/callback', '/api/auth/login', '/api/auth/forgot-password', '/api/auth/logout', '/api/pin'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isPublic = publicRoutes.includes(pathname);
  let response = NextResponse.next({ request });
  let configuration;
  try { configuration = getSupabaseConfig(); } catch {
    if (isPublic) return response;
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Supabase is not configured yet.' }, { status: 503 });
    return NextResponse.redirect(new URL('/login', requestOrigin(request)));
  }
  const supabase = createServerClient(configuration.url, configuration.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: values => {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !isPublic) {
    const target = new URL('/login', requestOrigin(request));
    target.searchParams.set('redirect', pathname + request.nextUrl.search);
    const denied = pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Please sign in to continue.' }, { status: 401 })
      : NextResponse.redirect(target);
    // Preserve refreshed/cleared session cookies on redirects and API errors.
    response.cookies.getAll().forEach(cookie => denied.cookies.set(cookie));
    response = denied;
  }
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|favicon.svg|images/).*)'],
};
