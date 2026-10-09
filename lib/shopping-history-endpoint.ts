import { NextResponse } from 'next/server';
import { apiError, ApiError, checkOrigin } from '@/lib/api-error';
import { historyOffset, isUuid } from '@/lib/shopping-history';
import type { BuyerHistory } from '@/lib/dal/shopping-history';

export function createHistoryHandler(authorize: (cellarId: string) => Promise<BuyerHistory>) {
  return async (request: Request, id?: string) => {
    try {
      const url = new URL(request.url), cellarId = url.searchParams.get('cellarId');
      if (!cellarId || cellarId.length > 200 || id !== undefined && !isUuid(id)) throw new ApiError(400, 'Choose a cellar and a valid conversation.');
      if (request.method !== 'GET') checkOrigin(request);
      const history = await authorize(cellarId);
      if (request.method === 'GET') {
        const offset = historyOffset(url.searchParams.get('offset'));
        return NextResponse.json(id ? await history.get(id, offset) : await history.list(offset), { headers: { 'Cache-Control': 'private, no-store' } });
      }
      if (request.method !== 'PATCH' || !id) throw new ApiError(405, 'Method not allowed.');
      const raw = await request.text();
      if (raw.length > 1000) throw new ApiError(413, 'Keep the conversation title short.');
      const body = JSON.parse(raw);
      if (typeof body?.title !== 'string' || !body.title.trim() || body.title.length > 120) throw new ApiError(400, 'Use a title of 1–120 characters.');
      await history.rename(id, body.title.trim());
      return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'private, no-store' } });
    } catch (error) { return apiError(error); }
  };
}
