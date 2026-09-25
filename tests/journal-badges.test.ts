import test from 'node:test';
import assert from 'node:assert/strict';
import { CELLAR_ESSENTIALS } from '../data/cellar-essentials';
import { JOURNAL_BADGES } from '../data/journal-badges';
import { getJournalBadgeAwards, getNewJournalBadgeAwards } from '../lib/journal-badges';
import type { Wine } from '../types/wine';

const wine = (props: Partial<Wine> = {}): Wine => ({
  id: 'brunello', bottle: 'Campogiovanni Brunello di Montalcino', country: 'Italy', region: 'Tuscany', vintage: 2012,
  drinkingWindow: '', peakYear: '', style: 'Red', grapes: 'Sangiovese', foodPairingNotes: '',
  mealToHaveWithThisWine: '', status: 'consumed', consumedDate: '2026-09-02', notes: '',
  rating: null, price: null, location: '', quantity: 0, inMyJournal: true, ...props,
});
const ids = (wines: Wine[]) => getJournalBadgeAwards(wines).map(award => award.badge.id);

test('every essential has one unique bilingual badge; discoveries stay separate', () => {
  const essentials = JOURNAL_BADGES.filter(badge => badge.family === 'essential');
  assert.deepEqual(essentials.map(badge => badge.id), CELLAR_ESSENTIALS.map(essential => `essential:${essential.id}`));
  assert.equal(new Set(JOURNAL_BADGES.map(badge => badge.id)).size, JOURNAL_BADGES.length);
  assert.equal(JOURNAL_BADGES.filter(badge => badge.family === 'discovery').length, 5);
  for (const badge of JOURNAL_BADGES) {
    assert.ok(badge.name.en && badge.name.pt && badge.description.en && badge.description.pt, badge.id);
  }
});

test('one Brunello earns overlapping essential and Tuscany badges, never Super Tuscan', () => {
  assert.deepEqual(ids([wine()]), ['essential:brunello', 'discovery:tuscany']);
  const repeated = wine({ id: 'another', vintage: 2016, consumedDate: '2026-09-25', myRating: 100, quantity: 12 });
  assert.deepEqual(getNewJournalBadgeAwards([wine()], [wine(), repeated]), []);
  const awards = getJournalBadgeAwards([repeated, wine(), wine()]);
  assert.equal(awards.length, 2);
  assert.deepEqual(awards[0].matchingWineIds, ['brunello', 'another']);
});

test('only personal participation earns badges; inventory, scores and quantity do not grant them', () => {
  const invalid = [
    wine({ id: 'someone-else', inMyJournal: false, myRating: 100 }),
    wine({ id: 'unknown', inMyJournal: undefined, rating: 100 }),
    ...(['in_cellar', 'sold', 'gifted'] as const).map(status => wine({ id: status, status })),
  ];
  assert.deepEqual(getJournalBadgeAwards(invalid), []);
  const external = wine({ id: 'restaurant', quantity: 0, fromCellar: false, myRating: null });
  const poorRating = wine({ id: 'zero-score', quantity: 0, myRating: 0 });
  assert.deepEqual(ids([external]), ['essential:brunello', 'discovery:tuscany']);
  assert.deepEqual(ids([poorRating]), ids([external]));
  assert.deepEqual(getNewJournalBadgeAwards(invalid, [...invalid, external]).map(award => award.badge.id), ids([external]));
});

test('backfill selects earliest valid recorded tasting with stable ID ties without mutating data', () => {
  const earliestB = wine({ id: 'b', consumedDate: '2025-01-01', bottle: 'Earlier Brunello' });
  const earliestA = wine({ ...earliestB, id: 'a' });
  const recent = wine({ id: 'recent', consumedDate: '2026-01-01' });
  const undated = wine({ id: 'missing', consumedDate: null });
  const impossible = wine({ id: 'impossible', consumedDate: '2024-02-30' });
  const input = [recent, earliestB, undated, impossible, earliestA];
  const original = structuredClone(input);
  const result = getJournalBadgeAwards(input);
  assert.equal(result[0].wineId, 'a');
  assert.equal(result[0].earnedOn, '2025-01-01');
  assert.deepEqual(result[0].matchingWineIds, ['a', 'b', 'recent', 'impossible', 'missing']);
  assert.deepEqual(getJournalBadgeAwards([...input].reverse()), result);
  assert.deepEqual(input, original);
  assert.deepEqual(getNewJournalBadgeAwards([recent], input), []);
});

