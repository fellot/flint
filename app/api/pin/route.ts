import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'PIN login has been retired. Sign in at /login with your email and password.' }, { status: 410 });
}
