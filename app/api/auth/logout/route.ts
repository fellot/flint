import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { apiError, checkOrigin } from '@/lib/api-error';

export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    const { error } = await createClient().auth.signOut({ scope: 'local' });
    if (error) throw error;
    cookies().delete('pin_auth');
    cookies().delete('data_source');
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
