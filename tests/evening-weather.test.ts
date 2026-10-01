import test from 'node:test';
import assert from 'node:assert/strict';
import { eveningLocation, loadEveningWeather, localTimeIn, parseWeather, searchWeatherPlaces } from '../lib/evening-weather';
import { locateEvening } from '../utils/evening-location';
import { createReserveHandler, createWeatherPlacesHandler } from '../lib/ai/reserve-endpoint';
import { personalSommelier } from '../lib/ai/personal-sommelier';
import { ApiError } from '../lib/api-error';
import { buildPalate, DEFAULT_PALATE } from '../lib/palate';
import type { Wine } from '../types/wine';
import type { WeatherContext } from '../types/evening-context';

const weatherData = () => ({ timezone: 'America/Toronto', current: { time: Math.floor(Date.now() / 1000), temperature_2m: 8, apparent_temperature: 5, precipitation: 0.8, wind_speed_10m: 12, weather_code: 61, is_day: 1 }, current_units: { temperature_2m: '°C', apparent_temperature: '°C', precipitation: 'mm', wind_speed_10m: 'km/h' } });
const signal = () => new AbortController().signal;
const wine = (id: string, props: Partial<Wine> = {}): Wine => ({ id, bottle: `Brunello ${id}`, country: 'Italy', region: 'Montalcino', vintage: 2016, style: 'Red', grapes: 'Sangiovese', quantity: 1, status: 'in_cellar', drinkingWindow: '2024–2035', peakYear: 2026, consumedDate: null, foodPairingNotes: '', mealToHaveWithThisWine: '', notes: '', rating: null, price: null, location: '', ...props });
const wines = [wine('now'), wine('other'), wine('gone', { status: 'consumed', inMyJournal: true, myRating: 94 })];
const profile = buildPalate(wines, DEFAULT_PALATE);
const input = (extra: Record<string, unknown> = {}) => ({ cellarId: 'cellar-a', occasion: 'unwind', scene: 'Mushroom risotto, staying in', location: { mode: 'none' }, timezone: 'America/Toronto', ...extra });
const req = (body = input(), options: RequestInit = {}) => new Request('https://flint.test/api/ai/reserve', { method: 'POST', headers: { origin: 'https://flint.test', 'Content-Type': 'application/json' }, body: JSON.stringify(body), ...options });
const access = async (id: string) => ({ cellar: { id, locale: 'en' as const }, userId: 'user-a', load: async () => ({ wines, profile }) });
const recommendation = (wineId = 'now') => ({ type: 'recommendation' as const, wineId, reason: 'A savoury red for the risotto.', title: 'A little comfort', meal: 'Mushroom risotto.', conversationQuestion: 'Your favourite rainy-day meal?', journalEvidenceIds: [], servingTemperature: '16°C', decanting: 'Taste first.', bottle: 'Brunello', language: 'en' as const, wine: { region: '', vintage: 2016, location: '', bottle_image: undefined }, maturityNote: 'near_peak' as const, evidence: [], alternatives: [], adventurousAlternative: null });

// Use a real service result type so endpoint stubs cannot quietly diverge from the provider contract.
const recommend = async (): Promise<Awaited<ReturnType<typeof personalSommelier>>> => recommendation();

test('location validation rounds coordinates, rejects malformed input and ignores extra client weather', () => {
  assert.deepEqual(eveningLocation({ mode: 'coordinates', latitude: 43.6532, longitude: -79.3832, weather: 'sunny' }), { mode: 'coordinates', latitude: 43.7, longitude: -79.4 });
  for (const v of [null, { mode: 'coordinates', latitude: NaN, longitude: 0 }, { mode: 'coordinates', latitude: 91, longitude: 0 }, { mode: 'coordinates', latitude: '43', longitude: 0 }, { mode: 'city', placeId: -1 }]) assert.throws(() => eveningLocation(v));
  assert.equal(localTimeIn('not/a/timezone'), null);
});

