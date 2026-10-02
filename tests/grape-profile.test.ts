import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { GRAPES } from '../data/grapes';
import { DEFAULT_PALATE, buildPalate, palateInput, palateWrite } from '../lib/palate';
import { grapeContext, recordedGrapes, isAvoidedGrape } from '../lib/grape-profile';
import { cellarContext, cellarCandidates } from '../lib/ai/cellar-context';
import { shoppingContext } from '../lib/ai/shopping-advisor';
import type { GrapePreference } from '../types/palate';
import type { Wine } from '../types/wine';

const wine = (id: string, props: Partial<Wine> = {}): Wine => ({
  id, bottle: `Sample ${id}`, grapes: 'Syrah', country: 'France', region: 'Northern Rhône', style: 'Red', vintage: 2019,
  status: 'consumed', inMyJournal: true, myRating: 92, quantity: 1, consumedDate: '2026-10-01',
  drinkingWindow: '2024–2034', peakYear: 2026, notes: '', rating: null, price: null,
  location: '', foodPairingNotes: '', mealToHaveWithThisWine: '', ...props,
});
const preference = (grapeId = 'syrah', label: GrapePreference['preference'] = 'love'): GrapePreference => ({ grapeId, preference: label, notes: ' Prefer savoury styles. ' });

test('grape identities merge synonyms but keep different grapes separate', () => {
  assert.deepEqual(recordedGrapes('Shiraz / Syrah').ids, ['syrah']);
  for (const [text, id] of [['Nebbiolo (Chiavennasca)', 'nebbiolo'], ['Pinot Grigio (100%)', 'pinot-gris'], ['Sangiovese', 'sangiovese'], ['Tempranillo / Tinta Roriz', 'tempranillo']]) {
    assert.deepEqual(recordedGrapes(text), { ids: [id], complete: true, composition: 'single' });
  }
  assert.deepEqual(recordedGrapes('Grenache Blanc').ids, ['grenache-blanc']);
  assert.deepEqual(recordedGrapes('Petite Sirah').ids, ['petite-sirah']);
  assert.deepEqual(recordedGrapes('Cabernet Sauvignon, Cabernet Franc').ids.sort(), ['cabernet-franc', 'cabernet-sauvignon']);
  for (const text of ['Welschriesling', 'Riesling Italico', 'Grenache Gris', 'Pinot', 'Muscat', '', 'Unknown']) assert.deepEqual(recordedGrapes(text).ids, []);
});

test('partial and unknown compositions never create single-grape evidence', () => {
  for (const text of ['Roussanne (dominant)', 'Syrah 90%', 'Field blend (Touriga Nacional, etc.)', 'Syrah & unknown grape', 'Syrah & Merlot']) {
    assert.equal(recordedGrapes(text).composition, 'blend', text);
  }
  assert.equal(recordedGrapes('80% Merlot, 20% Cabernet Franc').complete, true);
  assert.equal(recordedGrapes('80% Merlot, 10% Cabernet Franc').complete, false);
  const profile = buildPalate([wine('blend', { grapes: 'Cabernet Sauvignon & Merlot', myRating: 100 }), wine('partial', { grapes: 'Syrah 90%', myRating: 99 })], DEFAULT_PALATE);
  assert.equal(profile.grapes.length, 3);
  assert.ok(profile.grapes.every(g => g.average === null && g.blendWines === 1 && g.scoredSingleWines === 0));
  assert.equal(profile.unmappedGrapeWines, 1);
});

