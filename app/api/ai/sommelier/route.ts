import { NextRequest, NextResponse } from 'next/server';
import { requireCellar } from '@/lib/auth/session';
import { apiError, ApiError, checkOrigin } from '@/lib/api-error';
import { loadPalate } from '@/lib/dal/palate';
import { chatInput, personalSommelier } from '@/lib/ai/personal-sommelier';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    const raw = await request.text();
    if (raw.length > 66000) throw new ApiError(413, 'Please shorten the conversation.');
    const body = JSON.parse(raw);
    if (typeof body?.cellarId !== 'string' || body.cellarId.length > 200) throw new ApiError(400, 'Choose a cellar.');
    const { supabase, cellar, user } = await requireCellar(body.cellarId);
    // Rehydrate wine context from the server, not previous generated prose.
    // This also prevents old journal quotations being resent after opting out.
    const messages = chatInput(body.messages).filter(m => m.role === 'user');
    const context = await loadPalate(supabase, cellar.id, user.id);
    const previous = context.wines.find(w => w.id === body.lastWineId);
    if (previous) messages.unshift({ role: 'user', content: `Previous wine discussed: ${JSON.stringify({ id: previous.id, bottle: previous.bottle, vintage: previous.vintage, grapes: previous.grapes, peakYear: previous.peakYear, drinkingWindow: previous.drinkingWindow })}. This is context for follow-up questions, not a request to recommend it.` });
    const response = await personalSommelier({ ...context, locale: cellar.locale, messages });
    return NextResponse.json(response, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) return apiError(new ApiError(504, 'The sommelier took too long. Please try again.'));
    return apiError(error);
  }
}
