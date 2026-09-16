import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { attachJournal, participantInput, personInput, reviewInput } from '../lib/journal-data';
import { selectWines } from '../utils/cellar';
import { newWineInput, rowToWine } from '../lib/wine-data';
import type { CellarPerson, WineParticipant, WineReview, WineRow } from '../types/database';

const owner = '00000000-0000-0000-0000-000000000001';
const alice = '00000000-0000-0000-0000-000000000002';
const outside = '00000000-0000-0000-0000-000000000003';
const invited = '00000000-0000-0000-0000-000000000004';
async function database() {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema public, auth to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
    insert into auth.users (id, email, email_confirmed_at) values
      ('${owner}', 'felipeloturco@gmail.com', now()), ('${alice}', 'alicepaik@gmail.com', now()),
      ('${outside}', 'outside@example.com', now());
  `);
  await db.exec(await readFile('supabase/migrations/20260915000000_cellars_and_wines.sql', 'utf8'));
  await db.exec(`
    insert into public.cellar_members (cellar_id, user_id) values ('1', '${owner}'), ('1', '${alice}'), ('2', '${outside}');
    insert into public.wines (id, cellar_id, bottle, country, style, quantity) values
      ('stock', '1', 'Shared bottle', 'France', 'Red', 3), ('foreign', '2', 'Other cellar', 'Portugal', 'White', 2);
    insert into public.wines (id, cellar_id, bottle, country, style, status, rating, notes, location) values
      ('old', '1', 'Historical bottle', 'Italy', 'Red', 'consumed', 4, 'Original cellar note', 'Wine Heaven');
  `);
  await db.exec(await readFile('supabase/migrations/20260916000000_people_and_journals.sql', 'utf8'));
  await db.exec(await readFile('supabase/migrations/20260916010000_add_tasting_participants.sql', 'utf8'));
  const people = (await db.query<CellarPerson>('select * from public.cellar_people')).rows;
  const person = (id: string) => people.find(person => person.user_id === id)!.id;
  const as = async (id: string) => db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${id}', false)`);
  return { db, person, as };
}

test('personal review validation keeps zero, rejects ownership payloads and validates participants', () => {
  assert.deepEqual(reviewInput({ rating: 0, comment: ' Nice ', user_id: alice }), { rating: 0, comment: 'Nice' });
  assert.deepEqual(reviewInput({ rating: null, comment: '' }), { rating: null, comment: '' });
  for (const rating of [-1, 101, 90.5, '90', undefined, Infinity]) assert.throws(() => reviewInput({ rating, comment: '' }));
  assert.throws(() => reviewInput({ rating: 90, comment: 'a'.repeat(5001) }));
  assert.throws(() => reviewInput(null));
  assert.deepEqual(participantInput({ personIds: [owner, alice, alice] }), [owner, alice]);
  for (const personIds of [[], [null], ['not-a-uuid'], undefined]) assert.throws(() => participantInput({ personIds }));
  assert.deepEqual(personInput({ name: ' Alice ', email: ' ALICE@example.com ', role: 'owner' }), { name: 'Alice', email: 'alice@example.com' });
  assert.throws(() => personInput({ name: 'Guest', email: '' }));
});

test('migration preserves historical reviews separately and assigns old tastings only to the owner', async () => {
  const { db, person, as } = await database();
  try {
    assert.deepEqual((await db.query("select user_id, role from public.cellar_members where cellar_id = '1' order by user_id")).rows,
      [{ user_id: owner, role: 'owner' }, { user_id: alice, role: 'member' }]);
    const old = (await db.query<WineRow>("select * from public.wines where id = 'old'")).rows[0];
    assert.equal(Number(old.rating), 4); assert.equal(old.notes, 'Original cellar note'); assert.equal(old.location, '');
    assert.deepEqual((await db.query('select person_id from public.wine_participants')).rows, [{ person_id: person(owner) }]);
    assert.equal((await db.query('select * from public.wine_reviews')).rows.length, 0);
    await as(alice);
    await assert.rejects(db.exec("select * from public.save_cellar_person('1', 'New', 'new@example.com', null, true)"), /Only the cellar owner/);
    await assert.rejects(db.exec("update public.cellar_members set role = 'owner'"), /permission denied/);
    await assert.rejects(db.exec(`insert into public.wine_participants values ('1', 'old', '${person(alice)}')`), /permission denied/);
  } finally { await db.close(); }
});

