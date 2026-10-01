import { weatherCondition } from '@/utils/weather-condition';
import { ApiError } from '@/lib/api-error';
import type { EveningLocation, WeatherContext, WeatherPlace } from '@/types/evening-context';

const round = (value: number) => Math.round(value * 10) / 10;
const finite = (n: unknown, min: number, max: number): n is number => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;
const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};

export function eveningLocation(value: unknown): EveningLocation {
  const v = record(value);
  if (v.mode === 'none') return { mode: 'none' };
  if (v.mode === 'city' && Number.isSafeInteger(v.placeId) && Number(v.placeId) > 0) return { mode: 'city', placeId: Number(v.placeId) };
  if (v.mode === 'coordinates' && finite(v.latitude, -90, 90) && finite(v.longitude, -180, 180)) {
    return { mode: 'coordinates', latitude: round(v.latitude), longitude: round(v.longitude) };
  }
  throw new ApiError(400, 'Choose a location or skip weather.');
}


export function localTimeIn(timezone: unknown, now = new Date()): string | null {
  if (typeof timezone !== 'string' || timezone.length > 100) return null;
  try { return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, dateStyle: 'full', timeStyle: 'short' }).format(now); }
  catch { return null; }
}

function place(value: unknown) {
  const v = record(value);
  if (!Number.isSafeInteger(v.id) || Number(v.id) <= 0 || typeof v.name !== 'string' || !v.name.trim()
    || !finite(v.latitude, -90, 90) || !finite(v.longitude, -180, 180)) return null;
  const label = Array.from(new Set([v.name, v.admin1, v.country].filter((s): s is string => typeof s === 'string' && !!s.trim()))).join(', ').slice(0, 240);
  return { id: Number(v.id), label, latitude: round(v.latitude), longitude: round(v.longitude) };
}

async function getJson(url: URL, signal: AbortSignal, fetcher: typeof fetch) {
  const response = await fetcher(url, { signal, cache: 'no-store', headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('Weather provider unavailable');
  return response.json();
}

function providerUrl(service: 'api' | 'geocoding-api', path: string, params: Record<string, string>) {
  const key = process.env.OPEN_METEO_API_KEY?.trim();
  const url = new URL(`https://${key ? 'customer-' : ''}${service}.open-meteo.com${path}`);
  url.search = new URLSearchParams({ ...params, ...(key ? { apikey: key } : {}) }).toString();
  return url;
}

export async function searchWeatherPlaces(query: string, locale: 'en' | 'pt', signal: AbortSignal, fetcher: typeof fetch = fetch): Promise<WeatherPlace[]> {
  const url = providerUrl('geocoding-api', '/v1/search', { name: query, count: '5', language: locale, format: 'json' });
  const data = record(await getJson(url, AbortSignal.any([signal, AbortSignal.timeout(5000)]), fetcher));
  if (data.error) throw new Error('Location search unavailable');
  return (Array.isArray(data.results) ? data.results : []).map(place).filter(p => p !== null).map(p => ({ id: p.id, label: p.label }));
}

export function parseWeather(value: unknown, placeName: string | null, now = new Date()): WeatherContext {
  const v = record(value), c = record(v.current), units = record(v.current_units);
  const invalid: WeatherContext = { status: 'unavailable' };
  if (!finite(c.time, 0, 1e12) || Math.abs(now.getTime() - c.time * 1000) > 2 * 60 * 60 * 1000
    || !finite(c.temperature_2m, -100, 65) || !finite(c.apparent_temperature, -120, 85)
    || !finite(c.precipitation, 0, 1000) || !finite(c.wind_speed_10m, 0, 500)
    || typeof c.weather_code !== 'number' || weatherCondition(c.weather_code, 'en') === 'Unknown conditions' || ![0, 1].includes(Number(c.is_day)) || typeof c.is_day !== 'number'
    || units.temperature_2m !== '°C' || units.apparent_temperature !== '°C' || units.precipitation !== 'mm' || units.wind_speed_10m !== 'km/h'
    || typeof v.timezone !== 'string' || !localTimeIn(v.timezone, now)) return invalid;
  return {
    status: 'available', place: placeName, condition: weatherCondition(c.weather_code, 'en'), weatherCode: c.weather_code,
    temperatureC: c.temperature_2m, feelsLikeC: c.apparent_temperature, precipitationMm: c.precipitation, windKmh: c.wind_speed_10m,
    isDay: c.is_day === 1, localTime: localTimeIn(v.timezone, now)!, timezone: v.timezone,
    validAt: new Date(c.time * 1000).toISOString(), checkedAt: now.toISOString(), source: 'Open-Meteo',
  };
}

// No exact coordinates or provider response objects reach the model or browser response.
export async function loadEveningWeather(location: EveningLocation, signal: AbortSignal, fetcher: typeof fetch = fetch): Promise<WeatherContext> {
  if (location.mode === 'none') return { status: 'skipped' };
  const boundedSignal = AbortSignal.any([signal, AbortSignal.timeout(8000)]);
  try {
    let point: { latitude: number; longitude: number };
    let label: string | null = null;
    if (location.mode === 'city') {
      const url = providerUrl('geocoding-api', '/v1/get', { id: String(location.placeId) });
      const found = place(await getJson(url, boundedSignal, fetcher));
      if (!found || found.id !== location.placeId) return { status: 'unavailable' };
      point = found; label = found.label;
    } else point = { latitude: round(location.latitude), longitude: round(location.longitude) };
    const url = providerUrl('api', '/v1/forecast', { latitude: String(point.latitude), longitude: String(point.longitude),
      current: 'temperature_2m,apparent_temperature,precipitation,weather_code,is_day,wind_speed_10m', timezone: 'auto', timeformat: 'unixtime',
      temperature_unit: 'celsius', wind_speed_unit: 'kmh', precipitation_unit: 'mm' });
    return parseWeather(await getJson(url, boundedSignal, fetcher), label);
  } catch (error) {
    if (signal.aborted) throw error;
    return { status: 'unavailable' };
  }
}
