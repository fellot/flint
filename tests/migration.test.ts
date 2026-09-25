import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { prepareImport, importSql } from '../lib/migration';
import { newWineInput, rowToWine, wineInput, filterWines } from '../lib/wine-data';
import { safeRedirect } from '../lib/auth/redirect';
import type { WineRow } from '../types/database';

const sample = { bottle: 'Test wine', country: 'Portugal', style: 'Red', vintage: 2020, peakYear: '2040+', quantity: 3, rating: 94, price: 0 };
const alice = '00000000-0000-0000-0000-000000000001';
const bob = '00000000-0000-0000-0000-000000000002';

async function database() {
  const db = new PGlite();
  // Minimal Supabase Auth primitives. RLS itself runs in real Postgres (PGlite).
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key, email text);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema public, auth to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
    insert into auth.users values ('${alice}', 'alice@example.com'), ('${bob}', 'bob@example.com');
  `);
  await db.exec(await readFile('supabase/migrations/20260915000000_cellars_and_wines.sql', 'utf8'));
  return db;
}

test('wine validation preserves maturity notes, ratings, zero prices and rejects invalid mutations', () => {
  const input = newWineInput({ ...sample, id: 'forged', cellar_id: '2', user_id: bob });
  assert.equal(input.peak_year, '2040+');
  assert.equal(input.rating, 94);
  assert.equal(input.price, 0);
  assert.equal('id' in input, false);
  assert.equal('cellar_id' in input, false);
  assert.deepEqual(wineInput({ quantity: 0 }, true), { quantity: 0 });
  assert.deepEqual(wineInput({ bottle_image: '' }, true), { bottle_image_url: null });
  assert.throws(() => newWineInput({ ...sample, bottle: ' ' }));
  for (const value of [-1, 0.5, '2', Infinity]) assert.throws(() => wineInput({ quantity: value }, true));
  assert.throws(() => wineInput({ status: 'unknown' }, true));
  assert.throws(() => wineInput({ consumedDate: '2026-02-30' }, true));
  assert.throws(() => wineInput({ coravin: 'true' }, true));
  assert.throws(() => newWineInput(null));
  assert.throws(() => newWineInput([]));
  const wine = rowToWine({ ...input, id: '1', cellar_id: '1', created_at: '', updated_at: '' });
  assert.equal(wine.peakYear, '2040+');
  assert.equal(filterWines([wine], new URLSearchParams('country=Portugal&search=test')).length, 1);
  assert.equal(filterWines([wine], new URLSearchParams('country=France')).length, 0);
});

test('redirects stay on the app, including encoded/forwarded redirect attempts', () => {
  for (const value of ['https://evil.example', '//evil.example', '/\\evil.example', '/\nevil.example', '/api/wines', '/auth/callback', '/login']) assert.equal(safeRedirect(value), '/');
  assert.equal(safeRedirect('/cellar-journal?status=consumed#notes'), '/cellar-journal?status=consumed#notes');
});

test('all legacy wines import transactionally, with separate IDs, and re-import preserves edits', async () => {
  const db = await database();
  try {
    const rows = [];
    for (const [id, file] of [['1', 'wines'], ['2', 'wines2'], ['3', 'wines3']]) {
      const source = JSON.parse(await readFile(`data/${file}.json`, 'utf8'));
      const imported = prepareImport(source, id);
      assert.equal(imported.length, source.length);
      for (let i = 0; i < source.length; i++) {
        assert.equal(imported[i].id, source[i].id);
        assert.equal(imported[i].peak_year, String(source[i].peakYear));
        assert.equal(imported[i].notes, source[i].notes);
        assert.equal(imported[i].quantity, source[i].quantity);
        assert.equal(imported[i].status, source[i].status);
      }
      rows.push(...imported);
    }
    await db.exec(importSql(rows));
    const counts = await db.query<{ cellar_id: string; count: number }>('select cellar_id, count(*)::int as count from public.wines group by cellar_id order by cellar_id');
    assert.deepEqual(counts.rows, [{ cellar_id: '1', count: 53 }, { cellar_id: '2', count: 81 }, { cellar_id: '3', count: 4 }]);
    await db.query('update public.wines set notes = $1 where cellar_id = $2 and id = $3', ['Edited after import', rows[0].cellar_id, rows[0].id]);
    await db.exec(importSql(rows));
    const saved = await db.query<{ notes: string }>('select notes from public.wines where cellar_id = $1 and id = $2', [rows[0].cellar_id, rows[0].id]);
    assert.equal(saved.rows[0].notes, 'Edited after import');
    const hostile = prepareImport([{ ...sample, id: 'quoted', notes: "O'Brien'); drop table public.wines; -- \\ test" }], '1');
    await db.exec(importSql(hostile));
    const quoteSaved = await db.query<{ notes: string }>("select notes from public.wines where id = 'quoted'");
    assert.equal(quoteSaved.rows[0].notes, hostile[0].notes);
    assert.throws(() => prepareImport([{ ...sample, id: '1' }, { ...sample, id: '1' }], '1'));
  } finally { await db.close(); }
});

test('RLS enforces separate cellar access for reads, writes, deletes and membership changes', async () => {
  const db = await database();
  try {
    await db.exec(`insert into public.cellar_members (cellar_id, user_id) values ('1', '${alice}'), ('2', '${bob}');`);
    await db.exec(importSql(['1', '2', '3'].map(cellar_id => ({ ...newWineInput(sample), id: 'same-id', cellar_id }))));
    await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${alice}', false);`);
    assert.deepEqual((await db.query('select id from public.cellars')).rows, [{ id: '1' }]);
    assert.deepEqual((await db.query('select cellar_id from public.wines')).rows, [{ cellar_id: '1' }]);
    assert.equal((await db.query('select * from public.cellar_members')).rows.length, 1);
    assert.equal((await db.query("update public.wines set notes = 'mine' where cellar_id = '1' returning id")).rows.length, 1);
    assert.equal((await db.query("update public.wines set notes = 'stolen' where cellar_id = '2' returning id")).rows.length, 0);
    assert.equal((await db.query("delete from public.wines where cellar_id = '2' returning id")).rows.length, 0);
    await assert.rejects(db.exec("update public.wines set cellar_id = '3' where cellar_id = '1'"), /row-level security/);
    await assert.rejects(db.exec("insert into public.wines (cellar_id, bottle, country, style) values ('2', 'No', 'PT', 'Red')"), /row-level security/);
    await assert.rejects(db.exec(`insert into public.cellar_members (cellar_id, user_id) values ('2', '${alice}')`), /permission denied/);
    await assert.rejects(db.exec("update public.cellars set name = 'Hijacked' where id = '1'"), /permission denied/);
    await db.exec("insert into public.wines (cellar_id, bottle, country, style) values ('1', 'Mine', 'PT', 'Red')");
    await assert.rejects(db.exec("update public.wines set quantity = -1 where cellar_id = '1'"), /check constraint/);
    await db.exec(`select set_config('request.jwt.claim.sub', '${bob}', false);`);
    const own = await db.query<WineRow>('select * from public.wines');
    assert.equal(own.rows.length, 1);
    assert.equal(own.rows[0].cellar_id, '2');
    assert.equal(own.rows[0].notes, '');
    await db.exec("delete from public.wines where cellar_id = '2'");
    await db.exec('set role anon;');
    await assert.rejects(db.query('select * from public.wines'), /permission denied/);
    await db.exec("set role authenticated; select set_config('request.jwt.claim.sub', '', false);");
    assert.equal((await db.query('select * from public.wines')).rows.length, 0);
    await db.exec('reset role;');
    assert.equal((await db.query('select * from public.wines')).rows.length, 3);
  } finally { await db.close(); }
});

