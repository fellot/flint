import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWineExtractionRequest, extractWineFromPhoto, parseWineExtractionResponse, validateScanImage, WineScanError } from '../lib/ai/wine-extraction';
import { newScanForm, scannedWineFields } from '../lib/wine-scan';
import { newWineInput } from '../lib/wine-data';
import { sanitizeBottleImage } from '../utils/sanitizeWine';

const photo = 'data:image/jpeg;base64,/9j/AA==';
const imageUrl = 'https://producer.example/bottles/reserva-2018.png';
const sourceUrl = 'https://producer.example/reserva/2018';
const sheetUrl = 'https://producer.example/reserva-2018.pdf';
const fields = { identified: true, bottle: 'Producer Reserva', country: 'Chile', region: 'Maipo Valley', vintage: 2018,
  style: 'Red', grapes: 'Cabernet Sauvignon', drinkingWindow: '2024–2038', peakYear: 2030,
  foodPairingNotes: 'Tannins suit grilled beef.', mealToHaveWithThisWine: 'Grilled beef with mushrooms.',
  bottle_image: imageUrl, image_match: 'exact-vintage', technical_sheet: sheetUrl, warnings: [] };
function result(overrides: Record<string, unknown> = {}, search = true) {
  return { status: 'completed', output: [
    ...(search ? [{ type: 'web_search_call', status: 'completed', action: { sources: [{ url: sheetUrl, title: '2018 technical sheet' }] },
      results: [{ type: 'image_result', image_url: imageUrl, source_website_url: sourceUrl, caption: 'Producer Reserva 2018 bottle' }] }] : []),
    { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: JSON.stringify({ ...fields, ...overrides }) }] },
  ] };
}

test('scanner uses Responses vision, required web/image search, strict output and configurable model', async () => {
  const request = buildWineExtractionRequest(photo, 'pt', 'configured-model');
  assert.equal(request.model, 'configured-model');
  assert.equal(request.store, false);
  assert.equal(request.tool_choice, 'required');
  assert.equal(request.input[0].content[1].image_url, photo);
  assert.equal(request.text.format.strict, true);
  assert.deepEqual(request.tools[0].search_content_types, ['image', 'text']);
  assert.match(request.instructions, /Brazilian Portuguese/);
  let called = false;
  const out = await extractWineFromPhoto({ image: photo, apiKey: 'test-key', fetcher: async (url, init) => {
    called = true;
    assert.equal(url, 'https://api.openai.com/v1/responses');
    assert.equal(JSON.parse(String(init?.body)).model, 'gpt-6-luna');
    return Response.json(result());
  } });
  assert.equal(called, true);
  assert.equal(out.extracted.bottle_image, imageUrl);
  assert.deepEqual(out.image, { url: imageUrl, sourceUrl, match: 'exact-vintage' });
  assert.equal(out.extracted.technical_sheet, sheetUrl);
});

test('image and technical-sheet URLs require search evidence, not just plausible model output', () => {
  for (const bottle_image of [photo, 'https://invented.example/bottle.png', sourceUrl, 'javascript:alert(1)']) {
    const out = parseWineExtractionResponse(result({ bottle_image, technical_sheet: 'https://invented.example/sheet.pdf' }));
    assert.equal(out.extracted.bottle_image, '');
    assert.equal(out.extracted.technical_sheet, '');
    assert.equal(out.image, null);
  }
  const withoutSearch = parseWineExtractionResponse(result({}, false));
  assert.equal(withoutSearch.extracted.bottle_image, '');
  assert.equal(withoutSearch.extracted.technical_sheet, '');
  assert.match(withoutSearch.warnings.join(' '), /No reliable bottle image/);
});

test('same-wine image is distinguished from a vintage match and null image remains empty', () => {
  assert.equal(parseWineExtractionResponse(result({ image_match: 'same-wine' })).image?.match, 'same-wine');
  assert.equal(parseWineExtractionResponse(result({ image_match: 'none' })).image, null);
  assert.equal(parseWineExtractionResponse(result({ bottle_image: null })).extracted.bottle_image, '');
});

