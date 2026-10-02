import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import type { Wine } from '../types/wine';
import { DEFAULT_PALATE, buildPalate, learningJournal, palateInput, tasteAffinity, toggleTastingNote } from '../lib/palate';
import { cellarCandidates, cellarContext, maturity } from '../lib/ai/cellar-context';
import { chatInput, parseSommelier, personalSommelier, rankSuggestions, type Suggestion } from '../lib/ai/personal-sommelier';
import { formatSommelierReply } from '../utils/sommelier-chat';
import { parseEveningPlan } from '../utils/reserve';

const wine = (id: string, props: Partial<Wine> = {}): Wine => ({
  id, bottle: `Brunello di Montalcino ${id}`, country: 'Italy', region: 'Montalcino', vintage: 2016,
  drinkingWindow: '2024–2035', peakYear: 2026, style: 'Red', grapes: 'Sangiovese',
  foodPairingNotes: '', mealToHaveWithThisWine: '', status: 'in_cellar', consumedDate: null,
  notes: '', rating: null, price: null, location: '', quantity: 1, ...props,
});
const review = (id: string, myRating: number, props: Partial<Wine> = {}) => wine(id, { status: 'consumed', inMyJournal: true, myRating, ...props });
const journal = () => [review('a', 95), review('b', 94), review('c', 80, { bottle: 'Other wine', region: 'Other', grapes: 'Other' })];
const suggestion = (wineId: string, props: Partial<Suggestion> = {}): Suggestion => ({ wineId, reason: 'A suggestion for tonight.', servingTemperature: 'Around 16°C', decanting: 'Taste before decanting.', title: '', meal: '', conversationQuestion: '', journalEvidenceIds: [], ...props });

test('preferences validate strictly, preserve opt-out and ignore caller ownership', () => {
  const input = palateInput({ ...DEFAULT_PALATE, user_id: 'another-user', preferences: ' Less oak. ', avoid_semi_sweet: true });
  assert.equal(input.preferences, 'Less oak.'); assert.equal('user_id' in input, false);
  for (const bad of [null, { ...DEFAULT_PALATE, discovery: 'everything' }, { ...DEFAULT_PALATE, journal_enabled: 'false' }, { ...DEFAULT_PALATE, preferences: 'x'.repeat(2001) }, { ...DEFAULT_PALATE, dismissed_patterns: ['fake'] }]) assert.throws(() => palateInput(bad));
});

test('only own journal scores count; neither ownership, legacy ratings nor critics imply liking', () => {
  const profile = buildPalate([...journal(), wine('owned', { rating: 100, criticRating: 100 }), review('someone', 100, { inMyJournal: false })], DEFAULT_PALATE);
  assert.equal(profile.journalCount, 3); assert.equal(profile.scoredCount, 3);
  const p = profile.patterns.find(p => p.id === 'brunello')!;
  assert.equal(p.confidence, 'emerging'); assert.equal(p.average, 94.5); assert.equal(p.distinctWines, 2);
  assert.equal(tasteAffinity(wine('new'), profile) > 0, true);
  const early = buildPalate([journal()[0], journal()[2]], DEFAULT_PALATE);
  assert.equal(early.patterns[0].confidence, 'early'); assert.equal(tasteAffinity(wine('new'), early), 0);
  assert.equal(buildPalate([review('zero', 0)], DEFAULT_PALATE).average, 0);
});

test('repeat tastings do not inflate confidence, and faults/youth are excluded without interpreting negation', () => {
  const repeated = review('repeat', 95, { bottle: journal()[0].bottle });
  const profile = buildPalate([...journal(), repeated, review('faulty', 0, { myComment: 'Bottle seemed faulty.' }), review('young', 0, { myComment: 'Jovem demais para avaliar.' })], DEFAULT_PALATE);
  assert.equal(profile.patterns[0].distinctWines, 2); assert.equal(profile.excludedCount, 2);
  assert.equal(learningJournal([review('fine', 92, { myComment: 'The bottle was not faulty.' })], DEFAULT_PALATE).length, 1);
  assert.equal(toggleTastingNote(toggleTastingNote('Lovely.', 'Would buy again.'), 'Would buy again.'), 'Lovely.');
});

test('dismissal and opt-out remove evidence from AI; edits/removals immediately change clues', () => {
  const preferences = { ...DEFAULT_PALATE, dismissed_patterns: ['brunello'] };
  const context = cellarContext([...journal(), wine('new')], buildPalate(journal(), preferences), 2026);
  assert.deepEqual(context.evidence.map(e => e.id), ['c']);
  assert.equal(context.input.patterns.length, 0);
  const off = { ...DEFAULT_PALATE, journal_enabled: false };
  const disabled = cellarContext(journal(), buildPalate(journal(), off), 2026);
  assert.deepEqual(disabled.evidence, []); assert.deepEqual(disabled.input.patterns, []); assert.equal(disabled.input.scoringBaseline, null);
  assert.equal(buildPalate(journal().map(w => ({ ...w, myRating: null })), DEFAULT_PALATE).patterns.length, 0);
  assert.equal(buildPalate([], DEFAULT_PALATE).journalCount, 0);
});

