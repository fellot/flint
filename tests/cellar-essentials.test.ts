import test from 'node:test';
import assert from 'node:assert/strict';
import type { Wine } from '../types/wine';
import { getEssentialMatches, getEssentialJournalMatches } from '../lib/cellar-essentials';

const wine = (props: Partial<Wine> = {}): Wine => ({
  id: 'bottle', bottle: 'Example wine', country: 'France', region: '', vintage: 2020,
  drinkingWindow: '', peakYear: '', style: 'Red', grapes: '', foodPairingNotes: '',
  mealToHaveWithThisWine: '', status: 'in_cellar', consumedDate: null, notes: '',
  rating: null, price: null, location: '', quantity: 1, ...props,
});
const matched = (id: string, props: Partial<Wine>) => getEssentialMatches(id, [wine(props)]).length === 1;

test('journal matches require personal participation, not consumed status or a score alone', () => {
  const tasting = wine({ id: 'mine', style: 'White', region: 'Chablis', status: 'consumed', inMyJournal: true });
  const other = { ...tasting, id: 'other', inMyJournal: false, myRating: 95 };
  const unknown = { ...tasting, id: 'unknown', inMyJournal: undefined, rating: 99 };
  const notConsumed = (['in_cellar', 'sold', 'gifted'] as const).map(status => ({ ...tasting, id: status, status }));
  assert.deepEqual(getEssentialJournalMatches('chablis', [other, unknown, ...notConsumed, tasting]), [tasting]);
  assert.deepEqual(getEssentialJournalMatches('unknown', [tasting]), []);
});

test('journal includes external and zero-quantity tastings, preserves personal zero and unrated scores', () => {
  const base = wine({ style: 'White', region: 'Chablis', status: 'consumed', inMyJournal: true });
  const zero = { ...base, id: 'zero', quantity: 0, myRating: 0, myComment: 'Not for me', rating: 96 };
  const external = { ...base, id: 'outside', fromCellar: false, myRating: null, rating: 98 };
  const result = getEssentialJournalMatches('chablis', [zero, external]);
  assert.deepEqual(result, [zero, external]);
  assert.equal(result[0].myRating, 0);
  assert.equal(result[1].myRating, null);
  assert.equal(result[1].fromCellar, false);
  assert.equal(result[0], zero);
});

test('a style can have current stock and repeated journal tastings without merging them', () => {
  const current = wine({ id: 'stock', style: 'White', region: 'Chablis', quantity: 2 });
  const older = { ...current, id: 'tasting-1', status: 'consumed' as const, inMyJournal: true, consumedDate: '2026-09-01' };
  const recent = { ...older, id: 'tasting-2', consumedDate: '2026-09-24', myRating: 91 };
  const missingDate = { ...older, id: 'undated', consumedDate: null };
  const badDate = { ...older, id: 'invalid', consumedDate: 'unknown' };
  const input = [missingDate, older, current, badDate, recent];
  const original = structuredClone(input);
  assert.deepEqual(getEssentialMatches('chablis', input), [current]);
  assert.deepEqual(getEssentialJournalMatches('chablis', input), [recent, older, missingDate, badDate]);
  assert.deepEqual(input, original);
});

test('journal matching applies the same origin, grape, style and sweetness rules as active stock', () => {
  const tasting = wine({ country: 'Germany', style: 'White', region: 'Mosel', grapes: 'Riesling', status: 'consumed', inMyJournal: true });
  const dry = { ...tasting, id: 'dry', bottle: 'Riesling trocken' };
  const sweet = { ...tasting, id: 'sweet', bottle: 'Riesling feinherb' };
  const wrongCountry = { ...dry, id: 'wrong-country', country: 'Austria' };
  assert.deepEqual(getEssentialJournalMatches('german-riesling', [sweet, wrongCountry, dry]), [dry]);
  assert.deepEqual(getEssentialJournalMatches('chablis', [dry]), []);
});