test('unknown, ambiguous and impossible dates still earn badges without fabricating an earned date', () => {
  for (const consumedDate of [null, '', 'unknown', '09/02/2026', '2026-02-30', '2025-02-29', '2026-13-01']) {
    const awards = getJournalBadgeAwards([wine({ consumedDate })]);
    assert.equal(awards.length, 2);
    assert.equal(awards[0].earnedOn, null, String(consumedDate));
  }
  for (const consumedDate of ['2024-02-29', '2026-09-02T19:30:00Z', '2026-09-02T15:30:00-04:00']) {
    assert.equal(getJournalBadgeAwards([wine({ consumedDate })])[0].earnedOn, consumedDate);
  }
});

test('Super Tuscan identification requires Italy, red and specific evidence, not Tuscan geography or Sangiovese', () => {
  const matches = (props: Partial<Wine>) => ids([wine(props)]).includes('discovery:super-tuscan');
  for (const bottle of ['Tenuta San Guido Sassicaia', 'Antinori Tignanello', 'Estate Super Tuscan', 'Estate Supertuscan']) {
    assert.ok(matches({ bottle, region: 'Tuscany', vintage: 2021 }), bottle);
  }
  assert.ok(matches({ bottle: 'Antinori Tignanello', region: 'Chianti Classico', vintage: 2021 }));
  assert.ok(matches({ bottle: 'Supertoscano', country: 'Itália', style: 'Vinho tinto' }));
  for (const props of [
    { bottle: 'Brunello di Montalcino' },
    { bottle: 'Chianti Classico Riserva' },
    { bottle: 'Tenuta Tignanello Chianti Classico Riserva' },
    { bottle: 'Toscana IGT Sangiovese' },
    { bottle: 'Bolgheri Cabernet Sauvignon', region: 'Bolgheri' },
    { bottle: 'Antinori Tignanello', vintage: 1970 },
    { bottle: 'Tignanello', region: 'Piedmont' },
    { bottle: 'Super Tuscan', country: 'United States' },
    { bottle: 'Super Tuscan', style: 'White' },
    { bottle: 'Brunello Super Tuscan' },
    { bottle: 'Example', notes: 'Reminds me of a Super Tuscan' },
  ]) assert.equal(matches(props), false, JSON.stringify(props));
});

test('Bordeaux discovery includes generic Bordeaux, both banks and sweet wines, with country checks', () => {
  for (const region of ['Bordeaux', 'Haut-Médoc', 'Pauillac', 'Saint-Émilion', 'Pomerol', 'Entre-deux-Mers']) {
    assert.ok(ids([wine({ bottle: 'Château Example', country: 'França', region })]).includes('discovery:bordeaux'), region);
  }
  assert.ok(ids([wine({ bottle: 'Château Example', country: 'France', region: 'Sauternes', style: 'Sweet' })]).includes('discovery:bordeaux'));
  assert.equal(ids([wine({ country: 'United States', bottle: 'Bordeaux blend', region: 'Napa' })]).includes('discovery:bordeaux'), false);
  assert.equal(ids([wine({ country: 'France', bottle: 'Château Example', region: 'Burgundy' })]).includes('discovery:bordeaux'), false);
});

test('Loire and volcanic discoveries use recorded origins, including accent variants', () => {
  const loire = wine({ bottle: 'Les Ardoisières', region: 'Anjou', country: 'France', style: 'White', grapes: 'Chenin Blanc' });
  assert.ok(ids([loire]).includes('discovery:loire'));
  assert.equal(ids([{ ...loire, region: 'Pouilly-Fuissé' }]).includes('discovery:loire'), false);
  assert.equal(ids([{ ...loire, country: 'Canada' }]).includes('discovery:loire'), false);
  const etna = wine({ bottle: 'Etna Rosso', region: 'Sicilia', grapes: 'Nerello Mascalese' });
  assert.deepEqual(ids([etna]), ['essential:etna-rosso', 'discovery:volcanic']);
  const santorini = wine({ bottle: 'Assyrtiko', country: 'Grécia', region: 'Santorini', style: 'White', grapes: 'Assyrtiko' });
  assert.deepEqual(ids([santorini]), ['essential:assyrtiko', 'discovery:volcanic']);
  assert.equal(ids([{ ...etna, country: 'Spain' }]).includes('discovery:volcanic'), false);
});

test('metadata corrections and participation updates recalculate awards and only announce newly earned styles', () => {
  const tasting = wine({ bottle: 'Estate red', region: '', grapes: 'Sangiovese' });
  const after = [wine()];
  assert.deepEqual(getNewJournalBadgeAwards([tasting], after).map(award => award.badge.id), ids(after));
  assert.deepEqual(getNewJournalBadgeAwards(after, [{ ...after[0], myRating: 99 }]), []);
  assert.deepEqual(getNewJournalBadgeAwards(after, []), []);
  assert.deepEqual(getJournalBadgeAwards([{ ...after[0], inMyJournal: false }]), []);
  assert.deepEqual(getNewJournalBadgeAwards([], [wine({ inMyJournal: false })]), []);
});
