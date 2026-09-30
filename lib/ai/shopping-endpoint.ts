import { NextResponse } from 'next/server';
import { ApiError, apiError, checkOrigin } from '@/lib/api-error';
import type { PalateProfile } from '@/types/palate';
import type { Wine } from '@/types/wine';
import { shoppingAdvisor, shoppingInput } from '@/lib/ai/shopping-advisor';

type ShoppingAccess = { cellar: { id: string; name: string; locale: 'en' | 'pt' }; userId: string; load: () => Promise<{ wines: Wine[]; profile: PalateProfile }> };

export function createShoppingHandler(authorize: (cellarId: string) => Promise<ShoppingAccess>) {
  // Best-effort per-instance duplicate suppression; not a distributed rate limit.
  const requests = new Map<string, number>();

  return async function POST(request: Request) {
    let requestKey: string | undefined;
    try {
      checkOrigin(request);
      const reader = request.body?.getReader();
      if (!reader) throw new ApiError(400, 'Send a shopping request.');
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > 40000) { await reader.cancel(); throw new ApiError(413, 'Please shorten the conversation.'); }
          chunks.push(value);
        }
      } finally { reader.releaseLock(); }
      const input = shoppingInput(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      const { cellar, userId, load } = await authorize(input.cellarId);
      if (cellar.id !== input.cellarId) throw new ApiError(403, 'The selected cellar is not authorized.');
      const now = Date.now();
      requests.forEach((expires, key) => { if (expires <= now) requests.delete(key); });
      if (requests.has(userId)) throw new ApiError(429, 'Please wait before starting another wine search.');
      requestKey = userId;
      requests.set(requestKey, now + 115000);
      const context = await load();
      const reply = await shoppingAdvisor({ input, ...context, locale: cellar.locale, signal: request.signal });
      return NextResponse.json({ ...reply, cellarId: cellar.id, cellarName: cellar.name }, { headers: { 'Cache-Control': 'private, no-store' } });
    } catch (error) {
      if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) return apiError(new ApiError(504, 'Wine research took too long. Try one or two styles at a time.'));
      return apiError(error);
    } finally {
      if (requestKey) requests.set(requestKey, Date.now() + 4000);
    }
  }

}
