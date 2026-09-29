import { NextRequest, NextResponse } from 'next/server';
import { requireCellar } from '@/lib/auth/session';
import { loadPalate } from '@/lib/dal/palate';
import { personalSommelier } from '@/lib/ai/personal-sommelier';
import { apiError, ApiError, checkOrigin } from '@/lib/api-error';
import { isOccasion, occasionPicks, parseEveningPlan } from '@/utils/reserve';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
// Best-effort per-instance cooldown, not a distributed rate limit.
const recentRequests = new Map<string, number>();

export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    const raw = await request.text();
    if (raw.length > 2048) throw new ApiError(413, 'The evening description is too long.');
    const body = JSON.parse(raw);
    if (!body || !isOccasion(body.occasion) || typeof body.scene !== 'string' || body.scene.length > 240
      || typeof body.cellarId !== 'string' || body.cellarId.length > 200) throw new ApiError(400, 'Choose an occasion and a short description.');
    const { supabase, cellar, user } = await requireCellar(body.cellarId);
    const now = Date.now();
    recentRequests.forEach((time, key) => { if (now - time >= 10000) recentRequests.delete(key); });
    if (recentRequests.has(user.id)) throw new ApiError(429, 'Give us a moment before planning another evening.');
    recentRequests.set(user.id, now);
    const { wines, profile } = await loadPalate(supabase, cellar.id, user.id);
    const candidates = occasionPicks(wines, body.occasion, new Date().getFullYear());
    const response = await personalSommelier({
      wines: [...candidates, ...wines.filter(w => w.status === 'consumed')], profile, locale: cellar.locale,
      messages: [{ role: 'user', content: 'Plan this evening using the supplied occasion and scene.' }],
      evening: { occasion: body.occasion, scene: body.scene },
    });
    if (response.type !== 'recommendation') throw new ApiError(409, response.answer || response.question || 'No available bottles fit this evening.');
    const plan = parseEveningPlan({ ...response, question: response.conversationQuestion }, candidates);
    if (!plan) throw new ApiError(502, 'We could not make a plan from those bottles.');
    return NextResponse.json({ plan: { ...plan, evidence: response.evidence } }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) return apiError(new ApiError(504, 'The planner took too long. Your cellar picks are still available.'));
    return apiError(error);
  }
}