test('journal evidence averages repeat vintage scores once and retains zero, unrated, style and comments', () => {
  const wines = [wine('first', { bottle: 'Same label', myRating: 100 }), wine('repeat', { bottle: 'Same label', grapes: 'Shiraz', myRating: 80 }),
    wine('other', { myRating: 0, myComment: 'Not my style.' }), wine('unrated', { myRating: null }),
    wine('blend', { grapes: 'Syrah, Grenache', myRating: 99 }), wine('sweet', { grapes: 'Riesling', style: 'Sweet' }),
    wine('white', { grapes: 'Riesling', style: 'White' })];
  const profile = buildPalate(wines, DEFAULT_PALATE);
  const syrah = profile.grapes.find(g => g.grapeId === 'syrah')!;
  assert.equal(syrah.average, 45); assert.equal(syrah.singleWines, 3); assert.equal(syrah.scoredSingleWines, 2); assert.equal(syrah.blendWines, 1);
  assert.equal(syrah.evidence.find(e => e.id === 'other')?.score, 0);
  assert.equal(syrah.evidence.find(e => e.id === 'other')?.comment, 'Not my style.');
  assert.equal(syrah.evidence.find(e => e.id === 'unrated')?.score, null);
  assert.deepEqual(profile.grapes.find(g => g.grapeId === 'riesling')?.styles, ['Sweet', 'White']);
  assert.equal(buildPalate(wines.slice(0, 1), DEFAULT_PALATE).grapes[0].scoredSingleWines, 1);
  assert.equal(buildPalate([], DEFAULT_PALATE).grapes.length, 0);
});

test('only personal eligible reviews contribute; disabling or dismissing learning removes all grape inference', () => {
  const wines = [wine('mine'), wine('other', { inMyJournal: false, grapes: 'Merlot' }), wine('stock', { status: 'in_cellar', grapes: 'Chardonnay', rating: 100 }),
    wine('faulty', { grapes: 'Gamay', myComment: 'Bottle seemed faulty.' }), wine('young', { grapes: 'Malbec', myComment: 'Jovem demais para avaliar.' })];
  const profile = buildPalate(wines, DEFAULT_PALATE);
  assert.deepEqual(profile.grapes.map(g => g.grapeId), ['syrah']);
  const prefs = { ...DEFAULT_PALATE, journal_enabled: false, grape_preferences: [preference()] };
  const off = buildPalate(wines, prefs);
  assert.deepEqual(off.grapes, []); assert.equal(off.unmappedGrapeWines, 0);
  for (const context of [cellarContext(wines, off, 2026).input, shoppingContext(wines, off).input]) {
    assert.deepEqual(context.grapeProfile.journal, []);
    assert.equal(context.grapeProfile.stated[0].preference, 'love');
  }
  const dismissedPrefs = { ...DEFAULT_PALATE, dismissed_patterns: ['brunello'] };
  const brunello = wine('brunello', { bottle: 'Brunello di Montalcino', country: 'Italy', region: 'Montalcino', grapes: 'Sangiovese' });
  const dismissed = buildPalate([brunello], dismissedPrefs);
  assert.deepEqual(dismissed.grapes, []);
  assert.deepEqual(grapeContext(dismissed).journal, []);
});

test('grape input validates bounds, rejects duplicate/unknown preferences and preserves older clients', () => {
  const normalized = palateInput({ ...DEFAULT_PALATE, grape_preferences: [preference()] });
  assert.equal(normalized.grape_preferences[0].notes, 'Prefer savoury styles.');
  const { grape_preferences: _unused, ...old } = DEFAULT_PALATE;
  assert.deepEqual(palateInput(old).grape_preferences, []);
  assert.equal('grape_preferences' in palateWrite(old), false);
  assert.deepEqual(palateWrite(DEFAULT_PALATE).grape_preferences, []);
  for (const grapes of [null, {}, [preference(), preference()], [preference('invented')], [{ ...preference(), preference: 'hate' }],
    [{ ...preference(), preference: '__proto__' }], [{ ...preference(), notes: null }], [{ ...preference(), notes: 'x'.repeat(241) }],
    Array.from({ length: 41 }, (_, i) => preference(GRAPES[i].id))]) assert.throws(() => palateInput({ ...DEFAULT_PALATE, grape_preferences: grapes }));
  assert.doesNotThrow(() => palateInput({ ...DEFAULT_PALATE, grape_preferences: Array.from({ length: 40 }, (_, i) => preference(GRAPES[i].id)) }));
});