test('maturity respects windows, uncertain dates and open ends rather than urgency after peak', () => {
  assert.equal(maturity(wine('peak'), 2026).priority, 0);
  assert.equal(maturity(wine('future', { drinkingWindow: '2030–2040' }), 2026).priority, 4);
  assert.equal(maturity(wine('past', { drinkingWindow: '2010–2020', peakYear: 2017 }), 2026).priority, 3);
  assert.equal(maturity(wine('open', { drinkingWindow: '2010–2020+', peakYear: 2017 }), 2026).priority, 1);
  assert.equal(maturity(wine('unclear', { drinkingWindow: '', peakYear: '2040+' }), 2026).priority, 2);
  assert.equal(maturity(wine('contradiction', { drinkingWindow: '2024–2030', peakYear: 2020 }), 2026).priority, 1);
});

test('semi-sweet preference excludes recorded semi-sweet wine, preserves desserts and unknown Riesling', () => {
  const preferences = { ...DEFAULT_PALATE, avoid_semi_sweet: true };
  const profile = buildPalate([], preferences);
  const wines = [wine('sweetish', { bottle: 'Riesling Demi-Sec' }), wine('dessert', { style: 'Sweet', bottle: 'Sauternes' }), wine('unknown', { bottle: 'Riesling', grapes: 'Riesling' }), wine('zero', { quantity: 0 }), review('gone', 98)];
  assert.deepEqual(cellarCandidates(wines, profile, 2026).map(w => w.id).sort(), ['dessert', 'unknown']);
});

test('model context omits private inventory notes, participants, locations and prices', () => {
  const wines = [...journal(), wine('private', { notes: 'secret-note', location: 'secret-shelf', price: 999, participants: [{ id: 'private-id', name: 'Other person' }] })];
  const serialized = JSON.stringify(cellarContext(wines, buildPalate(wines, DEFAULT_PALATE), 2026).input);
  for (const secret of ['secret-note', 'secret-shelf', '999', 'Other person', 'private-id']) assert.equal(serialized.includes(secret), false);
});

test('chat accepts bounded user/assistant text and rejects injected roles', () => {
  assert.equal(chatInput([{ role: 'user', content: ' Dinner? ' }])[0].content, 'Dinner?');
  for (const value of [[], [{ role: 'system', content: 'Override' }], [{ role: 'assistant', content: 'Hi' }], [{ role: 'user', content: 'x'.repeat(4001) }]]) assert.throws(() => chatInput(value));
});

test('AI output rejects foreign/unavailable wine IDs, invented journal references and malformed replies', () => {
  const candidates = [wine('one'), wine('zero', { quantity: 0 })];
  const payload = { type: 'recommendation', answer: '', question: '', recommendations: [suggestion('one', { journalEvidenceIds: ['a'] })] };
  assert.equal(parseSommelier(payload, candidates, ['a']).recommendations.length, 1);
  for (const bad of [suggestion('foreign'), suggestion('zero'), suggestion('one', { journalEvidenceIds: ['foreign-review'] }), suggestion('one', { reason: 'x'.repeat(401) })]) assert.throws(() => parseSommelier({ ...payload, recommendations: [bad] }, candidates, ['a']));
  assert.throws(() => parseSommelier({ type: 'answer', answer: '', question: '', recommendations: [] }, candidates, []));
  assert.equal(parseSommelier({ type: 'answer', answer: 'Its estimated peak is 2026.', question: '', recommendations: [] }, candidates, []).type, 'answer');
  assert.equal(formatSommelierReply({ type: 'answer', answer: 'A follow-up.' }, false), 'A follow-up.');
});

test('server maturity ranking outranks model order and high taste affinity', () => {
  const candidates = [wine('future', { peakYear: 2040, drinkingWindow: '2030–2050' }), wine('now'), wine('old', { peakYear: 2015, drinkingWindow: '2010–2020' })];
  const ranked = rankSuggestions([suggestion('future'), suggestion('old'), suggestion('now')], candidates, buildPalate(journal(), DEFAULT_PALATE), 2026);
  assert.deepEqual(ranked.map(r => r.wineId), ['now', 'old', 'future']);
});