test('browser geolocation is approximate, denied permission continues without weather, cancellation ignores late callbacks', async () => {
  let success!: PositionCallback;
  let failure!: PositionErrorCallback;
  const geo = { getCurrentPosition: (yes: PositionCallback, no: PositionErrorCallback) => { success = yes; failure = no; } } as Geolocation;
  const pending = locateEvening(signal(), geo);
  success({ coords: { latitude: 43.6532, longitude: -79.3832 } } as GeolocationPosition);
  assert.deepEqual(await pending, { mode: 'coordinates', latitude: 43.7, longitude: -79.4 });
  const denied = locateEvening(signal(), geo); failure({ code: 1 } as GeolocationPositionError);
  assert.deepEqual(await denied, { mode: 'none' });
  const controller = new AbortController(); const cancelled = locateEvening(controller.signal, geo); controller.abort();
  await assert.rejects(cancelled, { name: 'AbortError' });
  success({ coords: { latitude: 10, longitude: 10 } } as GeolocationPosition);
});

test('weather parsing rejects stale data, bad units, missing values and unknown WMO codes', () => {
  assert.equal(parseWeather(weatherData(), null).status, 'available');
  const missing = weatherData(); delete (missing.current as Partial<typeof missing.current>).precipitation;
  const old = weatherData(); old.current.time -= 10800;
  const units = weatherData(); units.current_units.temperature_2m = '°F';
  const unknown = weatherData(); unknown.current.weather_code = 900;
  for (const bad of [null, {}, missing, old, units, unknown]) assert.equal(parseWeather(bad, null).status, 'unavailable');
});

test('weather lookup uses rounded coordinates and returns only safe context; optional/no weather makes no provider call', async () => {
  let calls = 0;
  const fetcher: typeof fetch = async url => {
    calls++; const parsed = new URL(String(url));
    assert.equal(parsed.hostname, 'api.open-meteo.com');
    assert.equal(parsed.searchParams.get('latitude'), '43.7'); assert.equal(parsed.searchParams.get('longitude'), '-79.4');
    return Response.json({ ...weatherData(), latitude: 43.6532, longitude: -79.3832 });
  };
  const result = await loadEveningWeather({ mode: 'coordinates', latitude: 43.6532, longitude: -79.3832 }, signal(), fetcher);
  assert.equal(result.status, 'available'); assert.doesNotMatch(JSON.stringify(result), /latitude|longitude|43.6532/);
  await loadEveningWeather({ mode: 'none' }, signal(), fetcher); assert.equal(calls, 1);
  assert.deepEqual(await loadEveningWeather({ mode: 'coordinates', latitude: 0, longitude: 0 }, signal(), async () => { throw Error('down'); }), { status: 'unavailable' });
  const controller = new AbortController(); controller.abort();
  await assert.rejects(loadEveningWeather({ mode: 'coordinates', latitude: 0, longitude: 0 }, controller.signal, async (_, init) => { init?.signal?.throwIfAborted(); return Response.json({}); }), { name: 'AbortError' });
});

test('manual search preserves choices, returns no coordinates, and resolves selected city ID server-side', async () => {
  const cities = [{ id: 1, name: 'London', country: 'Canada', admin1: 'Ontario', latitude: 42.98, longitude: -81.25 }, { id: 2, name: 'London', country: 'United Kingdom', latitude: 51.5, longitude: -0.12 }];
  const results = await searchWeatherPlaces('London', 'en', signal(), async () => Response.json({ results: cities }));
  assert.deepEqual(results, [{ id: 1, label: 'London, Ontario, Canada' }, { id: 2, label: 'London, United Kingdom' }]);
  const urls: URL[] = [];
  const result = await loadEveningWeather({ mode: 'city', placeId: 1 }, signal(), async url => { urls.push(new URL(String(url))); return Response.json(urls.length === 1 ? cities[0] : weatherData()); });
  assert.equal(urls[0].searchParams.get('id'), '1'); assert.equal(urls[1].searchParams.get('latitude'), '43');
  assert.equal(result.status === 'available' && result.place, 'London, Ontario, Canada');
});

