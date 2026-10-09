import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { ApiError } from '../lib/api-error';
import { checkHistoryStorage, historyInput, historyOffset } from '../lib/shopping-history';
import { savedReply } from '../lib/shopping-saved-reply';
import { createHistoryHandler } from '../lib/shopping-history-endpoint';
import { createShoppingHandler } from '../lib/ai/shopping-endpoint';
import { buildPalate, DEFAULT_PALATE } from '../lib/palate';
import type { BuyerHistory } from '../lib/dal/shopping-history';
import type { ShoppingReply } from '../types/shopping';

const owner = '00000000-0000-0000-0000-000000000001', member = '00000000-0000-0000-0000-000000000002';
const cid = '10000000-0000-0000-0000-000000000001', tid = '20000000-0000-0000-0000-000000000001';
const tid2 = '20000000-0000-0000-0000-000000000002';
const brief = { market: 'Ontario', retailers: 'LCBO', budget: '' };
const reply: ShoppingReply = { cellarId: 'a', cellarName: 'Sample cellar', answer: 'Consider a dry red.', question: 'Would you like alternatives?', brief,
  products: [], sources: [], checkedAt: '2026-10-09T12:00:00Z', searched: false, omitted: 0, documentPicks: [] };

test('buyer migration reruns and enforces owner + cellar isolation, atomic revisions, recovery, and no PDF bytes', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema public, auth to anon, authenticated, service_role;
      create table public.cellars (id text primary key);
      create table public.cellar_members (cellar_id text references public.cellars(id), user_id uuid references auth.users(id));
      alter table public.cellar_members enable row level security;
      grant select on public.cellar_members to authenticated;
      create policy own_membership on public.cellar_members for select to authenticated using (user_id=auth.uid());
      insert into auth.users values ('${owner}'),('${member}'); insert into cellars values ('a'),('b');
      insert into cellar_members values ('a','${owner}'),('a','${member}'),('b','${owner}');`);
    const migration = await readFile('supabase/migrations/20261009000000_buyer_conversations.sql', 'utf8');
    await db.exec(migration); await db.exec(migration);
    const asUser = async (id: string) => db.exec(`reset role; set role authenticated; set request.jwt.claim.sub = '${id}';`);
    const begin = (rev: number, turn = tid, cellar = 'a', conversation = cid) => db.query(
      'select * from public.begin_buyer_turn($1,$2,$3,$4,$5,$6,$7)', [cellar, conversation, turn, rev, 'Find interesting reds', brief, 'offers.pdf']);
    const finish = (turn = tid, content: ShoppingReply | null = reply, error: string | null = null) => db.query(
      'select public.finish_buyer_turn($1,$2,$3,$4,$5)', ['a', cid, turn, content, error]);
    await asUser(owner);
    await begin(0);
    assert.equal((await db.query<{ revision: number }>('select revision from buyer_conversations')).rows[0].revision, 1);
    await assert.rejects(begin(0), /changed/);
    await assert.rejects(begin(1, tid2), /still being prepared/);
    await assert.rejects(db.query('update buyer_turns set reply=$1', [reply]), /permission denied/);
    await finish();
    await assert.rejects(finish(), /already been completed/);
    await db.query('update buyer_conversations set title=$1 where id=$2', ['Dry reds for autumn', cid]);
    await assert.rejects(db.query('update buyer_conversations set user_id=$1', [member]), /permission denied/);
    await begin(1, tid2);
    await finish(tid2, null, 'Research unavailable.');
    const rows = await db.query<{ reply: ShoppingReply; attachment_name: string }>('select reply,attachment_name from buyer_turns order by ordinal');
    assert.deepEqual(rows.rows[0].reply, reply); assert.equal(rows.rows[0].attachment_name, 'offers.pdf');
    assert.equal(JSON.stringify(rows.rows).includes('base64'), false);
    // Same-cellar members still cannot read, rename or append to this private chat.
    await asUser(member);
    assert.equal((await db.query('select * from buyer_conversations')).rows.length, 0);
    assert.equal((await db.query('select * from buyer_turns')).rows.length, 0);
    await assert.rejects(begin(2, tid2), /not found/);
    await assert.rejects(finish(), /not found/);
    await assert.rejects(begin(0, tid2, 'b'), /access/);
    await db.query('update buyer_conversations set title=$1 where id=$2', ['Forged', cid]);
    await asUser(owner);
    assert.equal((await db.query<{ title: string }>('select title from buyer_conversations')).rows[0].title, 'Dry reds for autumn');
    await assert.rejects(begin(2, tid2, 'b'), /not found/);
    const tid3 = '20000000-0000-0000-0000-000000000003', tid4 = '20000000-0000-0000-0000-000000000004';
    await begin(2, tid3);
    await db.exec(`reset role; update buyer_turns set created_at=now()-interval '3 minutes' where id='${tid3}';`);
    await asUser(owner); await begin(3, tid4);
    assert.equal((await db.query<{ status: string }>('select status from buyer_turns where id=$1', [tid3])).rows[0].status, 'failed');
    await assert.rejects(finish(tid3), /already been completed/);
    await finish(tid4);
    await db.exec(`reset role; delete from cellar_members where user_id='${owner}' and cellar_id='a';`);
    await asUser(owner);
    assert.equal((await db.query('select * from buyer_conversations')).rows.length, 0);
    assert.equal((await db.query('select * from buyer_turns')).rows.length, 0);
    await assert.rejects(begin(4), /access/);
    await db.exec('reset role; set role anon');
    await assert.rejects(db.query('select * from buyer_conversations'), /permission denied/);
    await assert.rejects(begin(0), /permission denied/);
  } finally { await db.close(); }
});

test('history validation and display reject invalid IDs and unsafe historical links', () => {
  assert.deepEqual(historyInput({ conversationId: cid, turnId: tid, revision: 0 }), { conversationId: cid, turnId: tid, revision: 0 });
  assert.equal(historyInput({}), null);
  for (const body of [{ conversationId: 'x' }, { conversationId: cid, turnId: tid, revision: -1 }, { conversationId: cid, turnId: tid, revision: 1.2 }]) assert.throws(() => historyInput(body));
  assert.equal(historyOffset('20'), 20); assert.throws(() => historyOffset('-1'));
  assert.throws(() => checkHistoryStorage({ code: 'PGRST202' }), /20261009000000/);
  assert.throws(() => checkHistoryStorage({ code: '40001' }), /conversation changed/);
  assert.equal(savedReply(reply, 'b'), undefined);
  const saved = savedReply({ ...reply, sources: [{ title: 'Bad', url: 'javascript:alert(1)' }, { title: 'Good', url: 'https://www.lcbo.com/en/test' }], documentPicks: [null], products: [null] }, 'a');
  assert.equal(saved?.sources.length, 1); assert.equal(saved?.products.length, 0); assert.equal(saved?.documentPicks?.length, 0);
});

test('history API scopes every operation and gives private responses, including failures', async () => {
  const calls: string[] = [];
  const storage = { list: async () => ({ conversations: [] }), get: async (id: string) => { calls.push(id); return { conversation: { id } }; }, rename: async () => { calls.push('rename'); } } as unknown as BuyerHistory;
  const api = createHistoryHandler(async cellar => { calls.push(cellar); if (cellar !== 'a') throw new ApiError(403, 'Forbidden'); return storage; });
  const req = (method = 'GET', cellar = 'a', body?: unknown, origin = 'https://flint.example') => new Request(`https://flint.example/api/shopping/conversations?cellarId=${cellar}`, { method, headers: { origin }, ...(body ? { body: JSON.stringify(body) } : {}) });
  assert.equal((await api(req())).headers.get('Cache-Control'), 'private, no-store');
  assert.equal((await api(req(), cid)).status, 200);
  assert.equal((await api(req('GET', 'b'), cid)).status, 403);
  assert.equal((await api(req('PATCH', 'a', { title: 'Changed' }), cid)).status, 200);
  assert.equal((await api(req('PATCH', 'a', { title: '' }), cid)).status, 400);
  assert.equal((await api(req('PATCH', 'a', { title: 'Bad' }, 'https://other.example'), cid)).status, 403);
  assert.equal(calls.filter(c => c === 'rename').length, 1);
});