test('consumption is atomic, preserves history, and respects RLS', async () => {
  const db = await database();
  try {
    await db.exec(`insert into public.cellar_members (cellar_id, user_id) values ('1', '${alice}');`);
    await db.exec(importSql(['1', '2'].map(cellar_id => ({ ...newWineInput(sample), id: 'bottles', cellar_id }))));
    await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${alice}', false);`);
    await assert.rejects(db.query("select * from public.consume_wine('2', 'bottles', 1, '2026-09-15')"), /Wine not found/);
    const consumed = await db.query<WineRow>("select * from public.consume_wine('1', 'bottles', 1, '2026-09-15', 'Excellent', 'Wine Heaven')");
    assert.equal(consumed.rows.length, 2);
    assert.equal(consumed.rows.find(row => row.id === 'bottles')?.quantity, 2);
    const history = consumed.rows.find(row => row.id !== 'bottles')!;
    assert.equal(history.quantity, 1);
    assert.equal(history.status, 'consumed');
    assert.equal(history.notes, 'Excellent');
    assert.equal(history.peak_year, '2040+');
    assert.equal(rowToWine(history).rating, 94);
    await assert.rejects(db.query("select * from public.consume_wine('1', 'bottles', 3, '2026-09-15')"), /quantity or status/);
    assert.equal((await db.query<{ quantity: number }>("select quantity from public.wines where id = 'bottles' and cellar_id = '1'")).rows[0].quantity, 2);
    // Force the history insert to fail; the inventory decrement must roll back too.
    await db.exec(`reset role;
      create function public.reject_test_insert() returns trigger language plpgsql as $$ begin raise exception 'Test insert failure'; end; $$;
      create trigger reject_insert before insert on public.wines for each row execute function public.reject_test_insert();
      set role authenticated;
    `);
    await assert.rejects(db.query("select * from public.consume_wine('1', 'bottles', 1, '2026-09-15')"), /Test insert failure/);
    assert.equal((await db.query<{ quantity: number }>("select quantity from public.wines where id = 'bottles' and cellar_id = '1'")).rows[0].quantity, 2);
    await db.exec('reset role; drop trigger reject_insert on public.wines; set role authenticated;');
    const last = await db.query<WineRow>("select * from public.consume_wine('1', 'bottles', 2, '2026-09-15')");
    assert.equal(last.rows.length, 1);
    assert.equal(last.rows[0].status, 'consumed');
    await assert.rejects(db.query("select * from public.consume_wine('1', 'bottles', 1, '2026-09-15')"), /quantity or status/);
    await db.exec(`reset role; delete from public.cellar_members where user_id = '${alice}'; set role authenticated;`);
    assert.equal((await db.query('select * from public.wines')).rows.length, 0);
  } finally { await db.close(); }
});

