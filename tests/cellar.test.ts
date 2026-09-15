import test from 'node:test';
import assert from 'node:assert/strict';
import { getMaturity, selectWines } from '../utils/cellar';
import type { Wine, WineFilters } from '../types/wine';

const filters: WineFilters = { search: '', country: 'all', region: 'all', style: 'all', vintage: 'all', status: 'all', coravin: 'all' };
const bottle = (overrides: Partial<Wine>): Wine => ({
  id: '1', bottle: 'A wine', country: 'Portugal', region: 'Douro', vintage: 2020,
  drinkingWindow: '2025–2035', peakYear: 2028, foodPairingNotes: '', mealToHaveWithThisWine: '',
  style: 'Red', grapes: 'Touriga Nacional', status: 'in_cellar', consumedDate: null,
  notes: '', rating: null, price: null, location: 'Shelf 1', quantity: 1, ...overrides,
});
const names = (wines: Wine[]) => wines.map(wine => wine.bottle);

test('column sorting reverses numeric vintages and keeps unknown vintages last', () => {
  const wines = [bottle({ bottle: 'Recent', vintage: 2023 }), bottle({ bottle: 'NV', vintage: 0 }), bottle({ bottle: 'Older', vintage: 2016 })];
  assert.deepEqual(names(selectWines(wines, filters, false, { key: 'vintage', direction: 'asc' }, 2026)), ['Older', 'Recent', 'NV']);
  assert.deepEqual(names(selectWines(wines, filters, false, { key: 'vintage', direction: 'desc' }, 2026)), ['Recent', 'Older', 'NV']);
  assert.deepEqual(names(wines), ['Recent', 'NV', 'Older']);
});

test('peak column handles mixed year values, long aging notes and unknown peaks', () => {
  const wines = [bottle({ bottle: 'Long wait', peakYear: '2040+' }), bottle({ bottle: 'Unknown', peakYear: '' }), bottle({ bottle: 'Near', peakYear: 2028 }), bottle({ bottle: 'Open soon', peakYear: 'Past peak' })];
  assert.deepEqual(names(selectWines(wines, filters, false, { key: 'peak', direction: 'asc' }, 2026)), ['Open soon', 'Near', 'Long wait', 'Unknown']);
  assert.deepEqual(names(selectWines(wines, filters, false, { key: 'peak', direction: 'desc' }, 2026)), ['Long wait', 'Near', 'Open soon', 'Unknown']);
});

test('ratings and cellar locations sort naturally without putting missing ratings first', () => {
  const wines = [bottle({ bottle: 'Unrated', rating: null, location: 'Shelf 10' }), bottle({ bottle: 'Rated', rating: 95, location: 'Shelf 2' }), bottle({ bottle: 'Zero', rating: 0, location: 'Shelf 1' })];
  assert.deepEqual(names(selectWines(wines, filters, false, { key: 'rating', direction: 'asc' }, 2026)), ['Zero', 'Rated', 'Unrated']);
  assert.deepEqual(names(selectWines(wines, filters, false, { key: 'location', direction: 'asc' }, 2026)), ['Zero', 'Rated', 'Unrated']);
});

test('search and filters combine with drinking windows and column sorting', () => {
  const ready = bottle({ bottle: 'Ready bottle', coravin: true });
  const later = bottle({ bottle: 'Later bottle', drinkingWindow: '2030–2040', peakYear: 2035, coravin: true });
  const french = bottle({ bottle: 'French bottle', country: 'France', grapes: 'Pinot noir', coravin: true });
  const selected = selectWines([later, french, ready], { ...filters, country: 'Portugal', search: '  TOURIGA  ', coravin: 'yes' }, true, { key: 'name', direction: 'desc' }, 2026);
  assert.deepEqual(names(selected), ['Ready bottle']);
  assert.equal(getMaturity(ready, 2026), 'ready');
  assert.equal(getMaturity(later, 2026), 'rest');
  assert.equal(getMaturity(bottle({ drinkingWindow: '', peakYear: '2040+' }), 2026), 'rest');
  assert.equal(getMaturity(bottle({ drinkingWindow: '', peakYear: '' }), 2026), 'unknown');
});