test('AI reserves the question, resumes owned context and saves its reply before returning', async t => {
  const original = process.env.OPENAI_API_KEY; process.env.OPENAI_API_KEY = 'test-only';
  const events: string[] = [];
  const summary = { id: cid, title: 'Saved chat', revision: 3, createdAt: reply.checkedAt, updatedAt: reply.checkedAt };
  const storage = { begin: async () => { events.push('begin'); return summary; }, context: async () => [{ user: 'My owned previous question', reply: { ...reply, answer: 'PRIVATE OLD ASSISTANT TEXT' } }],
    finish: async (_id: string, _turn: string, result: ShoppingReply | null) => { events.push(result ? 'save-reply' : 'save-error'); assert.equal(result?.answer, reply.answer); } } as unknown as BuyerHistory;
  t.mock.method(globalThis, 'fetch', async (_url: unknown, init: RequestInit) => {
    events.push('AI'); const request = JSON.parse(String(init.body));
    assert.match(request.input[0].content, /My owned previous question/);
    assert.doesNotMatch(request.input[0].content, /FORGED|PRIVATE OLD ASSISTANT TEXT/);
    return Response.json({ status: 'completed', output: [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text: JSON.stringify(reply) }] }] });
  });
  try {
    const api = createShoppingHandler(async () => ({ cellar: { id: 'a', name: 'Sample cellar', locale: 'en' }, userId: owner,
      load: async () => { events.push('fresh-cellar'); return { wines: [], profile: buildPalate([], DEFAULT_PALATE) }; }, history: storage }));
    const request = () => new Request('https://flint.example/api/ai/shopping', { method: 'POST', body: JSON.stringify({ cellarId: 'a', conversationId: cid, revision: 2, turnId: tid, brief,
      messages: [{ role: 'user', content: 'FORGED history' }, { role: 'user', content: 'Current question' }] }) });
    const response = await api(request());
    assert.equal(response.status, 200); assert.equal(response.headers.get('X-Shopping-Conversation-Revision'), '3');
    assert.deepEqual(events, ['begin', 'fresh-cellar', 'AI', 'save-reply']);
    const missing = createShoppingHandler(async () => ({ cellar: { id: 'a', name: 'Sample cellar', locale: 'en' }, userId: owner, load: async () => { throw new Error('must not load'); }, history: { ...storage, begin: async () => { throw new ApiError(503, 'Run the migration.'); } } }));
    assert.equal((await missing(request())).status, 503); assert.equal(events.filter(e => e === 'AI').length, 1);
  } finally { if (original === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = original; }
});