test('explicit Avoid wins over high scores, including synonyms in blends; uncertain grapes remain uncertain', () => {
  const preferences = { ...DEFAULT_PALATE, grape_preferences: [preference('syrah', 'avoid'), preference('riesling', 'neutral')] };
  const stock = [wine('single', { status: 'in_cellar', grapes: 'Shiraz' }), wine('blend', { status: 'in_cellar', grapes: 'Grenache, Syrah' }),
    wine('unknown', { status: 'in_cellar', grapes: '' }), wine('neutral', { status: 'in_cellar', grapes: 'Riesling' })];
  const profile = buildPalate([wine('loved-before', { myRating: 100 }), ...stock], preferences);
  assert.equal(profile.preferences.grape_preferences[0].preference, 'avoid');
  assert.deepEqual(cellarCandidates(stock, profile, 2026).map(w => w.id).sort(), ['neutral', 'unknown']);
  assert.equal(isAvoidedGrape({ grapes: 'Petite Sirah' }, preferences), false);
  const context = cellarContext(stock, profile, 2026);
  assert.equal(context.input.grapeProfile.stated[0].grape, 'Syrah');
  assert.equal(context.input.grapeProfile.stated[1].preference, 'neutral');
});

test('grape migration preserves data, validates catalog and payload, reruns safely and keeps preferences private', async () => {
  const db = new PGlite();
  const owner = '00000000-0000-0000-0000-000000000001', other = '00000000-0000-0000-0000-000000000002';
  const base = await readFile('supabase/migrations/20260928000000_personal_palate.sql', 'utf8');
  const migration = await readFile('supabase/migrations/20261002000000_grape_profile.sql', 'utf8');
  try {
    await db.exec(`create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
      create schema auth; create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema public, auth to anon, authenticated, service_role;
      create function public.set_wine_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
      insert into auth.users(id) values ('${owner}'),('${other}');`);
    await db.exec(base);
    await db.exec(`insert into public.palate_preferences (user_id, preferences) values ('${owner}', 'Existing notes');`);
    await db.exec(migration);
    assert.deepEqual((await db.query('select preferences,grape_preferences from public.palate_preferences')).rows, [{ preferences: 'Existing notes', grape_preferences: [] }]);
    await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${owner}', false);`);
    for (const grape of GRAPES) await db.query('update public.palate_preferences set grape_preferences=$1', [JSON.stringify([preference(grape.id)])]);
    for (const bad of [null, {}, [null], [preference('fake')], [preference(), preference()], [{ ...preference(), notes: null }], [{ ...preference(), notes: 'x'.repeat(241) }], [{ ...preference(), preference: 'hate' }], [{ ...preference(), extra: 1 }], Array(41).fill(preference())]) {
      await assert.rejects(db.query('update public.palate_preferences set grape_preferences=$1', [JSON.stringify(bad)]), /constraint/);
    }
    await db.query('update public.palate_preferences set grape_preferences=$1', [JSON.stringify([preference()])]);
    await db.exec(`insert into public.palate_preferences (user_id,preferences) values ('${owner}', 'Older client update') on conflict(user_id) do update set preferences=excluded.preferences; reset role;`);
    await db.exec(migration); await db.exec(base);
    assert.deepEqual((await db.query('select preferences,grape_preferences from public.palate_preferences')).rows, [{ preferences: 'Older client update', grape_preferences: [preference()] }]);
    await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${other}', false);`);
    assert.equal((await db.query('select * from public.palate_preferences')).rows.length, 0);
    assert.equal((await db.query(`update public.palate_preferences set grape_preferences='[]' where user_id='${owner}' returning *`)).rows.length, 0);
    await assert.rejects(db.query('insert into public.palate_preferences (user_id,grape_preferences) values ($1,$2) on conflict(user_id) do update set grape_preferences=excluded.grape_preferences', [owner, JSON.stringify([preference()])]), /row-level security/);
    await db.exec(`insert into public.palate_preferences (user_id) values ('${other}')`);
    assert.deepEqual((await db.query('select grape_preferences from public.palate_preferences')).rows, [{ grape_preferences: [] }]);
    await db.exec('set role anon');
    await assert.rejects(db.exec('select grape_preferences from public.palate_preferences'), /permission denied/);
  } finally { await db.close(); }
});
