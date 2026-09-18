import test from 'node:test';
import assert from 'node:assert/strict';
import { newWineInput, rowToWine, wineInput } from '../lib/wine-data';
import { parseCriticRatings, highestCriticScore } from '../utils/critic-ratings';
import { selectWines } from '../utils/cellar';
import type { WineFilters } from '../types/wine';

const filters: WineFilters = { search: '', country: 'all', region: 'all', style: 'all', vintage: 'all', status: 'all', coravin: 'all' };
const row = { ...newWineInput({ bottle: 'Rated wine', country: 'France', style: 'Red' }), id: '1', cellar_id: '1', created_at: '', updated_at: '' };
const scores = {
  wine_advocate: { score: 98, display_score: '98+', score_kind: 'plus', verification: 'sourced', source_urls: ['https://example.com/review'] },
  james_suckling: { score: 97, display_score: '95–97', score_kind: 'range', verification: 'sourced', source_urls: ['https://example.com/review-2'] },
};

test('database mapping carries critic labels and sources without substituting historical or personal scores', () => {
  const wine = rowToWine({ ...row, rating: 89, critic_rating: 98, critic_ratings: scores });
  assert.equal(wine.criticRating, 98);
  assert.equal(wine.criticRatings?.wine_advocate?.display_score, '98+');
  assert.equal(wine.criticRatings?.james_suckling?.display_score, '95–97');
  assert.deepEqual(wine.criticRatings?.wine_advocate?.source_urls, ['https://example.com/review']);
  assert.equal(wine.rating, 89);
  assert.equal(wine.myRating, undefined);
  assert.equal(rowToWine({ ...row, rating: 100 }).criticRating, null, 'old deployments and unresearched wines stay unrated by critics');
  assert.deepEqual(wineInput({ criticRating: 1, criticRatings: {}, critic_rating: 1 }, true), {}, 'editing a wine cannot overwrite imported critic data');
});

test('critic sorting uses numeric highest scores, leaves missing values last in both directions and keeps personal rankings independent', () => {
  const high = { ...rowToWine({ ...row, critic_ratings: scores }), bottle: 'High', myRating: 1 };
  const low = { ...high, bottle: 'Low', criticRatings: {}, criticRating: 92, myRating: 100 };
  const missing = { ...rowToWine({ ...row, rating: 100 }), bottle: 'Missing', myRating: 50 };
  const wines = [missing, low, high];
  for (const direction of ['asc', 'desc'] as const) {
    assert.deepEqual(selectWines(wines, filters, false, { key: 'criticRating', direction }, 2026).map(w => w.bottle), direction === 'asc' ? ['Low', 'High', 'Missing'] : ['High', 'Low', 'Missing']);
  }
  assert.deepEqual(selectWines(wines, filters, false, { key: 'myRating', direction: 'desc' }, 2026).map(w => w.bottle), ['Low', 'Missing', 'High']);
});

test('malformed critic metadata fails gracefully and source links only allow HTTP(S)', () => {
  for (const raw of [null, undefined, [], 'broken', { wine_advocate: { score: 101 } }]) assert.deepEqual(parseCriticRatings(raw), {});
  const parsed = parseCriticRatings({ wine_advocate: { score: 0, source_urls: ['javascript:alert(1)', 'https://example.com', null, 'not a url'] } });
  assert.equal(parsed.wine_advocate?.display_score, '0');
  assert.deepEqual(parsed.wine_advocate?.source_urls, ['https://example.com']);
  assert.equal(highestCriticScore({ criticRatings: parsed }), 0);
  assert.equal(highestCriticScore({ criticRating: NaN }), null);
});
