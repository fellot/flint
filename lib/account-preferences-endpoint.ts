import { NextResponse } from 'next/server';
import { apiError, ApiError, checkOrigin } from './api-error';
import { isSommelierAvatar, SOMMELIER_AVATAR_KEY } from './sommelier-avatar';

type AccountAccess = () => Promise<{
  supabase: { auth: { updateUser: (attributes: { data: Record<string, string> }) => PromiseLike<{
    data: { user: { user_metadata?: unknown } | null }; error: unknown;
  }> } };
}>;

export function createAccountPreferencesHandler(authorize: AccountAccess) {
  return async (request: Request) => {
    try {
      checkOrigin(request);
      const { supabase } = await authorize();
      const raw = await request.text();
      if (raw.length > 1024) throw new ApiError(413, 'The configuration request is too large.');
      const body: unknown = JSON.parse(raw);
      if (!body || typeof body !== 'object' || Array.isArray(body)
        || Object.keys(body).length !== 1 || !('sommelierAvatar' in body)
        || !isSommelierAvatar(body.sommelierAvatar)) {
        throw new ApiError(400, 'Choose one of the available sommelier avatars.');
      }
      // updateUser acts only on the signed-in account. Send a single metadata
      // field: Supabase merges it without rewriting unrelated profile settings.
      const { data, error } = await supabase.auth.updateUser({ data: { [SOMMELIER_AVATAR_KEY]: body.sommelierAvatar } });
      const metadata = data.user?.user_metadata;
      const stored = metadata && typeof metadata === 'object' && !Array.isArray(metadata)
        ? (metadata as Record<string, unknown>)[SOMMELIER_AVATAR_KEY] : undefined;
      if (error || stored !== body.sommelierAvatar) {
        throw new ApiError(503, 'Unable to save your avatar. Please try again.');
      }
      return NextResponse.json({ sommelierAvatar: body.sommelierAvatar }, { headers: { 'Cache-Control': 'private, no-store' } });
    } catch (error) { return apiError(error); }
  };
}
