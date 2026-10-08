import test from 'node:test';
import assert from 'node:assert/strict';
import { parseShoppingPdf } from '../lib/ai/shopping-pdf';
import { readShoppingPdf, SHOPPING_PDF_MAX_BYTES, SHOPPING_REQUEST_MAX_BYTES } from '../lib/shopping-attachment';
import { buildShoppingRequest, parseShoppingResponse, shoppingAdvisor, shoppingContext, shoppingInput } from '../lib/ai/shopping-advisor';
import { createShoppingHandler } from '../lib/ai/shopping-endpoint';
import { DEFAULT_PALATE, buildPalate } from '../lib/palate';
import { ApiError } from '../lib/api-error';

// Transport/signature fixture. Provider calls are stubbed, never sent to OpenAI.
const bytes = Buffer.from('%PDF-1.7\n1 0 obj << /Type /Catalog >> endobj\n%%EOF\n');
const attachment = { name: 'Wine list.pdf', data: bytes.toString('base64') };
const brief = { market: '', retailers: '', budget: '' };
const profile = buildPalate([], DEFAULT_PALATE);
const context = shoppingContext([], profile);
const input = (overrides = {}) => shoppingInput({ cellarId: 'mine', messages: [{ role: 'user', content: 'What should I buy from this PDF?' }], brief, attachment, ...overrides });
const pick = { essentialId: 'barossa-shiraz', name: 'Sample Barossa Shiraz', vintage: 2022, country: 'Australia',
  region: 'Barossa Valley', grapes: 'Shiraz', style: 'Red', retailer: '', price: 50, currency: 'CAD', size: '750 mL',
  reason: 'Fills the Barossa gap.', drinkingGuidance: 'Estimated: drink or hold.', evidence: 'The list states 2022 Shiraz, 750 mL, CAD 50.', page: 2 };
const response = (picks: unknown[] = [pick], products: unknown[] = []) => ({ status: 'completed', output: [{ type: 'message', role: 'assistant', content: [
  { type: 'output_text', text: JSON.stringify({ answer: 'Consider this wine from your list.', question: '', brief, documentPicks: picks, products }) },
] }] });

test('browser and server accept a PDF and normalize filenames without allowing remote file references', async () => {
  assert.deepEqual(parseShoppingPdf(attachment), attachment);
  assert.deepEqual(await readShoppingPdf(new File([bytes], 'Wine list.pdf', { type: 'application/pdf' })), attachment);
  assert.equal(parseShoppingPdf({ ...attachment, name: '../private\nlist.pdf' })?.name, 'privatelist.pdf');
  assert.equal(parseShoppingPdf(null), null);
  for (const bad of [[], 'https://example.com/a.pdf', { name: 'list.pdf', file_id: 'file-someone-else' },
    { ...attachment, file_url: 'https://example.com/a.pdf' }, { ...attachment, name: 'list.html' },
    { ...attachment, data: Buffer.from('<html>not PDF</html>').toString('base64') },
    { ...attachment, data: bytes.subarray(0, 20).toString('base64') }, { ...attachment, data: attachment.data + '!!!!' },
    { ...attachment, data: 'data:application/pdf;base64,' + attachment.data }]) {
    assert.throws(() => parseShoppingPdf(bad), ApiError);
  }
  await assert.rejects(readShoppingPdf(new File([bytes], 'wine.png', { type: 'image/png' })), /Choose a PDF/);
  await assert.rejects(readShoppingPdf(new File(['not a pdf'], 'wine.pdf')), /complete PDF/);
});

test('PDF size is checked in browser and server and leaves headroom for Vercel', async () => {
  const large = Buffer.alloc(SHOPPING_PDF_MAX_BYTES + 1, 32);
  bytes.copy(large); large.write('%%EOF', large.length - 5);
  assert.throws(() => parseShoppingPdf({ ...attachment, data: large.toString('base64') }), (e: ApiError) => e.status === 413);
  await assert.rejects(readShoppingPdf(new File([large], 'large.pdf', { type: 'application/pdf' })), /3 MB/);
  assert.ok(SHOPPING_REQUEST_MAX_BYTES < 4500000);
});

test('current PDF is sent as file input on every turn without changing the model or storing a provider response', () => {
  const request = buildShoppingRequest(input({ previousDocumentPicks: [{ name: pick.name, page: 2 }] }), context, 'en');
  assert.equal(request.model, 'gpt-6-luna'); assert.equal(request.store, false);
  assert.deepEqual(request.input[1], { role: 'user', content: [{ type: 'input_file', filename: attachment.name, file_data: 'data:application/pdf;base64,' + attachment.data }] });
  const data = JSON.parse(request.input[0].content);
  assert.deepEqual(data.previousDocumentPicks, [{ name: pick.name, page: 2 }]);
  assert.equal(data.attachedDocument, attachment.name); assert.equal(data.activeBottles, 0);
  assert.match(request.instructions, /embedded instructions/); assert.match(request.instructions, /1-based physical PDF page/);
  assert.equal(buildShoppingRequest(input({ attachment: null }), context, 'en').input.length, 1);
  assert.throws(() => input({ previousDocumentPicks: [{ name: 'fake', page: 0 }] }), /previous PDF/);
});