test('owner adds existing accounts and pending invitations activate only after email confirmation', async () => {
  const { db, as } = await database();
  try {
    await as(owner);
    await assert.rejects(db.exec("select * from public.save_cellar_person('1', 'New', 'new@example.com')"), /Invitations are not configured/);
    assert.equal((await db.query("select * from public.cellar_people where email = 'new@example.com'")).rows.length, 0);
    await db.exec("select * from public.save_cellar_person('1', 'Outside', 'outside@example.com')");
    await as(outside);
    assert.equal((await db.query("select * from public.cellars where id = '1'")).rows.length, 1);
    await as(owner);
    const pending = (await db.query<CellarPerson>("select * from public.save_cellar_person('1', 'Invited', 'invited@example.com', null, true)")).rows[0];
    assert.equal(pending.user_id, null);
    await assert.rejects(db.exec(`select * from public.consume_wine('1', 'stock', 1, '2026-09-16', array['${pending.id}']::uuid[])`), /active person/);
    await db.exec(`reset role; insert into auth.users (id, email) values ('${invited}', 'invited@example.com')`);
    assert.equal((await db.query(`select * from public.cellar_members where user_id = '${invited}'`)).rows.length, 0);
    await db.exec(`update auth.users set email_confirmed_at = now() where id = '${invited}'`);
    assert.equal((await db.query(`select * from public.cellar_members where user_id = '${invited}'`)).rows.length, 1);
    assert.equal((await db.query<CellarPerson>(`select * from public.cellar_people where id = '${pending.id}'`)).rows[0].user_id, invited);
    await as(invited);
    assert.equal((await db.query('select * from public.cellars')).rows.length, 1);
    await assert.rejects(db.exec("select * from public.save_cellar_person('1', 'Hijack', 'hijack@example.com', null, true)"), /Only the cellar owner/);
    await db.exec('set role anon');
    await assert.rejects(db.exec("select * from public.save_cellar_person('1', 'No', 'no@example.com')"), /permission denied/);
  } finally { await db.close(); }
});

test('consumption atomically records selected people and only the acting user’s review', async () => {
  const { db, person, as } = await database();
  try {
    await as(owner);
    const members = `array['${person(owner)}', '${person(alice)}']::uuid[]`;
    const changed = (await db.query<WineRow>(`select * from public.consume_wine('1', 'stock', 1, '2026-09-16', ${members}, 95, 'My own comment')`)).rows;
    const consumed = changed.find(wine => wine.status === 'consumed')!;
    assert.equal(changed.find(wine => wine.id === 'stock')!.quantity, 2);
    assert.equal(consumed.location, '');
    assert.equal((await db.query(`select * from public.wine_participants where wine_id = '${consumed.id}'`)).rows.length, 2);
    assert.equal((await db.query('select * from public.wine_reviews')).rows.length, 1);
    await as(alice);
    assert.equal((await db.query('select * from public.wine_reviews')).rows.length, 0);
    await db.exec(`insert into public.wine_reviews (cellar_id, wine_id, person_id, rating, comment) values ('1', '${consumed.id}', '${person(alice)}', 80, 'Alice comment')`);
    assert.equal((await db.query(`update public.wine_reviews set rating = 0 where person_id = '${person(owner)}' returning *`)).rows.length, 0);
    assert.equal((await db.query(`delete from public.wine_reviews where person_id = '${person(owner)}' returning *`)).rows.length, 0);
    await assert.rejects(db.exec(`insert into public.wine_reviews (cellar_id, wine_id, person_id, rating) values ('1', 'old', '${person(owner)}', 100)`), /row-level security/);
    await assert.rejects(db.exec(`insert into public.wine_reviews (cellar_id, wine_id, person_id, rating) values ('1', 'old', '${person(alice)}', 100)`), /foreign key/);
    await db.exec(`insert into public.wine_reviews (cellar_id, wine_id, person_id, rating, comment) values ('1', '${consumed.id}', '${person(alice)}', 0, '') on conflict (cellar_id, wine_id, person_id) do update set rating = excluded.rating, comment = excluded.comment`);
    assert.equal((await db.query<WineReview>('select * from public.wine_reviews')).rows[0].rating, 0);
    await db.exec('update public.wine_reviews set rating = null, comment = \'Still memorable\'');
    assert.equal((await db.query<WineReview>('select * from public.wine_reviews')).rows[0].rating, null);
    await as(owner);
    assert.equal((await db.query<WineReview>('select * from public.wine_reviews')).rows[0].rating, 95);
    await as(outside);
    assert.equal((await db.query("select * from public.wine_participants where cellar_id = '1'")).rows.length, 0);
    await assert.rejects(db.exec(`select * from public.consume_wine('1', 'stock', 1, '2026-09-16', ${members})`), /access/);
    await db.exec('reset role');
    await db.exec(`delete from public.cellar_members where user_id = '${alice}'`);
    await as(alice);
    assert.equal((await db.query('select * from public.wine_reviews')).rows.length, 0);
  } finally { await db.close(); }
});

