import { NextRequest, NextResponse } from 'next/server';
import { requireCellar } from '@/lib/auth/session';
import { apiError, ApiError, checkOrigin } from '@/lib/api-error';
import { getPeople } from '@/lib/dal/journal';
import { personInput } from '@/lib/journal-data';
import { invitationClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { supabase, cellar, user } = await requireCellar(request.nextUrl.searchParams.get('dataSource'));
    return NextResponse.json(await getPeople(supabase, cellar.id, user.id), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    const { supabase, cellar, user } = await requireCellar(request.nextUrl.searchParams.get('dataSource'));
    const roster = await getPeople(supabase, cellar.id, user.id);
    if (!roster.isOwner) throw new ApiError(403, 'Only the cellar owner can manage people.');
    const body = await request.json();
    const input = personInput(body);
    const existing = roster.people.find(person => person.email === input.email);
    const admin = invitationClient();
    const { data: person, error } = await supabase.rpc('save_cellar_person', {
      p_cellar_id: cellar.id, p_name: input.name, p_email: input.email,
      ...(existing ? { p_person_id: existing.id } : {}), p_allow_pending: Boolean(admin),
    });
    if (error?.code === '22023') throw new ApiError(400, error.message);
    if (error?.code === '23505') throw new ApiError(409, 'This account is already in the cellar.');
    if (error) throw error;
    let invitationSent = false;
    let warning = '';
    if (!person.user_id) {
      if (!admin) throw new ApiError(503, 'Invitations are not configured. Ask the site administrator to enable them.');
      const redirectTo = new URL('/auth/callback?next=/reset-password', process.env.NEXT_PUBLIC_SITE_URL!).toString();
      const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(input.email, { data: { name: input.name }, redirectTo });
      invitationSent = !inviteError;
      if (inviteError) {
        // Preserve the pending entry so the owner can retry explicitly. Never
        // report successful email delivery when Auth rejected the request.
        console.error('Cellar invitation failed:', inviteError.code || inviteError.status);
        warning = 'Access is pending, but the invitation could not be sent. Retry the invitation or use the sign-in page’s password reset for an existing account.';
      }
    }
    return NextResponse.json({ ...(await getPeople(supabase, cellar.id, user.id)), invitationSent, warning }, { status: 201 });
  } catch (error) { return apiError(error); }
}