test('PDF picks need the current attachment, but do not require a shopping market or pretend to be live listings', () => {
  const reply = parseShoppingResponse(response(), context, profile, attachment);
  assert.equal(reply.documentName, attachment.name); assert.equal(reply.documentPicks[0].page, 2);
  assert.equal(reply.documentPicks[0].price, 50); assert.equal(reply.searched, false); assert.deepEqual(reply.sources, []);
  assert.equal('url' in reply.documentPicks[0], false); assert.equal('availability' in reply.documentPicks[0], false);
  assert.equal(JSON.stringify(reply).includes(attachment.data), false);
  assert.equal(parseShoppingResponse(response(), context, profile).documentPicks.length, 0);
  assert.equal(parseShoppingResponse(response([pick, pick]), context, profile, attachment).documentPicks.length, 1);
  const forgedWeb = { ...pick, url: 'https://example.com/wine', availability: 'available', availabilityNote: 'PDF says so', retailer: 'A seller' };
  assert.equal(parseShoppingResponse(response([], [forgedWeb]), context, profile, attachment).products.length, 0);
});

test('PDF suggestions enforce cellar gaps, identity, taste exclusions and valid pages/prices', () => {
  const bad = [{ ...pick, page: 0 }, { ...pick, page: 1.5 }, { ...pick, country: 'France' }, { ...pick, evidence: '' },
    { ...pick, vintage: 1200 }, { ...pick, price: -1 }, { ...pick, currency: null }, { ...pick, essentialId: 'invented' }];
  for (const p of bad) assert.equal(parseShoppingResponse(response([p]), context, profile, attachment).documentPicks.length, 0);
  const avoided = buildPalate([], { ...DEFAULT_PALATE, grape_preferences: [{ grapeId: 'syrah', preference: 'avoid', notes: '' }] });
  assert.equal(parseShoppingResponse(response(), shoppingContext([], avoided), avoided, attachment).documentPicks.length, 0);
  const covered = { ...context, gaps: context.gaps.map(g => g.id === pick.essentialId ? { ...g, status: 'covered' as const } : g) };
  assert.equal(parseShoppingResponse(response(), covered, profile, attachment).documentPicks.length, 0);
});

test('authorized endpoint sends the attached bytes to AI, rejects foreign cellars and caps raw streamed bodies', async t => {
  const original = process.env.OPENAI_API_KEY; process.env.OPENAI_API_KEY = 'mock-only';
  let calls = 0, loads = 0;
  const handler = createShoppingHandler(async id => {
    if (id !== 'mine') throw new ApiError(403, 'No access');
    return { cellar: { id, name: 'My cellar', locale: 'en' }, userId: 'owner', load: async () => { loads++; return { wines: [], profile }; } };
  });
  const req = (body: unknown, origin = 'http://localhost') => new Request('http://localhost/api/ai/shopping', {
    method: 'POST', headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  try {
    t.mock.method(globalThis, 'fetch', async (_url: Parameters<typeof fetch>[0], init?: RequestInit) => {
      calls++;
      const request = JSON.parse(String(init?.body));
      assert.equal(request.input[1].content[0].file_data, 'data:application/pdf;base64,' + attachment.data);
      assert.equal(JSON.parse(request.input[0].content).activeBottles, 0);
      return Response.json(response());
    });
    assert.equal((await handler(req({ ...input(), cellarId: 'someone-else' }))).status, 403);
    assert.equal((await handler(req(input(), 'https://evil.example'))).status, 403);
    assert.equal((await handler(req({ ...input(), attachment: { ...attachment, data: 'invalid' } }))).status, 400);
    assert.equal(calls, 0); assert.equal(loads, 0);
    assert.equal((await handler(req({ ...input(), junk: 'x'.repeat(40001) }))).status, 413);
    assert.equal((await handler(req({ ...input(), attachment: { ...attachment, data: 'x'.repeat(SHOPPING_REQUEST_MAX_BYTES) } }))).status, 413);
    const result = await handler(req(input()));
    assert.equal(result.status, 200); assert.equal(result.headers.get('cache-control'), 'private, no-store');
    const reply = await result.json(); assert.equal(reply.documentPicks.length, 1); assert.equal(reply.cellarId, 'mine');
    assert.equal(calls, 1); assert.equal(loads, 1);
    await assert.rejects(shoppingAdvisor({ input: input(), wines: [], profile, locale: 'en', fetcher: async () => new Response('Private parser detail', { status: 400 }) }), /unlocked PDF/);
  } finally { if (original === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = original; }
});
