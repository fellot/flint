import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCountry, resolveWineOrigin } from '../utils/regionCoordinates';
import { buildWineMap, selectMapWines } from '../lib/wine-map';
import type { Wine } from '../types/wine';

const wine = (values: Partial<Wine> = {}): Wine => ({ id: 'stock', bottle: 'Sample wine', country: 'France', region: 'Chablis', vintage: 2024,
  style: 'White', grapes: 'Chardonnay', status: 'in_cellar', quantity: 2, consumedDate: null, drinkingWindow: '', peakYear: '',
  foodPairingNotes: '', mealToHaveWithThisWine: '', notes: '', rating: null, price: null, location: 'Wine Fridge A - L3', ...values });

test('map defaults to current stock and own journal, including external and zero-quantity tastings', () => {
  const stock = wine(), own = wine({ id: 'own', status: 'consumed', inMyJournal: true, quantity: 0, myRating: 0, fromCellar: false });
  const input = [stock, own, wine({ id: 'other', status: 'consumed', inMyJournal: false, myRating: 95 }), wine({ id: 'empty', quantity: 0 }), wine({ id: 'sold', status: 'sold' }), wine({ id: 'gift', status: 'gifted' })];
  assert.deepEqual(selectMapWines(input), [stock, own]);
  assert.deepEqual(selectMapWines(input, 'cellar'), [stock]);
  assert.deepEqual(selectMapWines(input, 'journal'), [own]);
  assert.equal(selectMapWines([], 'all').length, 0);
  assert.equal(own.myRating, 0);
});

test('map search understands normalized origin text without including fridge location', () => {
  const input = [wine({ country: 'França', region: 'Châteauneuf‑du‑Pape' })];
  assert.equal(selectMapWines(input, 'all', 'chateauneuf du pape').length, 1);
  assert.equal(selectMapWines(input, 'all', 'France').length, 1);
  assert.equal(selectMapWines(input, 'all', 'L3').length, 0);
});

test('country and region matching handles case, accents, punctuation and specific subregions', () => {
  assert.equal(normalizeCountry('  FRANÇA '), 'France');
  assert.equal(normalizeCountry('usa'), 'United States');
  assert.equal(normalizeCountry(' CROATIA '), 'Croatia');
  assert.equal(resolveWineOrigin('frança', 'Châteauneuf‑du‑Pape, Southern Rhône')?.label, 'Châteauneuf-du-Pape');
  assert.equal(resolveWineOrigin('Italy', 'Montalcino, Tuscany')?.label, 'Tuscany (Brunello)');
  assert.equal(resolveWineOrigin('Argentina', 'Agrelo, Luján de Cuyo, Mendoza')?.label, 'Agrelo, Luján de Cuyo (Mendoza)');
  assert.equal(resolveWineOrigin('Canada', 'Niagara-on-the-Lake, Ontario')?.label, 'Niagara-on-the-Lake');
  assert.equal(resolveWineOrigin('France', 'Chablis, Burgundy')?.precision, 'region');
  assert.equal(resolveWineOrigin('Croácia', 'Motovun, Istria')?.precision, 'region');
  assert.equal(resolveWineOrigin('Líbano', 'Bekaa Valley')?.precision, 'region');
});

test('missing or ambiguous origins are honest fallbacks, never precise winery locations', () => {
  for (const region of ['Unknown place', '', 'Bordeaux-style blend', 'Likely Chablis', 'Douro']) {
    assert.equal(resolveWineOrigin('France', region)?.precision, 'country');
  }
  assert.equal(resolveWineOrigin('', 'Bordeaux'), null);
  assert.equal(resolveWineOrigin('Atlantis', 'Douro'), null);
  assert.equal(resolveWineOrigin('France', 'Rioja')?.country, 'France');
});

test('co-located points combine all records and unmapped wines remain in the register', () => {
  const input = [wine(), wine({ id: 'journal', status: 'consumed', quantity: 0, inMyJournal: true, region: 'Chablis, Burgundy' }),
    wine({ id: 'fallback-1', region: 'First unrecognized region' }), wine({ id: 'fallback-2', region: 'Second unrecognized region' }),
    wine({ id: 'unmapped', country: 'Atlantis', region: 'Lost valley' })];
  const data = buildWineMap(selectMapWines(input));
  assert.equal(data.groups.length, 2);
  assert.deepEqual(data.groups.map(g => g.entries.length), [2, 2]);
  assert.equal(data.entries.length, 5); assert.equal(data.unmapped[0].wine.id, 'unmapped');
  assert.equal(data.approximate, 2); assert.equal(data.bottles, 8); assert.equal(data.journal, 1);
  assert.equal(data.countries, 2);
  assert.deepEqual(input.map(w => w.id), ['stock', 'journal', 'fallback-1', 'fallback-2', 'unmapped']);
});

test('a later cellar snapshot has no prior map points and unknown countries never become zero-zero markers', () => {
  assert.equal(buildWineMap(selectMapWines([wine()])).groups.length, 1);
  assert.equal(buildWineMap(selectMapWines([])).groups.length, 0);
  const unknown = buildWineMap(selectMapWines([wine({ country: '', region: '' })]));
  assert.equal(unknown.groups.length, 0); assert.equal(unknown.unmapped.length, 1); assert.equal(unknown.countries, 0);
});