test('invalid participants/reviews roll back inventory, and recording others does not add the recorder', async () => {
  const { db, person, as } = await database();
  try {
    await as(owner);
    for (const [ids, score, comment] of [
      [`array['${person(outside)}']::uuid[]`, 'null', "''"], ['array[]::uuid[]', 'null', "''"],
      [`array['${person(owner)}']::uuid[]`, '101', "''"], [`array['${person(alice)}']::uuid[]`, '92', "''"],
    ]) await assert.rejects(db.exec(`select * from public.consume_wine('1', 'stock', 1, '2026-09-16', ${ids}, ${score}, ${comment})`));
    assert.equal((await db.query<WineRow>("select * from public.wines where id = 'stock'")).rows[0].quantity, 3);
    assert.equal((await db.query('select * from public.wines')).rows.length, 2);
    const result = (await db.query<WineRow>(`select * from public.consume_wine('1', 'stock', 3, '2026-09-16', array['${person(alice)}']::uuid[])`)).rows;
    assert.equal(result.length, 1); assert.equal(result[0].status, 'consumed');
    assert.deepEqual((await db.query("select person_id from public.wine_participants where wine_id = 'stock'")).rows, [{ person_id: person(alice) }]);
    await assert.rejects(db.exec(`select * from public.consume_wine('1', 'stock', 1, '2026-09-16', array['${person(owner)}']::uuid[])`), /quantity or status/);
    await assert.rejects(db.exec(`select public.record_wine_participants('1', 'old', array['${person(alice)}']::uuid[], 100, '')`), /permission denied/);
  } finally { await db.close(); }
});

test('personal journals filter by participation and rank personal scores, including zero and missing scores', async () => {
  const { db, person } = await database();
  try {
    const old = rowToWine((await db.query<WineRow>("select * from public.wines where id = 'old'")).rows[0]);
    const wines = [old, { ...old, id: 'shared', bottle: 'Shared' }, { ...old, id: 'zero', bottle: 'Zero' }];
    const people = (await db.query<CellarPerson>('select * from public.cellar_people')).rows;
    const participants: WineParticipant[] = [
      { cellar_id: '1', wine_id: 'old', person_id: person(owner) },
      ...['shared', 'zero'].flatMap(wine_id => [owner, alice].map(id => ({ cellar_id: '1', wine_id, person_id: person(id) }))),
    ];
    const reviews = [
      { cellar_id: '1', wine_id: 'shared', person_id: person(owner), rating: 95, comment: 'Felipe', created_at: '', updated_at: '' },
      { cellar_id: '1', wine_id: 'shared', person_id: person(alice), rating: 75, comment: 'Alice', created_at: '', updated_at: '' },
      { cellar_id: '1', wine_id: 'zero', person_id: person(alice), rating: 0, comment: '', created_at: '', updated_at: '' },
    ];
    const aliceWines = attachJournal(wines, people, participants, reviews, alice);
    assert.deepEqual(aliceWines.filter(wine => wine.inMyJournal).map(wine => wine.id), ['shared', 'zero']);
    assert.equal(aliceWines[0].myRating, null); assert.equal(aliceWines[1].myComment, 'Alice');
    assert.equal(attachJournal(wines, people, participants, reviews, owner)[1].myRating, 95);
    const filters = { search: '', country: 'all', region: 'all', style: 'all', vintage: 'all', status: 'all', coravin: 'all' };
    assert.deepEqual(selectWines(aliceWines, filters, false, { key: 'myRating', direction: 'desc' }, 2026).map(wine => wine.id), ['shared', 'zero', 'old']);
    assert.deepEqual(selectWines(aliceWines, filters, false, { key: 'myRating', direction: 'asc' }, 2026).map(wine => wine.id), ['zero', 'shared', 'old']);
  } finally { await db.close(); }
});

