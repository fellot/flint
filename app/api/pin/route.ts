import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();
    const expectedPin = process.env.SITE_PIN || '';
    const salt = process.env.PIN_SALT || 'flint-static-salt';

    if (!expectedPin) {
      return NextResponse.json({ error: 'PIN not configured' }, { status: 500 });
    }

    if (!pin || String(pin) !== expectedPin) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    const token = crypto.createHash('sha256').update(`${expectedPin}:${salt}`).digest('hex');
    const res = NextResponse.json({ ok: true });
    res.cookies.set('pin_auth', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

