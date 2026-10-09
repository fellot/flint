import { NextResponse } from 'next/server';
import { ApiError, apiError, checkOrigin } from '@/lib/api-error';
import type { PalateProfile } from '@/types/palate';
import type { Wine } from '@/types/wine';
import { shoppingAdvisor, shoppingInput } from '@/lib/ai/shopping-advisor';
import { SHOPPING_REQUEST_MAX_BYTES, SHOPPING_TEXT_MAX_BYTES } from '@/lib/shopping-attachment';
import { historyInput } from '@/lib/shopping-history';
import type { BuyerHistory } from '@/lib/dal/shopping-history';
import type { ShoppingConversationSummary } from '@/types/shopping';

type ShoppingAccess = { cellar: { id: string; name: string; locale: 'en' | 'pt' }; userId: string; load: () => Promise<{ wines: Wine[]; profile: PalateProfile }>; history?: BuyerHistory };

export function createShoppingHandler(authorize: (cellarId: string) => Promise<ShoppingAccess>) {
  // Best-effort per-instance duplicate suppression; not a distributed rate limit.
  const requests = new Map<string, number>();

  return async function POST(request: Request) {
    let requestKey: string | undefined;
    let saved: ShoppingConversationSummary | undefined;
    let storage: BuyerHistory | undefined;
    let savedTurnId: string | undefined;
    const withHistory = (response: Response) => {
      if (saved) {
        response.headers.set('X-Shopping-Conversation-Id', saved.id);
        response.headers.set('X-Shopping-Conversation-Revision', String(saved.revision));
      }
      return response;
    };
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
          if (size > SHOPPING_REQUEST_MAX_BYTES) { await reader.cancel(); throw new ApiError(413, 'Use one PDF up to 3 MB and a shorter conversation.'); }
          chunks.push(value);
        }
      } finally { reader.releaseLock(); }
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      // The attachment gets its own allowance; it cannot enlarge text/history limits.
      const { attachment: _attachment, ...textBody } = body ?? {};
      if (Buffer.byteLength(JSON.stringify(textBody), 'utf8') > SHOPPING_TEXT_MAX_BYTES) throw new ApiError(413, 'Please shorten the conversation.');
      const input = shoppingInput(body);
      const history = historyInput(body);
      const { cellar, userId, load, history: store } = await authorize(input.cellarId);
      if (cellar.id !== input.cellarId) throw new ApiError(403, 'The selected cellar is not authorized.');
      const now = Date.now();
      requests.forEach((expires, key) => { if (expires <= now) requests.delete(key); });
      if (requests.has(userId)) throw new ApiError(429, 'Please wait before starting another wine search.');
      requestKey = userId;
      requests.set(requestKey, now + 115000);
      if (history) {
        if (!store) throw new ApiError(503, 'Saved conversations are unavailable. Please try again.');
        storage = store;
        const message = input.messages[input.messages.length - 1].content;
        saved = await store.begin({ ...history, message, brief: input.brief, attachmentName: input.attachment?.name });
        savedTurnId = history.turnId;
        // Resume using owned server history. Old assistant prose is never sent to
        // the model, so opt-outs and changed preferences still take effect.
        const previous = await store.context(saved.id);
        const latest = previous[previous.length - 1]?.reply;
        input.messages = [...previous.map(t => ({ role: 'user' as const, content: t.user })), { role: 'user', content: message }];
        input.previousProducts = latest?.products.map(p => ({ name: p.name, url: p.url })) || [];
        input.previousDocumentPicks = input.attachment && latest?.documentName === input.attachment.name
          ? latest.documentPicks?.map(p => ({ name: p.name, page: p.page })) || [] : [];
      }
      const context = await load();
      const reply = await shoppingAdvisor({ input, ...context, locale: cellar.locale, signal: request.signal });
      const result = { ...reply, cellarId: cellar.id, cellarName: cellar.name };
      if (saved && storage && savedTurnId) {
        try { await storage.finish(saved.id, savedTurnId, result, null); }
        catch { result.historyWarning = 'This reply is visible here but could not be saved. Keep this page open to retain it.'; }
      }
      return withHistory(NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } }));
    } catch (error) {
      const failure = error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)
        ? new ApiError(504, 'Wine research took too long. Try one or two styles at a time.') : error;
      const response = apiError(failure);
      if (saved && storage && savedTurnId) {
        try { await storage.finish(saved.id, savedTurnId, null, failure instanceof ApiError ? failure.message.slice(0, 500) : 'Research could not be completed. You can ask again.'); } catch { /* The reserved question remains recoverable as interrupted. */ }
      }
      return withHistory(response);
    } finally {
      if (requestKey) requests.set(requestKey, Date.now() + 4000);
    }
  }

}
