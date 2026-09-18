import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import type { WineRow } from '../types/database';
import { fridgeInput } from '../lib/storage-data';

const owner = '00000000-0000-0000-0000-000000000001';
const member = '00000000-0000-0000-0000-000000000002';
const outsider = '00000000-0000-0000-0000-000000000003';
const migrationPath = 'supabase/migrations/20260916020000_managed_wine_fridges.sql';
async function setup() {
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
      ('${owner}', 'felipeloturco@gmail.com', now()), ('${member}', 'member@example.com', now()), ('${outsider}', 'loturco.pa@uol.com.br', now());
  `);
  await db.exec(await readFile('supabase/migrations/20260915000000_cellars_and_wines.sql', 'utf8'));
  await db.exec(`insert into public.cellar_members (cellar_id, user_id) values ('1', '${owner}'), ('1', '${member}'), ('2', '${outsider}');
    insert into public.wines (id, cellar_id, bottle, country, style, quantity, location) values
      ('zero', '1', 'Bottle zero', 'France', 'Red', 3, 'Wine fridge A - L0'),
      ('one', '1', 'Bottle one', 'France', 'White', 2, 'Wine fridge A -  L1'),
      ('five', '1', 'Bottle five', 'Italy', 'Red', 1, 'Wine Fridge A - L5'),
      ('six', '1', 'Bottle six', 'Italy', 'Red', 1, 'Wine Fridge A - L6'),
      ('legacy', '1', 'Legacy bottle', 'France', 'Red', 1, 'Basement rack'),
      ('other', '2', 'Other cellar', 'Portugal', 'Red', 2, 'Adega A - L0');`);
  await db.exec(await readFile('supabase/migrations/20260916000000_people_and_journals.sql', 'utf8'));
  await db.exec(await readFile('supabase/migrations/20260916010000_add_tasting_participants.sql', 'utf8'));
  const migration = await readFile(migrationPath, 'utf8');
  await db.exec(migration);
  const as = async (id: string) => db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${id}', false)`);
  const id = (await db.query<{ id: string }>("select id from public.cellar_fridges where cellar_id='1'")).rows[0].id;
  return { db, as, id, migration };
}

test('fridge validation accepts level zero and rejects invalid ranges, names and IDs', () => {
  assert.deepEqual(fridgeInput({ name: ' A ', levelCount: 7, firstLevel: 0, cellar_id: 'foreign' }), { name: 'A', levelCount: 7, firstLevel: 0 });
  for (const body of [null, [], {}, { name: 'A', levelCount: 0, firstLevel: 1 }, { name: 'A', levelCount: 51, firstLevel: 1 }, { name: 'A', levelCount: 2.5, firstLevel: 1 }, { name: 'A', levelCount: 6, firstLevel: 2 }, { name: ' ', levelCount: 6, firstLevel: 1 }, { name: 'A', levelCount: 6, firstLevel: 1, id: 'x' }]) assert.throws(() => fridgeInput(body));
});

test('storage migration shifts Wine Fridge A exactly once, preserves other cellars and legacy labels', async () => {
  const { db, migration } = await setup();
  try {
    assert.deepEqual((await db.query("select name, level_count, first_level from public.cellar_fridges where cellar_id='1'")).rows, [{ name: 'Wine Fridge A', level_count: 7, first_level: 1 }]);
    const wines = (await db.query<Pick<WineRow, 'id' | 'cellar_id' | 'location' | 'quantity'>>('select id, cellar_id, location, quantity from public.wines order by id')).rows;
    assert.deepEqual(wines.map(w => [w.id, w.location]), [
      ['five', 'Wine Fridge A - L6'], ['legacy', 'Basement rack'], ['one', 'Wine Fridge A - L2'],
      ['other', 'Adega A - L0'], ['six', 'Wine Fridge A - L7'], ['zero', 'Wine Fridge A - L1'],
    ]);
    assert.equal((await db.query("select * from public.cellar_storage_locations where cellar_id='1' and fridge_id is not null")).rows.length, 7);
    await db.exec(migration);
    assert.deepEqual((await db.query<Pick<WineRow, 'id' | 'cellar_id' | 'location' | 'quantity'>>('select id, cellar_id, location, quantity from public.wines order by id')).rows, wines);
    await db.exec("insert into public.cellars (id, name) values ('new', 'New cellar'); insert into public.wines (cellar_id, bottle, country, style) values ('new', 'New bottle', 'France', 'Red')");
  } finally { await db.close(); }
});

