import test from 'node:test';
import assert from 'node:assert/strict';
import type { Wine } from '../types/wine';
import { occasionPicks, localEvening, parseEveningPlan, windowNote } from '../utils/reserve';
const wine = (id: string, props: Partial<Wine> = {}): Wine => ({
  id, bottle: `Wine ${id}`, country: 'France', region: 'Burgundy', vintage: 2020,
  drinkingWindow: '2024–2030', peakYear: 2027, style: 'Red', grapes: 'Pinot Noir',
  foodPairingNotes: '', mealToHaveWithThisWine: '', status: 'in_cellar', consumedDate: null,
  notes: '', rating: null, price: null, location: '', quantity: 1, ...props,
});

test('occasion picks exclude unavailable stock and reserve dessert wines for the sweet occasion', () => {
  const wines = [wine('red'), wine('sweet', { style: 'Sweet' }), wine('empty', { quantity: 0 }), wine('drank', { status: 'consumed' }), wine('gift', { status: 'gifted' }), wine('sold', { status: 'sold' })];
  assert.deepEqual(occasionPicks(wines, 'dinner', 2026).map(w => w.id), ['red']);
  assert.deepEqual(occasionPicks(wines, 'dessert', 2026).map(w => w.id), ['sweet']);
  assert.deepEqual(occasionPicks([wine('only-red')], 'dessert', 2026), []);
});

test('readiness outranks future bottles, celebration favors bubbles and input order is untouched', () => {
  const wines = [wine('future', { drinkingWindow: '2035–2045', peakYear: 2040, style: 'Sparkling' }), wine('ready'), wine('bubbles', { style: 'Sparkling' })];
  const before = [...wines];
  assert.deepEqual(occasionPicks(wines, 'celebrate', 2026).map(w => w.id), ['bubbles', 'ready', 'future']);
  assert.deepEqual(wines, before);
});

test('local planning distinguishes past, future and missing drinking windows without invented peak claims', () => {
  assert.match(windowNote(wine('old', { drinkingWindow: '2015–2020' }), 2026, 'en'), /Beyond/);
  assert.match(windowNote(wine('young', { drinkingWindow: '2030–2040' }), 2026, 'en'), /starts in 2030/);
  assert.match(windowNote(wine('unknown', { drinkingWindow: '' }), 2026, 'en'), /not confirmed/);
  assert.match(windowNote(wine('ready'), 2026, 'pt'), /Dentro/);
  const local = localEvening(wine('meal', { mealToHaveWithThisWine: 'My recorded meal.' }), 'company', 2026, 'en');
  assert.equal(local.meal, 'My recorded meal.');
  assert.equal(local.wineId, 'meal');
});

test('generated plans reject foreign or consumed IDs, malformed fields and excessive output', () => {
  const inventory = [wine('mine'), wine('consumed', { status: 'consumed' })];
  const plan = { wineId: 'mine', title: 'A quiet evening.', reason: 'From your cellar.', meal: 'Roast mushrooms.', question: 'Where next?' };
  assert.deepEqual(parseEveningPlan(plan, inventory), plan);
  for (const invalid of [null, [], { ...plan, wineId: 'another-cellar' }, { ...plan, wineId: 'consumed' }, { ...plan, title: '' }, { ...plan, reason: 'x'.repeat(401) }, { ...plan, meal: 7 }]) assert.equal(parseEveningPlan(invalid, inventory), null);
  assert.equal(parseEveningPlan(plan, [wine('mine', { quantity: 0 })]), null);
});