test('external tastings save participants atomically and direct writes cannot skip the tasting step', async () => {
  const { db, person, as } = await database();
  try {
    await as(owner);
    await assert.rejects(db.exec("update public.wines set status = 'consumed' where id = 'stock'"), /tasting action/);
    await assert.rejects(db.exec("update public.wines set status = 'in_cellar' where id = 'old'"), /tasting action/);
    await assert.rejects(db.exec("insert into public.wines (cellar_id, bottle, country, style, status) values ('1', 'Bypass', 'France', 'Red', 'consumed')"), /tasting action/);
    const input = newWineInput({ bottle: 'Restaurant discovery', country: 'Italy', style: 'Red', quantity: 1, consumedDate: '2026-09-16' });
    await assert.rejects(db.query("select * from public.log_consumed_wine('1', $1::jsonb, $2::uuid[], 90, 'Personal')", [JSON.stringify(input), [person(outside)]]), /active person/);
    assert.equal((await db.query("select * from public.wines where bottle = 'Restaurant discovery'")).rows.length, 0);
    const saved = (await db.query<WineRow>("select * from public.log_consumed_wine('1', $1::jsonb, $2::uuid[], 90, 'Personal')", [JSON.stringify({ ...input, id: 'forged', cellar_id: '2' }), [person(owner), person(alice)]])).rows[0];
    assert.equal(saved.cellar_id, '1'); assert.notEqual(saved.id, 'forged'); assert.equal(saved.status, 'consumed'); assert.equal(saved.from_cellar, false);
    assert.equal((await db.query(`select * from public.wine_participants where wine_id = '${saved.id}'`)).rows.length, 2);
    await db.exec(`update public.wines set bottle = 'Corrected name' where id = '${saved.id}'`);
    await db.exec(`delete from public.wines where id = '${saved.id}'`);
    assert.equal((await db.query(`select * from public.wine_participants where wine_id = '${saved.id}'`)).rows.length, 0);
    assert.equal((await db.query('select * from public.wine_reviews')).rows.length, 0);
  } finally { await db.close(); }
});