test('fridge edits cascade labels, protect occupied levels and stay intact after rerunning migration', async () => {
  const { db, as, id, migration } = await setup();
  try {
    await as(owner);
    await db.query("select public.save_cellar_fridge('1', 'Kitchen fridge', 7, 1, $1)", [id]);
    assert.equal((await db.query<{ location: string }>("select location from public.wines where id='zero'")).rows[0].location, 'Kitchen fridge - L1');
    await assert.rejects(db.query("select public.save_cellar_fridge('1', 'Failed rename', 6, 1, $1)", [id]), /foreign key/);
    assert.equal((await db.query<{ name: string }>("select name from public.cellar_fridges where id=$1", [id])).rows[0].name, 'Kitchen fridge');
    await assert.rejects(db.query("select public.delete_cellar_fridge('1', $1)", [id]), /foreign key/);
    await db.exec("update public.wines set location='Kitchen fridge - L3' where id='six'");
    await db.query("select public.save_cellar_fridge('1', 'Kitchen fridge', 6, 1, $1)", [id]);
    await assert.rejects(db.exec("update public.wines set location='Kitchen fridge - L7' where id='zero'"), /foreign key/);
    await db.query("select public.save_cellar_fridge('1', 'Kitchen fridge', 8, 1, $1)", [id]);
    await db.exec('reset role');
    const before = (await db.query('select * from public.cellar_fridges order by id')).rows;
    const locations = (await db.query('select * from public.cellar_storage_locations order by cellar_id, label')).rows;
    await db.exec('reset role'); await db.exec(migration);
    assert.deepEqual((await db.query('select * from public.cellar_fridges order by id')).rows, before);
    assert.deepEqual((await db.query('select * from public.cellar_storage_locations order by cellar_id, label')).rows, locations);
    await as(owner);
    await db.exec("update public.wines set location='' where location like 'Kitchen fridge%'");
    await db.query("select public.delete_cellar_fridge('1', $1)", [id]);
    assert.equal((await db.query('select * from public.cellar_fridges')).rows.length, 0);
  } finally { await db.close(); }
});

test('only owners manage fridges, members select locations only from their own cellar', async () => {
  const { db, as, id } = await setup();
  try {
    await as(member);
    assert.equal((await db.query('select * from public.cellar_fridges')).rows.length, 1);
    assert.equal((await db.query("select * from public.cellar_storage_locations where cellar_id='2'")).rows.length, 0);
    await assert.rejects(db.exec("select public.save_cellar_fridge('1', 'Bad', 6)"), /Only the cellar owner/);
    await assert.rejects(db.query("select public.delete_cellar_fridge('1', $1)", [id]), /Only the cellar owner/);
    await assert.rejects(db.exec("update public.cellar_fridges set name='Bad'"), /permission denied/);
    await assert.rejects(db.exec("insert into public.cellar_storage_locations values ('1', 'Invented', null, null)"), /permission denied/);
    await assert.rejects(db.exec("update public.wines set location='Adega A - L0' where id='zero'"), /foreign key/);
    await assert.rejects(db.exec("update public.wines set location='Wine Fridge A - L99' where id='zero'"), /foreign key/);
    await db.exec("update public.wines set location='Wine Fridge A - L4' where id='zero'");
    await as(outsider);
    await assert.rejects(db.query("select public.save_cellar_fridge('2', 'Stolen', 7, 1, $1)", [id]), /not found/);
    await as(owner);
    await db.exec("select public.save_cellar_fridge('1', 'Second fridge', 4, 0)");
    await assert.rejects(db.exec("select public.save_cellar_fridge('1', 'SECOND FRIDGE', 3, 1)"), /duplicate key/);
    await db.exec('set role anon');
    await assert.rejects(db.exec('select * from public.cellar_fridges'), /permission denied/);
    await assert.rejects(db.exec("select public.save_cellar_fridge('1', 'Bad', 1)"), /permission denied/);
  } finally { await db.close(); }
});

