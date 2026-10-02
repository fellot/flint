import test from 'node:test';
import assert from 'node:assert/strict';
import { GRAPES } from '../data/grapes';
import { FLAVOUR_AXES, GRAPE_FLAVOURS, grapeFlavourProfile } from '../data/grape-flavours';
import { DEFAULT_PALATE, buildPalate } from '../lib/palate';
import { grapeContext } from '../lib/grape-profile';

test('every catalogue grape has a sourced bilingual profile with a complete, bounded wheel', () => {
  assert.deepEqual(Object.keys(GRAPE_FLAVOURS).sort(), GRAPES.map(g => g.id).sort());
  for (const grape of GRAPES) {
    const profile = grapeFlavourProfile(grape.id)!;
    assert.ok(profile, grape.id);
    const axes = FLAVOUR_AXES[profile.wheel];
    assert.equal(profile.levels.length, axes.length, grape.id);
    assert.equal(new Set(axes.map(axis => axis.id)).size, axes.length);
    for (const level of profile.levels) assert.ok(Number.isInteger(level) && level >= 1 && level <= 5, grape.id);
    for (const locale of ['en', 'pt'] as const) {
      for (const text of [profile.aromas, profile.variation, profile.style, ...axes.flatMap(a => [a.label, a.meaning])]) assert.ok(text[locale].trim(), `${grape.id} ${locale}`);
    }
    assert.equal(new URL(profile.source!.url).protocol, 'https:');
    assert.ok(profile.source!.name);
  }
});

test('white and ageing-style wheels do not inherit red-only fruit and tannin categories', () => {
  const whiteAxes = FLAVOUR_AXES[grapeFlavourProfile('riesling')!.wheel].map(a => a.id);
  assert.ok(whiteAxes.includes('citrus'));
  assert.ok(whiteAxes.includes('acidity'));
  assert.ok(!whiteAxes.includes('tannin'));
  assert.ok(!whiteAxes.includes('dark-fruit'));
  const sherryAxes = FLAVOUR_AXES[grapeFlavourProfile('palomino')!.wheel].map(a => a.id);
  assert.ok(sherryAxes.includes('yeasty'));
  assert.ok(sherryAxes.includes('nuts'));
  assert.ok(!sherryAxes.includes('tannin'));
  for (const axes of Object.values(FLAVOUR_AXES)) assert.ok(!axes.some(a => a.id === 'sweetness'));
});

test('grapes commonly encountered in special styles identify the expression shown', () => {
  assert.match(grapeFlavourProfile('palomino')!.style.en, /Fino/);
  assert.match(grapeFlavourProfile('pedro-ximenez')!.style.en, /Sweet PX/);
  assert.match(grapeFlavourProfile('savagnin')!.style.en, /Oxidative Jura/);
  assert.match(grapeFlavourProfile('savagnin')!.variation.en, /not a fortified wine/);
  assert.match(grapeFlavourProfile('pinot-meunier')!.style.en, /Champagne/);
  assert.match(grapeFlavourProfile('corvina')!.variation.en, /Amarone/);
});

test('unknown IDs do not borrow another variety or access object prototypes', () => {
  for (const id of ['', 'unknown', 'Shiraz', 'grenache-gris', '__proto__', 'constructor']) assert.equal(grapeFlavourProfile(id), undefined);
});

test('reading the guide does not manufacture personal evidence or preferences', () => {
  const before = JSON.stringify(DEFAULT_PALATE);
  for (const grape of GRAPES) grapeFlavourProfile(grape.id);
  const personal = buildPalate([], DEFAULT_PALATE);
  assert.deepEqual(personal.grapes, []);
  assert.deepEqual(personal.preferences.grape_preferences, []);
  assert.deepEqual(grapeContext(personal).journal, []);
  assert.equal(JSON.stringify(DEFAULT_PALATE), before);
});