test('later participant additions preserve inventory and reviews and create an independent journal entry', async () => {
  const { db, person, as } = await database();
  try {
    await as(owner);
    await db.exec(`insert into public.wine_reviews (cellar_id, wine_id, person_id, rating, comment)
      values ('1', 'old', '${person(owner)}', 94, 'Owner memory')`);
    const wineBefore = (await db.query<WineRow>("select * from public.wines where id = 'old'")).rows[0];
    const reviewBefore = (await db.query<WineReview>('select * from public.wine_reviews')).rows[0];
    await db.exec(`select public.add_wine_participants('1', 'old', array['${person(alice)}', '${person(alice)}', '${person(owner)}']::uuid[])`);
    await db.exec(`select public.add_wine_participants('1', 'old', array['${person(alice)}']::uuid[])`);
    assert.equal((await db.query("select * from public.wine_participants where wine_id = 'old'")).rows.length, 2);
    assert.deepEqual((await db.query<WineRow>("select * from public.wines where id = 'old'")).rows[0], wineBefore);
    assert.deepEqual((await db.query<WineReview>('select * from public.wine_reviews')).rows[0], reviewBefore);

    await as(alice);
    const people = (await db.query<CellarPerson>('select * from public.cellar_people')).rows;
    const participants = (await db.query<WineParticipant>('select * from public.wine_participants')).rows;
    const reviews = (await db.query<WineReview>('select * from public.wine_reviews')).rows;
    const journal = attachJournal([rowToWine(wineBefore)], people, participants, reviews, alice)[0];
    assert.equal(journal.inMyJournal, true); assert.equal(journal.myRating, null); assert.equal(journal.myComment, '');
    await db.exec(`insert into public.wine_reviews (cellar_id, wine_id, person_id, rating, comment)
      values ('1', 'old', '${person(alice)}', 82, 'Alice memory')`);
    await as(owner);
    assert.deepEqual((await db.query<WineReview>('select * from public.wine_reviews')).rows[0], reviewBefore);

    const added = (await db.query<CellarPerson>("select * from public.save_cellar_person('1', 'Another friend', 'outside@example.com')")).rows[0];
    await as(alice);
    await db.exec(`select public.add_wine_participants('1', 'old', array['${added.id}']::uuid[])`);
    assert.equal((await db.query("select * from public.wine_participants where wine_id = 'old'")).rows.length, 3);
    // Reapplying this incremental function migration is safe too.
    await db.exec('reset role');
    await db.exec(await readFile('supabase/migrations/20260916010000_add_tasting_participants.sql', 'utf8'));
  } finally { await db.close(); }
});

test('later additions reject nonparticipants, other cellars, pending accounts and invalid wines atomically', async () => {
  const { db, person, as } = await database();
  try {
    await as(alice);
    await assert.rejects(db.exec(`select public.add_wine_participants('1', 'old', array['${person(alice)}']::uuid[])`), /owner or a participant/);
    await as(outside);
    await assert.rejects(db.exec(`select public.add_wine_participants('1', 'old', array['${person(outside)}']::uuid[])`), /access/);
    await as(owner);
    const pending = (await db.query<CellarPerson>("select * from public.save_cellar_person('1', 'Pending', 'pending@example.com', null, true)")).rows[0];
    const valid = `array['${person(alice)}']::uuid[]`;
    await assert.rejects(db.exec(`select public.add_wine_participants('1', 'stock', ${valid})`), /consumed wines/);
    await assert.rejects(db.exec(`select public.add_wine_participants('1', 'missing', ${valid})`), /not found/);
    for (const ids of [
      `array['${person(alice)}', '${person(outside)}']::uuid[]`, `array['${pending.id}']::uuid[]`,
      `array['00000000-0000-0000-0000-000000000099']::uuid[]`, 'array[]::uuid[]', 'null::uuid[]',
      'array[null]::uuid[]', `array_fill('${person(alice)}'::uuid, array[101])`,
    ]) await assert.rejects(db.exec(`select public.add_wine_participants('1', 'old', ${ids})`), /active people/);
    assert.deepEqual((await db.query("select person_id from public.wine_participants where wine_id = 'old'")).rows, [{ person_id: person(owner) }]);
    await db.exec(`reset role; delete from public.cellar_members where user_id = '${alice}'; set role authenticated`);
    await assert.rejects(db.exec(`select public.add_wine_participants('1', 'old', ${valid})`), /active people/);
    await db.exec('set role anon');
    await assert.rejects(db.exec(`select public.add_wine_participants('1', 'old', ${valid})`), /permission denied/);
  } finally { await db.close(); }
});

test('owner can add participants to a consumed wine even when they were not originally selected', async () => {
  const { db, person, as } = await database();
  try {
    await as(owner);
    await db.exec(`select * from public.consume_wine('1', 'stock', 3, '2026-09-16', array['${person(alice)}']::uuid[])`);
    await db.exec(`select public.add_wine_participants('1', 'stock', array['${person(owner)}']::uuid[])`);
    assert.equal((await db.query("select * from public.wine_participants where wine_id = 'stock'")).rows.length, 2);
    assert.equal((await db.query<WineRow>("select * from public.wines where id = 'stock'")).rows[0].quantity, 3);
  } finally { await db.close(); }
});