test('consumption keeps remaining bottles on their shelf and clears the consumed location', async () => {
  const { db, as } = await setup();
  try {
    await as(owner);
    const person = (await db.query<{ id: string }>('select id from public.cellar_people where user_id=$1', [owner])).rows[0].id;
    await db.query("select public.consume_wine('1', 'zero', 1, '2026-09-16', array[$1]::uuid[], 93, 'Lovely')", [person]);
    assert.deepEqual((await db.query("select quantity, location from public.wines where id='zero'")).rows, [{ quantity: 2, location: 'Wine Fridge A - L1' }]);
    assert.deepEqual((await db.query("select quantity, location from public.wines where status='consumed'")).rows, [{ quantity: 1, location: '' }]);
  } finally { await db.close(); }
});

test('Wine Cellar A merges into Wine Fridge A at current levels without changing other wine data', async () => {
  const { db, as, id } = await setup();
  try {
    await as(owner);
    await db.exec("select public.save_cellar_fridge('1', 'Wine Cellar A', 8, 1)");
    await db.exec("update public.wines set location='Wine Cellar A - L3' where id='one'; update public.wines set location='Wine Cellar A - L8' where id='six'");
    await db.exec('reset role');
    await db.exec("insert into public.cellar_storage_locations (cellar_id, label) values ('1', 'wine cellar A -  L2'), ('1', 'Wine Cellar A - L2 & L6'), ('2', 'Wine Cellar A - L3'); update public.wines set location='wine cellar A -  L2' where id='legacy'; update public.wines set location='Wine Cellar A - L2 & L6' where id='five'; update public.wines set location='Wine Cellar A - L3' where id='other'");
    const before = (await db.query<WineRow>('select * from public.wines order by cellar_id, id')).rows;
    const merge = await readFile('supabase/migrations/20260917000000_merge_wine_fridge_a.sql', 'utf8');
    await db.exec(merge);
    const after = (await db.query<WineRow>('select * from public.wines order by cellar_id, id')).rows;
    assert.deepEqual(after.map(({ location, updated_at, ...wine }) => wine), before.map(({ location, updated_at, ...wine }) => wine));
    assert.deepEqual(after.map(w => [w.id, w.location]), [
      ['five', 'Wine Fridge A - L2 & L6'], ['legacy', 'Wine Fridge A - L2'], ['one', 'Wine Fridge A - L3'],
      ['six', 'Wine Fridge A - L8'], ['zero', 'Wine Fridge A - L1'], ['other', 'Wine Cellar A - L3'],
    ]);
    assert.deepEqual((await db.query("select id, name, level_count from public.cellar_fridges where cellar_id='1'")).rows, [{ id, name: 'Wine Fridge A', level_count: 8 }]);
    assert.equal((await db.query("select * from public.cellar_storage_locations where cellar_id='1' and label ilike 'wine cellar%'")).rows.length, 0);
    const slots = (await db.query('select * from public.cellar_storage_locations order by cellar_id, label')).rows;
    await db.exec(merge);
    assert.deepEqual((await db.query<WineRow>('select * from public.wines order by cellar_id, id')).rows, after);
    assert.deepEqual((await db.query('select * from public.cellar_storage_locations order by cellar_id, label')).rows, slots);
  } finally { await db.close(); }
});