test('recognizes clear examples of each of the 39 guide styles', () => {
  const examples: [string, string, string, string, string][] = [
    ['barossa-shiraz', 'Red', 'Australia', 'Barossa Valley', 'Shiraz'],
    ['rhone-syrah', 'Red', 'France', 'Côte-Rôtie', ''],
    ['bordeaux-left', 'Red', 'France', 'Pauillac', ''],
    ['bordeaux-right', 'Red', 'France', 'Saint-Émilion', ''],
    ['burgundy-pinot', 'Red', 'France', 'Bourgogne', 'Pinot Noir'],
    ['barolo-barbaresco', 'Red', 'Italy', 'Barbaresco', ''],
    ['brunello', 'Red', 'Italy', 'Brunello di Montalcino', ''],
    ['rioja-red', 'Red', 'Spain', 'Rioja', 'Tempranillo'],
    ['ribera', 'Red', 'Spain', 'Ribera del Duero', 'Tinto Fino'],
    ['mendoza-malbec', 'Red', 'Argentina', 'Uco Valley, Mendoza', 'Malbec'],
    ['napa-cabernet', 'Red', 'USA', 'Napa Valley', 'Cabernet Sauvignon'],
    ['southern-rhone', 'Red', 'France', 'Châteauneuf-du-Pape', 'Grenache, Syrah'],
    ['douro-red', 'Red', 'Portugal', 'Douro', 'Touriga Nacional'],
    ['beaujolais', 'Red', 'France', 'Moulin-à-Vent', ''],
    ['carmenere', 'Red', 'Chile', 'Colchagua', 'Carménère'],
    ['chablis', 'White', 'France', 'Chablis', ''],
    ['cote-beaune', 'White', 'France', 'Puligny-Montrachet', ''],
    ['sancerre-pouilly', 'White', 'France', 'Pouilly-Fumé', ''],
    ['marlborough-sauvignon', 'White', 'New Zealand', 'Marlborough', 'Sauvignon Blanc'],
    ['german-riesling', 'White', 'Germany', 'Nahe Riesling GG', 'Riesling'],
    ['savennieres', 'White', 'France', 'Savennières', ''],
    ['gruner', 'White', 'Austria', 'Wachau', 'Grüner Veltliner'],
    ['albarino', 'White', 'Spain', 'Rías Baixas', 'Albariño'],
    ['assyrtiko', 'White', 'Greece', 'Santorini', 'Assyrtiko'],
    ['champagne', 'Sparkling', 'France', 'Champagne Brut', ''],
    ['franciacorta', 'Sparkling', 'Italy', 'Franciacorta Extra Brut', ''],
    ['cava', 'Sparkling', 'Spain', 'Cava Brut Nature', ''],
    ['provence-rose', 'Rosé', 'France', 'Côtes de Provence', ''],
    ['bandol-rose', 'Rosé', 'France', 'Bandol', ''],
    ['fino-manzanilla', 'Fortified', 'Spain', 'Jerez Fino', 'Palomino'],
    ['amontillado-oloroso', 'Fortified', 'Spain', 'Jerez Oloroso', 'Palomino'],
    ['sauternes', 'Sweet', 'France', 'Barsac', ''],
    ['tokaji', 'Sweet', 'Hungary', 'Tokaji Aszú', ''],
    ['port', 'Fortified', 'Portugal', 'Porto Vintage', ''],
    ['icewine', 'Sweet', 'Canada', 'Niagara Icewine', 'Vidal'],
    ['etna-rosso', 'Red', 'Italy', 'Etna Rosso', ''],
    ['hunter-semillon', 'White', 'Australia', 'Hunter Valley', 'Sémillon'],
    ['white-rioja', 'White', 'Spain', 'Rioja Reserva', 'Viura'],
    ['vin-jaune', 'White', 'France', 'Jura Vin Jaune', ''],
  ];
  assert.equal(examples.length, 39);
  for (const [id, style, country, region, grapes] of examples) {
    assert.equal(matched(id, { style, country, region, grapes }), true, id);
  }
});

test('requires available stock and preserves order and bottle objects', () => {
  const base = { country: 'Australia', region: 'Barossa Valley', grapes: 'Shiraz' };
  const first = wine({ ...base, id: 'first' });
  const last = wine({ ...base, id: 'last', quantity: 2 });
  const input = [first, ...(['consumed', 'sold', 'gifted'] as const).map(status => wine({ ...base, status })),
    wine({ ...base, quantity: 0 }), wine({ ...base, quantity: -1 }), last];
  const before = structuredClone(input);
  const result = getEssentialMatches('barossa-shiraz', input);
  assert.deepEqual(result, [first, last]);
  assert.equal(result[0], first);
  assert.deepEqual(input, before);
  assert.deepEqual(getEssentialMatches('unknown', input), []);
  assert.deepEqual(getEssentialMatches('constructor', input), []);
});

