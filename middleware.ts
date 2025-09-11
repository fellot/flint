import { NextRequest, NextResponse } from 'next/server';

// Paths that should bypass the PIN gate
const PUBLIC_PATHS = [
  '/pin',
  '/api/pin',
  '/favicon.ico',
];

function isBypassedPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith('/_next')) return true; // Next.js assets
  if (pathname.startsWith('/public')) return true; // static assets
  if (/\.(?:png|jpg|jpeg|svg|webp|gif|ico|txt|json|map|css|js)$/i.test(pathname)) return true;
  return false;
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hashBuffer);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  // If no PIN is configured, allow all (avoids lockout in dev)
  const pin = process.env.SITE_PIN || '';
  const salt = process.env.PIN_SALT || 'flint-static-salt';
  if (!pin) {
    return NextResponse.next();
  }

  if (isBypassedPath(pathname)) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get('pin_auth')?.value || '';
  const expected = await sha256Hex(pin + ':' + salt);

  if (cookie && cookie === expected) {
    return NextResponse.next();
  }

  // Not authenticated: redirect to /pin with redirect target
  const redirectUrl = new URL('/pin', req.url);
  redirectUrl.searchParams.set('redirect', pathname + (url.search || ''));
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ['/((?!_next|public|favicon.ico).*)'],
};