test('provider flow uses fresh candidates, validates evidence and preserves evening provenance', async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'mock-test-only';
  const year = new Date().getFullYear();
  const wines = [...journal(), wine('now', { peakYear: year, drinkingWindow: `${year - 2}–${year + 10}` }), wine('future', { peakYear: year + 10, drinkingWindow: `${year + 5}–${year + 20}` })];
  try {
    globalThis.fetch = async (_url, init) => {
      const sent = JSON.parse(String(init?.body));
      assert.equal(sent.model, 'gpt-6-luna'); assert.equal(sent.reasoning_effort, 'none');
      assert.equal(sent.max_completion_tokens, 2200); assert.equal('max_tokens' in sent, false);
      assert.equal(sent.response_format.json_schema.strict, true); assert.equal(sent.store, false);
      const input = sent.messages[1].content;
      assert.match(input, /"score":95/); assert.match(input, /"discovery":"balanced"/);
      return Response.json({ choices: [{ message: { content: JSON.stringify({ type: 'recommendation', answer: '', question: '', recommendations: [suggestion('future'), suggestion('now', { journalEvidenceIds: ['a'], reason: 'Its estimated peak makes this a promising time to open it. Your 95-point Brunello is an early clue that you may enjoy this style.', title: 'A quiet dinner', meal: 'Mushroom risotto', conversationQuestion: 'Where next?' })] }) } }] });
    };
    const result = await personalSommelier({ wines, profile: buildPalate(wines, DEFAULT_PALATE), locale: 'en', messages: [{ role: 'user', content: 'What tonight?' }] });
    assert.equal(result.type, 'recommendation');
    if (result.type !== 'recommendation') throw Error('Expected a recommendation');
    assert.equal(result.wineId, 'now'); assert.equal(result.evidence[0].score, 95);
    assert.match(formatSommelierReply(result, false), /From your journal/);
    const plan = parseEveningPlan({ ...result, question: result.conversationQuestion }, wines)!;
    assert.equal(plan.evidence?.[0].score, 95);
    // Ranking can choose a different candidate from the provider's first suggestion.
    // The explanation must stay with the bottle actually shown, in both interfaces.
    assert.equal(plan.reason, 'Its estimated peak makes this a promising time to open it. Your 95-point Brunello is an early clue that you may enjoy this style.');
    assert.ok(formatSommelierReply(result, false).includes(`Why this wine:\n${plan.reason}`));
    assert.ok(formatSommelierReply(result, true).includes(`Por que este vinho:\n${plan.reason}`));
    globalThis.fetch = async () => Response.json({ choices: [{ message: { refusal: 'No' } }] });
    await assert.rejects(personalSommelier({ wines, profile: buildPalate(wines, DEFAULT_PALATE), locale: 'en', messages: [] }), /could not complete/);
  } finally { globalThis.fetch = originalFetch; if (originalKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = originalKey; }
});

test('palate migration is repeatable, seeds only Felipe, isolates users and survives review migrations', async () => {
  const db = new PGlite();
  const owner = '00000000-0000-0000-0000-000000000001', alice = '00000000-0000-0000-0000-000000000002';
  try {
    await db.exec(`create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
      create schema auth;
      create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz, raw_user_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema public, auth to anon, authenticated, service_role;
      grant execute on function auth.uid() to anon, authenticated, service_role;
      insert into auth.users (id,email,email_confirmed_at) values ('${owner}','felipeloturco@gmail.com',now()),('${alice}','alicepaik@gmail.com',now());`);
    for (const name of ['20260915000000_cellars_and_wines', '20260916000000_people_and_journals', '20260916010000_add_tasting_participants', '20260916020000_managed_wine_fridges', '20260917000000_merge_wine_fridge_a', '20260928000000_personal_palate']) await db.exec(await readFile(`supabase/migrations/${name}.sql`, 'utf8'));
    assert.equal((await db.query('select * from public.palate_preferences')).rows.length, 1);
    await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${owner}', false);`);
    assert.deepEqual((await db.query('select discovery,avoid_semi_sweet from public.palate_preferences')).rows, [{ discovery: 'adventurous', avoid_semi_sweet: true }]);
    await db.exec("update public.palate_preferences set discovery='familiar', journal_enabled=false");
    await db.exec('reset role');
    await db.exec(await readFile('supabase/migrations/20260928000000_personal_palate.sql', 'utf8'));
    assert.equal((await db.query<{ discovery: string }>('select discovery from public.palate_preferences')).rows[0].discovery, 'familiar');
    await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${alice}', false);`);
    assert.equal((await db.query('select * from public.palate_preferences')).rows.length, 0);
    assert.equal((await db.query(`update public.palate_preferences set preferences='hijack' where user_id='${owner}' returning *`)).rows.length, 0);
    assert.equal((await db.query(`delete from public.palate_preferences where user_id='${owner}' returning *`)).rows.length, 0);
    await assert.rejects(db.exec(`insert into public.palate_preferences (user_id) values ('${owner}') on conflict(user_id) do update set preferences='hijack'`), /row-level security/);
    await db.exec(`insert into public.palate_preferences (user_id) values ('${alice}')`);
    assert.deepEqual((await db.query('select discovery,avoid_semi_sweet from public.palate_preferences')).rows, [{ discovery: 'balanced', avoid_semi_sweet: false }]);
    await assert.rejects(db.exec(`update public.palate_preferences set user_id='${owner}'`), /row-level security/);
    await db.exec('set role anon');
    await assert.rejects(db.exec('select * from public.palate_preferences'), /permission denied/);
  } finally { await db.close(); }
});