test('region, grape, country and style must support the match independently', () => {
  const base = { country: 'Australia', region: 'Barossa Valley', grapes: 'Shiraz' };
  for (const change of [{ region: 'McLaren Vale' }, { grapes: 'Cabernet Sauvignon' }, { country: 'South Africa' }, { style: 'White' }, { country: '' }, { region: '' }, { style: '' }]) {
    assert.equal(matched('barossa-shiraz', { ...base, ...change }), false, JSON.stringify(change));
  }
  assert.equal(matched('chablis', { style: 'White', region: 'Burgundy', grapes: 'Chardonnay' }), false);
  assert.equal(matched('sancerre-pouilly', { style: 'White', region: 'Pouilly-Fuissé', grapes: 'Chardonnay' }), false);
  assert.equal(matched('rhone-syrah', { region: 'Châteauneuf-du-Pape', grapes: 'Syrah' }), false);
  assert.equal(matched('southern-rhone', { style: 'White', region: 'Châteauneuf-du-Pape', grapes: 'Grenache Blanc' }), false);
});

test('generic Bordeaux and blend ratios do not establish a bank', () => {
  for (const id of ['bordeaux-left', 'bordeaux-right']) {
    for (const grapes of ['Cabernet Sauvignon 80%, Merlot 20%', 'Merlot 80%, Cabernet Franc 20%']) {
      assert.equal(matched(id, { region: 'Bordeaux', grapes }), false);
    }
  }
  assert.equal(matched('bordeaux-right', { region: 'Pauillac' }), false);
  assert.equal(matched('bordeaux-left', { region: 'Pomerol' }), false);
  assert.equal(matched('bordeaux-left', { region: 'Left Bank of the Loire' }), false);
  assert.equal(matched('bordeaux-right', { region: 'Bordeaux, rive droite' }), true);
});

test('red, white and rosé versions of an origin do not leak across categories', () => {
  assert.equal(matched('white-rioja', { country: 'Spain', style: 'Red', region: 'Rioja', grapes: 'Tempranillo, Viura' }), false);
  assert.equal(matched('rioja-red', { country: 'Spain', style: 'White', region: 'Rioja', grapes: 'Tempranillo Blanco' }), false);
  assert.equal(matched('bandol-rose', { style: 'Red', region: 'Bandol' }), false);
  assert.equal(matched('sancerre-pouilly', { style: 'Rosé', region: 'Sancerre' }), false);
  assert.equal(matched('douro-red', { country: 'Portugal', style: 'Fortified', region: 'Douro', grapes: 'Touriga Nacional' }), false);
});

test('dry Riesling needs a dry designation; conflicting sweetness always wins', () => {
  const base = { country: 'Germany', style: 'White', region: 'Mosel', grapes: 'Riesling' };
  for (const bottle of ['Riesling', 'Riesling Kabinett', 'Riesling Spätlese', 'Riesling Auslese', 'Riesling feinherb', 'Riesling halbtrocken', 'Riesling Trockenbeerenauslese', 'Riesling GG demi-sec', 'Riesling dry semi-sweet']) {
    assert.equal(matched('german-riesling', { ...base, bottle }), false, bottle);
  }
  for (const bottle of ['Riesling Trocken', 'Riesling Spätlese trocken', 'Riesling GG', 'Riesling Grosses Gewächs', 'Riesling Großes Gewächs']) {
    assert.equal(matched('german-riesling', { ...base, bottle }), true, bottle);
  }
  assert.equal(matched('german-riesling', { ...base, bottle: 'Riesling GG', style: 'Sweet' }), false);
  assert.equal(matched('savennieres', { style: 'White', region: 'Savennières', bottle: 'Moelleux' }), false);
  assert.equal(matched('savennieres', { style: 'White', region: 'Vouvray', bottle: 'Demi-sec', grapes: 'Chenin Blanc' }), false);
  assert.equal(matched('amontillado-oloroso', { country: 'Spain', style: 'Fortified', region: 'Jerez', bottle: 'Oloroso Cream' }), false);
});