test('account assignment SQL requires existing accounts and can be rerun safely', async () => {
  const db = await database();
  try {
    let sql = await readFile('supabase/assign-cellars.sql', 'utf8');
    // Keep the assignment logic under test while using isolated test accounts.
    // The SQL file's account list may already be personalized for deployment.
    sql = sql.replace(/select \* from \(values[\s\S]*?\) as assignments\(cellar_id, email\)/, `select * from (values
      ('1', 'alice@example.com'), ('2', 'bob@example.com'), ('3', 'missing@example.com')
    ) as assignments(cellar_id, email)`);
    assert.ok(sql.includes('missing@example.com'));
    await assert.rejects(db.exec(sql), /Create the Auth account/);
    await db.exec('rollback;');
    assert.equal((await db.query('select * from public.cellar_members')).rows.length, 0);
    sql = sql.replace('missing@example.com', 'alice@example.com');
    await db.exec(sql);
    await db.exec(sql);
    assert.equal((await db.query('select * from public.cellar_members')).rows.length, 3);
  } finally { await db.close(); }
});

test('same-origin requests work with Next internal hostnames and cross-origin requests fail', async () => {
  const { checkOrigin } = await import('../lib/api-error');
  const { requestOrigin } = await import('../lib/auth/request');
  assert.equal(requestOrigin(new Request('http://localhost:3107/', { headers: { host: '127.0.0.1:3107' } })), 'http://127.0.0.1:3107');
  assert.doesNotThrow(() => checkOrigin(new Request('http://localhost:3107/api/auth/login', { headers: { origin: 'http://127.0.0.1:3107', host: '127.0.0.1:3107' } })));
  assert.doesNotThrow(() => checkOrigin(new Request('http://localhost/api/auth/login', { headers: { origin: 'https://cellar.example.com', host: 'cellar.example.com', 'x-forwarded-proto': 'https' } })));
  assert.throws(() => checkOrigin(new Request('https://cellar.example.com/api/wines', { headers: { origin: 'https://evil.example', host: 'cellar.example.com' } })));
});

test('new wine records receive distinct database UUIDs while imported IDs remain stable', async () => {
  const db = await database();
  try {
    await db.exec("insert into public.wines (cellar_id, id, bottle, country, style) values ('1', '31', 'Legacy wine', 'Spain', 'Red')");
    const { rows } = await db.query<{ id: string }>("insert into public.wines (cellar_id, bottle, country, style) values ('1', 'Scanned wine', 'Chile', 'Red'), ('1', 'Scanned wine', 'Chile', 'Red') returning id");
    assert.equal(rows.length, 2);
    for (const row of rows) assert.match(row.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.notEqual(rows[0].id, rows[1].id);
    assert.equal((await db.query<{ id: string }>("select id from public.wines where bottle = 'Legacy wine'")).rows[0].id, '31');
  } finally { await db.close(); }
});