test('unreadable labels, refusals, incomplete results and broken JSON never become a saved wine', () => {
  assert.throws(() => parseWineExtractionResponse(result({ identified: false })), (e: unknown) => e instanceof WineScanError && e.status === 422);
  assert.throws(() => parseWineExtractionResponse({ ...result(), status: 'incomplete' }), /did not finish/);
  assert.throws(() => parseWineExtractionResponse({ status: 'completed', output: [{ type: 'message', role: 'assistant', content: [{ type: 'refusal' }] }] }), /could not be identified/);
  assert.throws(() => parseWineExtractionResponse({ status: 'completed', output: [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text: '```json invalid' }] }] }), /invalid result/);
});

test('unknown dates stay unknown; new scans cannot carry previous identity, image or journal details', () => {
  const out = parseWineExtractionResponse(result({ vintage: null, peakYear: null, drinkingWindow: null, bottle_image: null }));
  assert.equal(out.extracted.vintage, 0);
  assert.equal(out.extracted.peakYear, '');
  const previous = { ...newScanForm(false), ...fields, notes: 'Private notes', quantity: 6, personIds: ['old-person'] };
  const fresh = { ...newScanForm(false), ...out.extracted };
  assert.equal(previous.quantity, 6);
  assert.equal(fresh.quantity, 1);
  assert.equal(fresh.bottle_image, '');
  assert.equal(fresh.notes, '');
  assert.equal(fresh.personIds, undefined);
  assert.equal(newScanForm(true).status, 'consumed');
  assert.equal(newScanForm(true).fromCellar, false);
});

test('AI can never assign IDs, stock, prices, personal reviews or ownership', () => {
  const dangerous = { ...fields, id: 'invented-id', cellar_id: 'someone-else', user_id: 'other', quantity: 99, price: 150, notes: 'fake tasting', rating: 100, status: 'consumed', personIds: ['stranger'] };
  const scanned = scannedWineFields(dangerous);
  for (const field of ['id', 'cellar_id', 'user_id', 'quantity', 'price', 'notes', 'rating', 'status', 'personIds']) assert.equal(field in scanned, false, field);
  const write = newWineInput({ ...newScanForm(false), ...scanned, id: 'client-id' });
  assert.equal('id' in write, false);
  assert.equal(write.quantity, 1);
  assert.equal(write.status, 'in_cellar');
  assert.equal(write.bottle_image_url, imageUrl);
});

test('input bounds reject remote URLs, invalid formats and oversized uploads', () => {
  validateScanImage(photo);
  for (const value of [null, 123, 'https://localhost/photo', 'data:image/svg+xml;base64,AAAA', 'data:image/png;base64,@@@']) assert.throws(() => validateScanImage(value), WineScanError);
  assert.throws(() => validateScanImage('data:image/png;base64,' + 'a'.repeat(4 * 1024 * 1024)), (e: unknown) => e instanceof WineScanError && e.status === 413);
});

test('links cannot be data URLs, malformed URLs, credential-bearing URLs or executable schemes', () => {
  for (const value of [photo, 'https://', 'https://user:password@example.com/bottle.png', 'javascript:alert(1)']) assert.equal(sanitizeBottleImage(value), undefined);
  assert.equal(sanitizeBottleImage(' https://producer.example/bottle.png '), 'https://producer.example/bottle.png');
});

test('provider failures are actionable without exposing provider details', async () => {
  for (const status of [401, 429, 500]) {
    await assert.rejects(extractWineFromPhoto({ image: photo, apiKey: 'private-key', fetcher: async () => new Response('private provider detail', { status }) }),
      (e: unknown) => e instanceof WineScanError && e.status === (status === 429 ? 429 : 502) && !e.message.includes('private'));
  }
  await assert.rejects(extractWineFromPhoto({ image: photo, apiKey: 'key', fetcher: async () => new Response('bad json') }), /invalid result/);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(extractWineFromPhoto({ image: photo, apiKey: 'key', signal: controller.signal,
    fetcher: async (_, init) => { init?.signal?.throwIfAborted(); return Response.json(result()); } }), { name: 'AbortError' });
});