test('reserve authorization precedes all inventory, weather and AI work; reject cross-origin/oversized requests', async () => {
  let calls = 0;
  const handler = createReserveHandler(async () => { throw new ApiError(403, 'No access'); }, { weather: async () => { calls++; return { status: 'skipped' }; }, recommend: async () => { calls++; return recommend(); } });
  assert.equal((await handler(req())).status, 403); assert.equal(calls, 0);
  assert.equal((await handler(req(input(), { headers: { origin: 'https://foreign.test' } }))).status, 403);
  assert.equal((await handler(req(input({ scene: 'x'.repeat(5000) })))).status, 413);
  assert.equal((await handler(req(input({ location: { mode: 'coordinates', latitude: 100, longitude: 0 } })))).status, 400);
});

test('reserve uses fresh authorized stock, own profile, server weather and excludes previous pick', async () => {
  let received: Parameters<typeof personalSommelier>[0] | undefined;
  const weather = parseWeather(weatherData(), 'Toronto');
  const handler = createReserveHandler(access, { weather: async () => weather, recommend: async context => { received = context; return recommendation('other'); } });
  const response = await handler(req(input({ avoidWineId: 'now', weather: { condition: 'hot sunshine' }, wines: [wine('forged')] })));
  assert.equal(response.status, 200);
  const data = await response.json(); assert.equal(data.cellarId, 'cellar-a'); assert.equal(data.plan.wineId, 'other');
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  assert.deepEqual(received!.wines.map(w => w.id), ['other', 'gone']); assert.equal(received!.profile, profile);
  assert.deepEqual(received!.evening!.weather, weather); assert.ok(received!.signal);
  assert.equal((await handler(req())).status, 429);
});

test('reserve rejects foreign/sold out picks and does not invent a fallback when AI cannot recommend', async () => {
  for (const id of ['foreign', 'gone']) {
    const handler = createReserveHandler(access, { weather: async () => ({ status: 'skipped' }), recommend: async () => recommendation(id) });
    assert.equal((await handler(req())).status, 502);
  }
  const handler = createReserveHandler(access, { weather: async () => ({ status: 'unavailable' }), recommend: async () => ({ type: 'answer', answer: 'No suitable bottle.', question: '', language: 'en' }) });
  const result = await handler(req()); assert.equal(result.status, 409); assert.equal((await result.json()).error, 'No suitable bottle.');
});

test('cancelled request does not start AI, and city lookup requires cellar authorization', async () => {
  let called = false;
  const controller = new AbortController();
  const handler = createReserveHandler(access, { weather: async () => { controller.abort(); return { status: 'skipped' }; }, recommend: async () => { called = true; return recommend(); } });
  assert.equal((await handler(req(input(), { signal: controller.signal }))).status, 504); assert.equal(called, false);
  const places = createWeatherPlacesHandler(async () => { throw new ApiError(403, 'No access'); }, async () => { called = true; return []; });
  assert.equal((await places(req(input({ query: 'Toronto' })))).status, 403); assert.equal(called, false);
});

test('evening model prompt gets weather and clock without coordinates; shared API receives cancellation', async t => {
  const previousKey = process.env.OPENAI_API_KEY; process.env.OPENAI_API_KEY = 'test-only';
  const controller = new AbortController();
  try {
    t.mock.method(globalThis, 'fetch', async (_url: unknown, init: RequestInit) => {
      const sent = JSON.parse(String(init.body));
      assert.match(sent.messages[0].content, /soft cue, never a categorical ban/);
      assert.match(sent.messages[0].content, /do not claim a temperature/);
      assert.match(sent.messages[1].content, /"status":"unavailable"/);
      assert.doesNotMatch(sent.messages[1].content, /latitude|longitude/);
      controller.abort(); assert.equal(init.signal?.aborted, true);
      throw new DOMException('Cancelled', 'AbortError');
    });
    await assert.rejects(personalSommelier({ wines, profile, locale: 'en', messages: [{ role: 'user', content: 'Surprise me' }], evening: { occasion: 'unwind', scene: '', weather: { status: 'unavailable' }, localTime: null }, signal: controller.signal }), { name: 'AbortError' });
  } finally { if (previousKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previousKey; }
});
