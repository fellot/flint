import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();
    const pins = [
      { value: process.env.SITE_PIN || '', dataSource: '1' },
      { value: process.env.SITE_PIN_2 || '', dataSource: '2' },
      { value: process.env.SITE_PIN_3 || '', dataSource: '3' },
    ];
    const salt = process.env.PIN_SALT || 'flint-static-salt';

    if (!pins.some(p => p.value)) {
      return NextResponse.json({ error: 'PIN not configured' }, { status: 500 });
    }

    // Determine which PIN was entered
    const matched = pins.find(p => p.value && String(pin) === p.value);
    if (!pin || !matched) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    const matchedPin = matched.value;
    const dataSource = matched.dataSource;

    const token = crypto.createHash('sha256').update(`${matchedPin}:${salt}`).digest('hex');
    const cookieOptions = {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    };
    const res = NextResponse.json({ ok: true, dataSource });
    res.cookies.set('pin_auth', token, cookieOptions);
    res.cookies.set('data_source', dataSource, {
      ...cookieOptions,
      httpOnly: false, // client-side JS needs to read this
    });
    return res;
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

