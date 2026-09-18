import type { Wine } from '@/types/wine';
import type { WineRow, WineWrite } from '@/types/database';
import { sanitizeBottleImage } from '@/utils/sanitizeWine';
import { parseCriticRatings, highestCriticScore } from '@/utils/critic-ratings';

export class WineValidationError extends Error {}

export function wineInput(body: unknown, partial = false): Partial<WineWrite> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new WineValidationError('Expected a wine object.');
  const input = body as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  const strings = {
    bottle: 'bottle', country: 'country', region: 'region', drinkingWindow: 'drinking_window',
    foodPairingNotes: 'food_pairing_notes', mealToHaveWithThisWine: 'meal_suggestion',
    style: 'style', grapes: 'grapes', notes: 'notes', location: 'location',
  };
  for (const [key, column] of Object.entries(strings)) {
    if (partial && !(key in input)) continue;
    const value = input[key] ?? '';
    if (typeof value !== 'string') throw new WineValidationError(`${key} must be text.`);
    if (['bottle', 'country', 'style'].includes(key) && !value.trim()) throw new WineValidationError(`${key} is required.`);
    output[column] = value;
  }
  for (const [key, fallback, max] of [['vintage', 0, 9999], ['quantity', 1, 2147483647], ['rating', null, 100], ['price', null, Number.MAX_SAFE_INTEGER]] as const) {
    if (partial && !(key in input)) continue;
    const value = input[key] ?? fallback;
    if (value !== null && (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max || (['vintage', 'quantity'].includes(key) && !Number.isInteger(value)))) {
      throw new WineValidationError(`${key} must be a valid non-negative ${['vintage', 'quantity'].includes(key) ? 'integer' : 'number'}.`);
    }
    output[key] = value;
  }
  if (!partial || 'peakYear' in input) {
    const peak = input.peakYear ?? '';
    if ((typeof peak !== 'number' && typeof peak !== 'string') || (typeof peak === 'number' && !Number.isFinite(peak))) throw new WineValidationError('peakYear must be a year or maturity note.');
    output.peak_year = String(peak);
  }
  if (!partial || 'status' in input) {
    const status = input.status ?? 'in_cellar';
    if (!['in_cellar', 'consumed', 'sold', 'gifted'].includes(String(status))) throw new WineValidationError('Invalid wine status.');
    output.status = status;
  }
  for (const [key, column, fallback] of [['fromCellar', 'from_cellar', true], ['coravin', 'coravin', false]] as const) {
    if (partial && !(key in input)) continue;
    const value = input[key] ?? fallback;
    if (typeof value !== 'boolean') throw new WineValidationError(`${key} must be true or false.`);
    output[column] = value;
  }
  for (const [key, column] of [['consumedDate', 'consumed_date'], ['coravinDate', 'coravin_date']] as const) {
    if (partial && !(key in input)) continue;
    const value = input[key] === '' ? null : input[key] ?? null;
    if (value !== null && (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)) throw new WineValidationError(`${key} must be a valid date (YYYY-MM-DD).`);
    output[column] = value;
  }
  for (const [key, column] of [['technical_sheet', 'technical_sheet_url'], ['bottle_image', 'bottle_image_url']] as const) {
    if (partial && !(key in input)) continue;
    const value = input[key];
    if (value != null && typeof value !== 'string') throw new WineValidationError(`${key} must be a URL.`);
    output[column] = sanitizeBottleImage(value as string | undefined) ?? null;
  }
  // Only mapped fields reach Postgres. Client-supplied IDs and ownership are ignored.
  return output as Partial<WineWrite>;
}

export function newWineInput(body: unknown): WineWrite {
  return wineInput(body) as WineWrite;
}

export function rowToWine(row: WineRow): Wine {
  const criticRatings = parseCriticRatings(row.critic_ratings);
  const criticRating = highestCriticScore({ criticRatings, criticRating: row.critic_rating == null ? null : Number(row.critic_rating) });
  return {
    id: row.id, bottle: row.bottle, country: row.country, region: row.region, vintage: row.vintage,
    drinkingWindow: row.drinking_window,
    peakYear: /^\d+$/.test(row.peak_year) ? Number(row.peak_year) : row.peak_year,
    foodPairingNotes: row.food_pairing_notes, mealToHaveWithThisWine: row.meal_suggestion,
    style: row.style, grapes: row.grapes, status: row.status, consumedDate: row.consumed_date,
    notes: row.notes, rating: row.rating === null ? null : Number(row.rating),
    criticRating, criticRatings,
    price: row.price === null ? null : Number(row.price), location: row.location, quantity: row.quantity,
    technical_sheet: row.technical_sheet_url ?? undefined, bottle_image: row.bottle_image_url ?? undefined,
    fromCellar: row.from_cellar, coravin: row.coravin, coravinDate: row.coravin_date,
  };
}

export function filterWines(wines: Wine[], params: URLSearchParams) {
  const search = params.get('search')?.toLowerCase();
  return wines.filter(wine => {
    for (const key of ['country', 'region', 'style', 'vintage', 'status'] as const) {
      const value = params.get(key);
      if (value && value !== 'all' && String(wine[key]) !== value) return false;
    }
    if (params.get('coravin') === 'yes' && !wine.coravin) return false;
    return !search || [wine.bottle, wine.country, wine.region, wine.grapes, wine.foodPairingNotes, wine.mealToHaveWithThisWine, wine.notes].some(value => value.toLowerCase().includes(search));
  });
}