test('accents, punctuation, Portuguese metadata and grapes named on a bottle are supported', () => {
  assert.equal(matched('cote-beaune', { style: 'Branco', country: 'França', region: 'Puligny–Montrachet' }), true);
  assert.equal(matched('bordeaux-right', { style: 'Tinto', country: 'França', bottle: 'Château Test — Saint-Émilion Grand Cru' }), true);
  assert.equal(matched('marlborough-sauvignon', { style: 'Vinho branco', country: 'Nova Zelândia', region: 'Marlborough', bottle: 'Estate Sauvignon Blanc' }), true);
  assert.equal(matched('mendoza-malbec', { country: 'Argentina', region: 'Luján de Cuyo', bottle: 'Reserva Malbec' }), true);
});

test('regional substyles require the specific benchmark rather than its wider family', () => {
  assert.equal(matched('barossa-shiraz', { country: 'Australia', region: 'Eden Valley, Barossa Zone', grapes: 'Shiraz' }), false);
  for (const region of ['Beaujolais', 'Beaujolais Villages', 'Beaujolais Nouveau']) {
    assert.equal(matched('beaujolais', { region, grapes: 'Gamay' }), false, region);
  }
  assert.equal(matched('beaujolais', { region: 'Morgon', bottle: 'Nouveau', grapes: 'Gamay' }), false);
  assert.equal(matched('provence-rose', { style: 'Rosé', region: 'Bandol, Provence' }), false);
  assert.equal(matched('bandol-rose', { style: 'Rosé', region: 'Bandol, Provence' }), true);
});

test('traditional white Rioja requires an explicit ageing indication', () => {
  const base = { style: 'White', country: 'Spain', region: 'Rioja', grapes: 'Viura' };
  for (const bottle of ['Viura', 'Joven', 'Unoaked', 'Reserva sin barrica']) {
    assert.equal(matched('white-rioja', { ...base, bottle }), false, bottle);
  }
  for (const bottle of ['Gran Reserva', 'Crianza', 'Oak-aged Viura', 'Viura aged in barrel']) {
    assert.equal(matched('white-rioja', { ...base, bottle }), true, bottle);
  }
});

test('Port only matches recorded Vintage or Tawny examples', () => {
  const base = { style: 'Fortified', country: 'Portugal', region: 'Porto' };
  for (const bottle of ['Port', 'Ruby', 'White Port', 'LBV', 'Late Bottled Vintage', 'White Tawny', 'Ruby Vintage Character']) {
    assert.equal(matched('port', { ...base, bottle }), false, bottle);
  }
  for (const bottle of ['Vintage Port 2000', '20 Year Old Tawny']) {
    assert.equal(matched('port', { ...base, bottle }), true, bottle);
  }
});

test('sparkling wines require a dry dosage label and reject conflicting sweeter labels', () => {
  for (const [id, country, region] of [['champagne', 'France', 'Champagne'], ['franciacorta', 'Italy', 'Franciacorta'], ['cava', 'Spain', 'Cava']]) {
    const base = { style: 'Sparkling', country, region };
    for (const bottle of ['Example wine', 'Extra Dry', 'Sec', 'Demi-Sec', 'Brut / Extra Dry', 'Brut Demi-sec']) {
      assert.equal(matched(id, { ...base, bottle }), false, `${id}: ${bottle}`);
    }
    for (const bottle of ['Brut', 'Extra Brut', 'Brut Nature', 'Pas Dosé']) {
      assert.equal(matched(id, { ...base, bottle }), true, `${id}: ${bottle}`);
    }
  }
});

test('a named appellation does not override an explicitly contradictory grape', () => {
  const examples: [string, string, string, string, string][] = [
    ['chablis', 'White', 'France', 'Chablis', 'Sauvignon Blanc'],
    ['cote-beaune', 'White', 'France', 'Meursault', 'Aligoté'],
    ['savennieres', 'White', 'France', 'Savennières', 'Chardonnay'],
    ['rhone-syrah', 'Red', 'France', 'Cornas', 'Merlot'],
    ['barolo-barbaresco', 'Red', 'Italy', 'Barolo', 'Barbera'],
    ['brunello', 'Red', 'Italy', 'Brunello di Montalcino', 'Merlot'],
    ['beaujolais', 'Red', 'France', 'Fleurie', 'Pinot Noir'],
    ['vin-jaune', 'White', 'France', 'Jura Vin Jaune', 'Chardonnay'],
  ];
  for (const [id, style, country, region, grapes] of examples) {
    assert.equal(matched(id, { style, country, region, grapes }), false, id);
  }
});
