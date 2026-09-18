import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const sql = readFileSync('supabase/reviews/20260918-critic-ratings.sql', 'utf8');
const wines = JSON.parse(readFileSync('supabase/reviews/20260917-wine-audit.json', 'utf8')).wines;
const owner = '00000000-0000-0000-0000-000000000001';

async function setup() {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth;
    create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    insert into auth.users values ('${owner}', 'owner@example.com', now(), '{}');`);
  for (const file of readdirSync('supabase/migrations').sort()) {
    await db.exec(readFileSync(`supabase/migrations/${file}`, 'utf8'));
    if (file === '20260915000000_cellars_and_wines.sql') {
      await db.exec(`insert into public.cellar_members values ('1', '${owner}', now());`);
    }
  }
  for (const { original } of wines) {
    const keys = Object.keys(original);
    await db.query(`insert into public.wines (${keys.join(',')}, rating, notes)
      values (${keys.map((_, i) => `$${i + 1}`).join(',')}, 88, 'Keep my note')`, Object.values(original));
  }
  await db.exec(`insert into public.wines (cellar_id,id,bottle,vintage,country,style,rating)
    values ('2','1','Other cellar',2019,'France','Red',87);`);
  return db;
}
async function snapshot(db: PGlite) {
  return (await db.query<{ row: Record<string, unknown> }>(
    'select to_jsonb(w) as row from public.wines w order by cellar_id,id')).rows.map(r => r.row);
}

test('critic import sets 22 wines, chooses highest conflicts, keeps range labels and personal data, and reruns without writes', async () => {
  const db = await setup();
  try {
    const before = await snapshot(db);
    const results = (await db.exec(sql)).flatMap(r => r.rows) as { result: string }[];
    assert.equal(results.filter(r => r.result === 'updated').length, 22);
    const after = await snapshot(db);
    const existingFields = (rows: Record<string, unknown>[]) => rows.map(({ updated_at, critic_rating, critic_ratings, ...rest }) => rest);
    assert.deepEqual(existingFields(after), existingFields(before));
    const byId = (id: string) => after.find(r => r.cellar_id === '1' && r.id === id)!;
    assert.equal(Number(byId('22').critic_rating), 96);
    assert.equal(Number(byId('28').critic_rating), 95);
    assert.equal(Number(byId('27').critic_rating), 96);
    assert.equal((byId('27').critic_ratings as any).wine_advocate.display_score, '94–96');
    assert.equal((byId('1764117575388').critic_ratings as any).wine_advocate.display_score, '98+');
    for (const id of ['6', '34', '1788389989910', '8', '2', '678c0dfe-4b3d-4fb8-80ce-19722210ea93', '39']) {
      assert.equal(byId(id).critic_rating, null);
    }
    await db.exec(sql);
    assert.deepEqual(await snapshot(db), after);

    // Existing complete-row RPC inserts must remain compatible with new columns.
    await db.exec(`select set_config('request.jwt.claim.sub','${owner}',false);
      update public.wines set quantity=2 where cellar_id='1' and id='1';`);
    const person = (await db.query<{ id: string }>('select id from public.cellar_people where user_id=$1', [owner])).rows[0].id;
    await db.query(`select * from public.consume_wine('1','1',1,'2026-09-18',array[$1]::uuid[],83,'My own score')`, [person]);
    const consumed = (await db.query<any>("select * from public.wines where cellar_id='1' and status='consumed'")).rows[0];
    assert.equal(Number(consumed.critic_rating), 100);
    assert.deepEqual((await db.query('select rating,comment from public.wine_reviews')).rows, [{ rating: 83, comment: 'My own score' }]);
    const { critic_rating, critic_ratings, ...outside } = consumed;
    const logged = await db.query<any>(`select * from public.log_consumed_wine('1',$1::jsonb,array[$2]::uuid[],79,'Outside tasting')`, [JSON.stringify(outside), person]);
    assert.equal(logged.rows[0].critic_rating, null);
  } finally { await db.close(); }
});

test('critic import skips changed identities, inactive records and later critic edits', async () => {
  const db = await setup();
  try {
    await db.exec(`update public.wines set vintage=2020 where cellar_id='1' and id='1';
      update public.wines set status='consumed' where cellar_id='1' and id='24';
      update public.wines set quantity=0 where cellar_id='1' and id='25';
      delete from public.wines where cellar_id='1' and id='21';`);
    const results = (await db.exec(sql)).flatMap(r => r.rows) as { id: string; result: string }[];
    assert.equal(results.find(r => r.id === '1')?.result, 'skipped: wine identity changed');
    assert.equal(results.find(r => r.id === '24')?.result, 'skipped: no longer in stock');
    assert.equal(results.find(r => r.id === '25')?.result, 'skipped: no longer in stock');
    assert.equal(results.find(r => r.id === '21')?.result, 'skipped: record missing');
    await db.exec(`update public.wines set critic_rating=99, critic_ratings='{"later_review":99}' where cellar_id='1' and id='22';`);
    const before = await snapshot(db);
    const rerun = (await db.exec(sql)).flatMap(r => r.rows) as { id: string; result: string }[];
    assert.match(rerun.find(r => r.id === '22')!.result, /existing critic data differs/);
    assert.deepEqual(await snapshot(db), before);
  } finally { await db.close(); }
});
