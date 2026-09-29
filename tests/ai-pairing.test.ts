import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/ai/enrich-pairing/route';

test('pairing and meal actions use Luna-compatible requests and preserve the editable response', async (t) => {
  const originalKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'mock-test-only';
  const request = (mode: string, locale = 'en') => new NextRequest('http://localhost/api/ai/enrich-pairing', {
    method: 'POST', body: JSON.stringify({ wine: { bottle: 'Example Barolo', vintage: 2021, grapes: 'Nebbiolo' },
      currentPairing: 'Roasted mushrooms', currentMeal: 'Risotto', mode, locale }),
  });
  const result = { foodPairingNotes: 'Earthy flavours suit mushrooms.', mealToHaveWithThisWine: 'Mushroom pasta.' };
  try {
    const fetchMock = t.mock.method(globalThis, 'fetch', async (url: Parameters<typeof fetch>[0], init?: RequestInit) => {
      assert.equal(url, 'https://api.openai.com/v1/chat/completions');
      const sent = JSON.parse(String(init?.body));
      assert.equal(sent.model, 'gpt-6-luna');
      assert.equal(sent.reasoning_effort, 'none');
      assert.equal(sent.max_completion_tokens, 1200);
      assert.equal('max_tokens' in sent, false);
      assert.equal(sent.store, false);
      assert.equal(sent.response_format.type, 'json_object');
      assert.ok(init?.signal);
      assert.match(sent.messages[1].content, /Example Barolo/);
      assert.match(sent.messages[0].content, /Do not include critic scores|Não inclua notas de críticos/);
      return Response.json({ choices: [{ message: { content: JSON.stringify(result) } }] });
    });
    for (const mode of ['both', 'pairing', 'meal']) {
      const response = await POST(request(mode, mode === 'meal' ? 'pt' : 'en'));
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), result);
    }
    fetchMock.mock.mockImplementation(async () => new Response('private provider details', { status: 403 }));
    const unavailable = await POST(request('both'));
    assert.equal(unavailable.status, 502);
    assert.doesNotMatch(await unavailable.text(), /private provider details/);
    fetchMock.mock.mockImplementation(async () => { throw new DOMException('Timeout', 'TimeoutError'); });
    assert.equal((await POST(request('both'))).status, 504);
  } finally {
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  }
});
