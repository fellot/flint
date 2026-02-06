import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();
    const pin1 = process.env.SITE_PIN || '';
    const pin2 = process.env.SITE_PIN_2 || '';
    const salt = process.env.PIN_SALT || 'flint-static-salt';

    if (!pin1 && !pin2) {
      return NextResponse.json({ error: 'PIN not configured' }, { status: 500 });
    }

    // Determine which PIN was entered
    let matchedPin = '';
    let dataSource: '1' | '2' = '1';
    if (pin && String(pin) === pin1) {
      matchedPin = pin1;
      dataSource = '1';
    } else if (pin && pin2 && String(pin) === pin2) {
      matchedPin = pin2;
      dataSource = '2';
    } else {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }

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

