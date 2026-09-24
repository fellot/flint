import test from 'node:test';
import assert from 'node:assert/strict';
import { getShoppingCoverage } from '../lib/cellar-shopping';
import { getEssentialMatches } from '../lib/cellar-essentials';
import type { Wine } from '../types/wine';

const wine = (props: Partial<Wine> = {}): Wine => ({
  id: 'bottle', bottle: 'Example wine', country: 'France', region: 'Saint-Émilion', vintage: 2020,
  drinkingWindow: '', peakYear: '', style: 'Red', grapes: '', foodPairingNotes: '',
  mealToHaveWithThisWine: '', status: 'in_cellar', consumedDate: null, notes: '',
  rating: null, price: null, location: '', quantity: 1, ...props,
});
const malbec = (props: Partial<Wine> = {}) => wine({ country: 'Argentina', region: 'Mendoza, Uco Valley', grapes: 'Malbec', ...props });

test('shopping coverage counts current records with positive stock and preserves personal journal coverage', () => {
  const current = wine({ id: 'current', quantity: 3 });
  const own = wine({ id: 'own', status: 'consumed', inMyJournal: true, quantity: 0, myRating: 0, fromCellar: false });
  const excluded = [
    wine({ quantity: 0 }), wine({ quantity: -1 }),
    wine({ status: 'sold' }), wine({ status: 'gifted' }),
    wine({ status: 'consumed', inMyJournal: false, myRating: 99 }),
    wine({ status: 'consumed', rating: 98 }),
  ];
  const input = [current, own, ...excluded];
  const before = structuredClone(input);
  assert.deepEqual(getShoppingCoverage('bordeaux-right', input), { status: 'in-cellar', cellarCount: 1, journalCount: 1 });
  assert.deepEqual(getShoppingCoverage('bordeaux-right', [own, ...excluded]), { status: 'in-journal', cellarCount: 0, journalCount: 1 });
  assert.deepEqual(getShoppingCoverage('bordeaux-right', excluded), { status: 'unmatched', cellarCount: 0, journalCount: 0 });
  assert.deepEqual(input, before);
});

test('loading or unavailable inventory never reports a gap or stale coverage', () => {
  for (const wines of [[], [wine()], [malbec({ grapes: 'Malbec, Cabernet Franc' })]]) {
    assert.deepEqual(getShoppingCoverage('bordeaux-right', wines, false), { status: 'unknown', cellarCount: 0, journalCount: 0 });
  }
  assert.deepEqual(getShoppingCoverage('bordeaux-right', []), { status: 'unmatched', cellarCount: 0, journalCount: 0 });
});

test('shopping excludes the verified Cabernet Franc-led Gran Enemigo vintage without changing the essentials guide', () => {
  const bottle = malbec({ bottle: 'Gran Enemigo Gualtallary', vintage: 2019, grapes: 'Cabernet Franc, Malbec' });
  assert.equal(getEssentialMatches('mendoza-malbec', [bottle]).length, 1);
  assert.deepEqual(getShoppingCoverage('mendoza-malbec', [bottle]), { status: 'unmatched', cellarCount: 0, journalCount: 0 });
  assert.equal(getShoppingCoverage('mendoza-malbec', [{ ...bottle, status: 'consumed', inMyJournal: true }]).status, 'unmatched');
  assert.equal(getShoppingCoverage('mendoza-malbec', [{ ...bottle, vintage: 2020 }]).status, 'check-blend');
});

test('pure Malbec and an explicit Malbec majority establish the shopping reference', () => {
  for (const grapes of ['Malbec', '95% Malbec, 5% Sémillon', 'Malbec 95%, Sémillon 5%', 'Malbec (100%)']) {
    assert.deepEqual(getShoppingCoverage('mendoza-malbec', [malbec({ grapes })]), { status: 'in-cellar', cellarCount: 1, journalCount: 0 }, grapes);
  }
  for (const grapes of ['85% Cabernet Franc, 15% Malbec', 'Cabernet Franc 85%, Malbec 15%', 'Malbec 50%, Cabernet Franc 50%']) {
    assert.equal(getShoppingCoverage('mendoza-malbec', [malbec({ grapes })]).status, 'unmatched', grapes);
  }
});

test('ambiguous blends request a composition check without inventing coverage or a gap', () => {
  for (const grapes of ['Malbec, Cabernet Franc', 'Cabernet Franc, Malbec', 'Malbec 150%', 'Malbec 60%; Malbec 40%']) {
    assert.deepEqual(getShoppingCoverage('mendoza-malbec', [malbec({ grapes })]), { status: 'check-blend', cellarCount: 0, journalCount: 0 }, grapes);
  }
  assert.equal(getShoppingCoverage('mendoza-malbec', [malbec({ bottle: 'Example Malbec', grapes: '' })]).status, 'check-blend');
  const uncertain = malbec({ grapes: 'Malbec, Cabernet Franc' });
  const tasted = malbec({ status: 'consumed', inMyJournal: true, quantity: 0, myRating: null });
  assert.equal(getShoppingCoverage('mendoza-malbec', [uncertain, tasted]).status, 'in-journal');
  assert.equal(getShoppingCoverage('mendoza-malbec', [uncertain, tasted, malbec()]).status, 'in-cellar');
  assert.equal(getShoppingCoverage('mendoza-malbec', [{ ...uncertain, status: 'consumed', inMyJournal: false }]).status, 'unmatched');
});

test('shopping retains the essentials origin, style and country requirements', () => {
  for (const props of [{ country: 'Chile' }, { region: 'Patagonia' }, { style: 'White' }]) {
    assert.equal(getShoppingCoverage('mendoza-malbec', [malbec(props)]).status, 'unmatched');
  }
  assert.equal(getShoppingCoverage('unknown', [wine()]).status, 'unmatched');
});
