import { NextResponse } from 'next/server';
import { ApiError, apiError, checkOrigin } from '@/lib/api-error';
import { eveningLocation, loadEveningWeather, localTimeIn, searchWeatherPlaces } from '@/lib/evening-weather';
import { personalSommelier } from './personal-sommelier';
import { isOccasion, occasionPicks, parseEveningPlan } from '@/utils/reserve';
import type { Wine } from '@/types/wine';
import type { PalateProfile } from '@/types/palate';

type Access = { cellar: { id: string; locale: 'en' | 'pt' }; userId: string; load: () => Promise<{ wines: Wine[]; profile: PalateProfile }> };
type Authorize = (cellarId: string) => Promise<Access>;

async function inputBody(request: Request) {
  checkOrigin(request);
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, 'Send an evening request.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) { await reader.cancel(); throw new ApiError(413, 'Please shorten your request.'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!body || Array.isArray(body) || typeof body.cellarId !== 'string' || !body.cellarId.trim() || body.cellarId.length > 200) throw new ApiError(400, 'Choose a cellar.');
  return body;
}

const privateHeaders = { 'Cache-Control': 'private, no-store' };
export function createReserveHandler(authorize: Authorize, dependencies = { weather: loadEveningWeather, recommend: personalSommelier }) {
  // Best-effort per-instance in-flight guard, not a distributed rate limit.
  const requests = new Map<string, number>();
  return async function POST(request: Request) {
    let userKey: string | undefined;
    try {
      const body = await inputBody(request);
      if (!isOccasion(body.occasion) || typeof body.scene !== 'string' || body.scene.length > 240
        || (body.avoidWineId !== undefined && (typeof body.avoidWineId !== 'string' || body.avoidWineId.length > 200))
        || (body.timezone !== undefined && localTimeIn(body.timezone) === null)) throw new ApiError(400, 'Choose an occasion and a short description.');
      const location = eveningLocation(body.location);
      const { cellar, userId, load } = await authorize(body.cellarId);
      if (cellar.id !== body.cellarId) throw new ApiError(403, 'The selected cellar is not authorized.');
      request.signal.throwIfAborted();
      const now = Date.now();
      requests.forEach((expires, key) => { if (expires <= now) requests.delete(key); });
      if (requests.has(userId)) throw new ApiError(429, 'Please wait a moment before trying another bottle.');
      userKey = userId; requests.set(userKey, now + 60000);
      const { wines, profile } = await load();
      const candidates = occasionPicks(wines, body.occasion, new Date().getFullYear()).filter(w => w.id !== body.avoidWineId);
      if (!candidates.length) throw new ApiError(409, cellar.locale === 'pt' ? 'Nenhuma outra garrafa disponível para esta ocasião. Tente outro clima.' : 'No available bottles fit this selection. Try another mood.');
      const weather = await dependencies.weather(location, request.signal);
      request.signal.throwIfAborted();
      const response = await dependencies.recommend({
        wines: [...candidates, ...wines.filter(w => w.status === 'consumed')], profile, locale: cellar.locale,
        messages: [{ role: 'user', content: 'Surprise me with a thoughtful bottle and evening idea, using the supplied context.' }],
        evening: { occasion: body.occasion, scene: body.scene.trim(), weather, localTime: weather.status === 'available' ? weather.localTime : localTimeIn(body.timezone) },
        signal: request.signal,
      });
      request.signal.throwIfAborted();
      if (response.type !== 'recommendation') throw new ApiError(409, response.answer || response.question || 'No available bottles fit this evening.');
      const plan = parseEveningPlan({ ...response, question: response.conversationQuestion }, candidates);
      if (!plan) throw new ApiError(502, 'We could not make a plan from those bottles.');
      return NextResponse.json({ plan, weather, cellarId: cellar.id }, { headers: privateHeaders });
    } catch (error) {
      if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) return apiError(new ApiError(504, 'The planner took too long. Please try again.'));
      return apiError(error);
    } finally {
      if (userKey) requests.set(userKey, Date.now() + 1500);
    }
  };
}

export function createWeatherPlacesHandler(authorize: Authorize, search = searchWeatherPlaces) {
  return async function POST(request: Request) {
    try {
      const body = await inputBody(request);
      if (typeof body.query !== 'string' || body.query.trim().length < 2 || body.query.length > 100) throw new ApiError(400, 'Enter a city name (2–100 characters).');
      const { cellar } = await authorize(body.cellarId);
      if (cellar.id !== body.cellarId) throw new ApiError(403, 'The selected cellar is not authorized.');
      let places;
      try { places = await search(body.query.trim(), cellar.locale, request.signal); }
      catch { throw new ApiError(503, 'City search is unavailable. Try again or skip weather.'); }
      return NextResponse.json({ places, cellarId: cellar.id }, { headers: privateHeaders });
    } catch (error) { return apiError(error); }
  };
}
