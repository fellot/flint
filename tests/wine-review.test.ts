import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const base = 'supabase/reviews/20260917-wine-audit';
const audit = JSON.parse(readFileSync(`${base}.json`, 'utf8')) as {
  wines: { original: Record<string, unknown> & { id: string }; changes: Record<string, string>; identity_flag: string | null }[];
};
const apply = readFileSync(`${base}.sql`, 'utf8');
const undo = readFileSync(`${base}.rollback.sql`, 'utf8');
const fields = ['drinking_window', 'peak_year', 'food_pairing_notes', 'meal_suggestion'];
const changed = audit.wines.filter(r => Object.keys(r.changes).length);

async function setup() {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role; create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql as $$ select null::uuid $$;`);
  await db.exec(readFileSync('supabase/migrations/20260915000000_cellars_and_wines.sql', 'utf8'));
  for (const r of audit.wines) {
    const columns = Object.keys(r.original);
    await db.query(`insert into public.wines (${columns.join(', ')}, status, location, notes)
      values (${columns.map((_, i) => `$${i+1}`).join(', ')}, 'in_cellar', 'Wine Fridge A - L3', 'Personal cellar note')`, Object.values(r.original));
  }
  await db.exec(`insert into public.wines (cellar_id, id, bottle, vintage, country, style, notes)
    values ('2', '1', 'Other cellar bottle', 2019, 'Argentina', 'Red', 'Other cellar note');
    insert into public.wines (cellar_id, id, bottle, vintage, country, style, status, notes, rating)
    values ('1', 'journal-copy', 'Consumed bottle', 2019, 'Argentina', 'Red', 'consumed', 'Private tasting comment', 97);`);
  return db;
}
async function snapshot(db: PGlite) {
  return (await db.query<{ row: Record<string, unknown> }>('select to_jsonb(w) as row from public.wines w order by cellar_id, id')).rows.map(r => r.row);
}
const withoutTimestamp = (rows: Record<string, unknown>[]) => rows.map(({ updated_at, ...rest }) => rest);

test('wine review covers all 29 exported wines, changes only four allowed fields, and preserves flagged identities', () => {
  assert.equal(audit.wines.length, 29);
  assert.equal(new Set(audit.wines.map(r => r.original.id)).size, 29);
  assert.equal(changed.length, 16);
  assert.equal(audit.wines.filter(r => r.identity_flag).length, 3);
  for (const r of audit.wines) {
    assert.equal(r.original.cellar_id, '1');
    if (r.identity_flag) assert.deepEqual(r.changes, {});
    for (const [key, value] of Object.entries(r.changes)) {
      assert.ok(fields.includes(key));
      assert.notEqual(value, r.original[key]);
    }
  }
});

test('review applies 16 changes, preserves unrelated data, reruns without writes, and restores original values', async () => {
  const db = await setup();
  try {
    const before = await snapshot(db);
    const results = await db.exec(apply);
    const plan = results.flatMap(r => r.rows) as { result: string; total_rows_changed: number }[];
    assert.equal(plan.filter(r => r.result === 'updated').length, 16);
    assert.ok(plan.every(r => r.total_rows_changed === 16));
    const after = await snapshot(db);
    for (const original of before) {
      const actual = after.find(r => r.cellar_id === original.cellar_id && r.id === original.id)!;
      const patch = original.cellar_id === '1' ? audit.wines.find(r => r.original.id === original.id)?.changes ?? {} : {};
      assert.deepEqual(withoutTimestamp([actual]), withoutTimestamp([{ ...original, ...patch }]));
    }
    await db.exec(apply);
    assert.deepEqual(await snapshot(db), after, 'rerun must not even modify timestamps');
    await db.exec(undo);
    assert.deepEqual(withoutTimestamp(await snapshot(db)), withoutTimestamp(before));
    const restored = await snapshot(db);
    await db.exec(undo);
    assert.deepEqual(await snapshot(db), restored);
  } finally { await db.close(); }
});

test('conflicting recommendation or changed identity aborts the entire review, including rollback', async () => {
  const db = await setup();
  try {
    await db.exec("update public.wines set food_pairing_notes='My newer pairing' where cellar_id='1' and id='1'");
    const conflict = await snapshot(db);
    await assert.rejects(db.exec(apply), /Review stopped[\s\S]*recommendation edited/);
    await db.exec('rollback');
    assert.deepEqual(await snapshot(db), conflict);
    await db.query("update public.wines set food_pairing_notes=$1, vintage=2020 where cellar_id='1' and id='1'", [audit.wines.find(r => r.original.id === '1')!.original.food_pairing_notes]);
    await assert.rejects(db.exec(apply), /identity changed/);
    await db.exec('rollback');
    await db.exec("update public.wines set vintage=2019 where cellar_id='1' and id='1'");
    await db.exec(apply);
    await db.exec("update public.wines set food_pairing_notes='A later personal edit' where cellar_id='1' and id='1'");
    const later = await snapshot(db);
    await assert.rejects(db.exec(undo), /Review stopped/);
    await db.exec('rollback');
    assert.deepEqual(await snapshot(db), later);
  } finally { await db.close(); }
});

test('consumed, missing and zero-stock records are skipped, new wines are reported, unrelated edits are preserved', async () => {
  const db = await setup();
  try {
    await db.exec(`update public.wines set status='consumed' where cellar_id='1' and id='1';
      update public.wines set quantity=0 where cellar_id='1' and id='24';
      delete from public.wines where cellar_id='1' and id='21';
      update public.wines set meal_suggestion='Keep my custom meal', notes='Do not change', quantity=3 where cellar_id='1' and id='31';
      insert into public.wines (cellar_id,id,bottle,vintage,country,style) values ('1','new-wine','New addition',2024,'France','Red');`);
    const before = await snapshot(db);
    const result = (await db.exec(apply)).flatMap(r => r.rows) as { id: string; result: string }[];
    assert.equal(result.find(r => r.id === '1')?.result, 'skipped: no longer in stock');
    assert.equal(result.find(r => r.id === '24')?.result, 'skipped: no longer in stock');
    assert.equal(result.find(r => r.id === '21')?.result, 'skipped: record missing');
    assert.equal(result.find(r => r.id === 'new-wine')?.result, 'unreviewed: added since export');
    assert.equal(result.filter(r => r.result === 'updated').length, 13);
    const after = await snapshot(db);
    for (const id of ['1','24','new-wine']) assert.deepEqual(after.find(r => r.cellar_id === '1' && r.id === id), before.find(r => r.cellar_id === '1' && r.id === id));
    const arzuaga = after.find(r => r.cellar_id === '1' && r.id === '31')!;
    assert.equal(arzuaga.meal_suggestion, 'Keep my custom meal');
    assert.equal(arzuaga.notes, 'Do not change');
    assert.equal(arzuaga.quantity, 3);
  } finally { await db.close(); }
});
