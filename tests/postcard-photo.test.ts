import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import type { ClientRequest, IncomingHttpHeaders, IncomingMessage, RequestOptions } from 'node:http';
import { ApiError } from '../lib/api-error';
import { fetchPostcardPhoto, type PostcardPhotoTransport } from '../lib/postcard-photo';

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64');
const MAX_BYTES = 8 * 1024 * 1024;
type Step = { status?: number; headers?: IncomingHttpHeaders; chunks?: Buffer[]; stall?: boolean; error?: Error };
type Address = { address: string; family: number };

function fakeTransport(steps: Step[], dns: (hostname: string, count: number) => Promise<Address[]> = async () => [{ address: '8.8.8.8', family: 4 }]) {
  const lookups: string[] = [];
  const requests: { url: string; options: RequestOptions; pinned: string | undefined; family: number | undefined }[] = [];
  const responses: Readable[] = [];
  const transport: Partial<PostcardPhotoTransport> = {
    lookup: hostname => { lookups.push(hostname); return dns(hostname, lookups.length); },
    request: (url, options, listener) => {
      const step = steps[requests.length] || {};
      const record = { url: url.href, options, pinned: undefined as string | undefined, family: undefined as number | undefined };
      requests.push(record);
      const request = new EventEmitter() as ClientRequest;
      request.end = (() => {
        queueMicrotask(() => {
          if (step.error) { request.emit('error', step.error); return; }
          assert.ok(options.lookup, 'every socket must have a pinned DNS lookup');
          options.lookup(url.hostname, {}, (error, address, family) => {
            assert.equal(error, null);
            assert.equal(typeof address, 'string');
            record.pinned = address as string;
            record.family = family;
          });
          const response = step.stall ? new Readable({ read() {} }) : Readable.from(step.chunks || [PNG]);
          responses.push(response);
          const incoming = response as IncomingMessage;
          incoming.statusCode = step.status ?? 200;
          incoming.headers = step.headers || {};
          options.signal?.addEventListener('abort', () => response.destroy(new Error('Request aborted')), { once: true });
          listener(incoming);
        });
        return request;
      }) as ClientRequest['end'];
      return request;
    },
  };
  return { transport, lookups, requests, responses };
}

function unavailable(error: unknown): boolean {
  assert.ok(error instanceof ApiError);
  assert.equal(error.status, 502);
  assert.equal(error.message, 'The bottle photo is unavailable.');
  return true;
}

test('the complete streamed raster is returned with sniffed MIME and a pinned public socket', async () => {
  const fake = fakeTransport([{ headers: { 'content-type': 'text/html' }, chunks: [PNG.subarray(0, 3), PNG.subarray(3)] }]);
  const result = await fetchPostcardPhoto('https://images.example/bottle.png?token=private-token', fake.transport);
  assert.deepEqual(result.bytes, PNG);
  assert.equal(result.contentType, 'image/png', 'untrusted response headers must not select an active MIME type');
  assert.deepEqual(fake.lookups, ['images.example']);
  assert.equal(fake.requests[0].pinned, '8.8.8.8');
  assert.equal(fake.requests[0].family, 4);
  assert.equal(fake.requests[0].options.agent, false, 'a reused socket must not bypass validation');
  const headers = fake.requests[0].options.headers as Record<string, string>;
  assert.equal(headers.Cookie, undefined);
  assert.equal(headers.Authorization, undefined);
});

test('private, reserved, alternate-notation and mapped IP URL destinations never issue a request', async () => {
  for (const host of ['127.0.0.1', '2130706433', '0x7f000001', '10.1.2.3', '172.16.0.1', '192.168.0.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '192.0.2.1', '198.18.0.1', '198.51.100.1', '203.0.113.1', '224.0.0.1', '[::1]', '[::ffff:127.0.0.1]', '[::ffff:7f00:1]', '[fe80::1]', '[fc00::1]', '[ff02::1]', '[64:ff9b::a00:1]', '[2001:db8::1]', '[2002:7f00:1::1]']) {
    const fake = fakeTransport([{}]);
    await assert.rejects(fetchPostcardPhoto(`http://${host}/bottle.png`, fake.transport), unavailable);
    assert.equal(fake.requests.length, 0, host);
  }
});

test('private DNS answers and mixed public/private pools are rejected before connecting', async () => {
  for (const addresses of [[], [{ address: '127.0.0.1', family: 4 }], [{ address: '8.8.8.8', family: 4 }, { address: '10.0.0.1', family: 4 }], [{ address: '::ffff:8.8.8.8', family: 6 }], [{ address: '8.8.8.8', family: 6 }]]) {
    const fake = fakeTransport([{}], async () => addresses);
    await assert.rejects(fetchPostcardPhoto('https://images.example/bottle.png', fake.transport), unavailable);
    assert.equal(fake.requests.length, 0);
  }
});

test('a DNS rebinding answer cannot replace the validated socket address; global IPv6 also works', async () => {
  const fake = fakeTransport([{}], async (_host, count) => [{ address: count === 1 ? '8.8.8.8' : '127.0.0.1', family: 4 }]);
  await fetchPostcardPhoto('https://images.example/bottle.png', fake.transport);
  assert.equal(fake.lookups.length, 1);
  assert.equal(fake.requests[0].pinned, '8.8.8.8');
  const ipv6 = fakeTransport([{}], async () => [{ address: '2606:4700:4700::1111', family: 6 }]);
  await fetchPostcardPhoto('https://images.example/bottle.png', ipv6.transport);
  assert.equal(ipv6.requests[0].pinned, '2606:4700:4700::1111');
  assert.equal(ipv6.requests[0].family, 6);
});

test('every redirect target is independently validated and safe relative redirects succeed', async () => {
  const fake = fakeTransport([
    { status: 302, headers: { location: '/actual-bottle.png' } },
    { status: 307, headers: { location: 'https://cdn.example/final.png' } }, {},
  ]);
  assert.deepEqual((await fetchPostcardPhoto('https://images.example/start', fake.transport)).bytes, PNG);
  assert.deepEqual(fake.lookups, ['images.example', 'images.example', 'cdn.example']);
  assert.deepEqual(fake.requests.map(request => request.url), ['https://images.example/start', 'https://images.example/actual-bottle.png', 'https://cdn.example/final.png']);
  for (const location of ['http://127.0.0.1/internal', 'http://[::ffff:127.0.0.1]/internal', 'file:///private/photo.png', 'data:image/png;base64,aGVsbG8=', 'https://username:password@images.example/photo.png']) {
    const blocked = fakeTransport([{ status: 302, headers: { location } }, {}]);
    await assert.rejects(fetchPostcardPhoto('https://images.example/start', blocked.transport), unavailable);
    assert.equal(blocked.requests.length, 1, location);
  }
  const privateDns = fakeTransport([{ status: 302, headers: { location: 'https://internal.example/photo.png' } }, {}], async hostname => [{ address: hostname === 'internal.example' ? '10.0.0.1' : '8.8.8.8', family: 4 }]);
  await assert.rejects(fetchPostcardPhoto('https://images.example/start', privateDns.transport), unavailable);
  assert.equal(privateDns.requests.length, 1);
});

test('redirects are capped at three and invalid schemes or credentials are never fetched', async () => {
  const accepted = fakeTransport([0, 1, 2].map<Step>(index => ({ status: 302, headers: { location: `/redirect-${index}` } })).concat([{}]));
  await fetchPostcardPhoto('https://images.example/start', accepted.transport);
  assert.equal(accepted.requests.length, 4);
  const loop = fakeTransport(Array.from({ length: 5 }, () => ({ status: 302, headers: { location: '/loop' } })));
  await assert.rejects(fetchPostcardPhoto('https://images.example/start', loop.transport), unavailable);
  assert.equal(loop.requests.length, 4);
  for (const source of ['javascript:alert(1)', 'file:///private/photo.png', 'data:image/png;base64,aGVsbG8=', 'https://user:password@images.example/photo.png', 'not a url']) {
    const fake = fakeTransport([{}]);
    await assert.rejects(fetchPostcardPhoto(source, fake.transport), unavailable);
    assert.equal(fake.lookups.length, 0);
    assert.equal(fake.requests.length, 0);
  }
});

test('only common raster magic bytes are accepted; SVG and misleading image MIME are rejected', async () => {
  const formats = [
    { bytes: PNG, mime: 'image/png' },
    { bytes: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0xff, 0xd9]), mime: 'image/jpeg' },
    { bytes: Buffer.from('RIFF\u0004\u0000\u0000\u0000WEBP', 'binary'), mime: 'image/webp' },
    { bytes: Buffer.from('GIF89a\u0001\u0000\u0001\u0000', 'binary'), mime: 'image/gif' },
  ];
  for (const format of formats) {
    const fake = fakeTransport([{ chunks: [format.bytes] }]);
    assert.equal((await fetchPostcardPhoto('https://images.example/photo', fake.transport)).contentType, format.mime);
  }
  for (const body of ['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', '<!doctype html><html>login</html>', '<?xml version="1.0"?><svg/>', '', 'not an image']) {
    const fake = fakeTransport([{ headers: { 'content-type': 'image/png' }, chunks: [Buffer.from(body)] }]);
    await assert.rejects(fetchPostcardPhoto('https://images.example/photo', fake.transport), unavailable);
  }
});

test('the eight-megabyte limit applies to headers and actual streamed bytes', async () => {
  const advertised = fakeTransport([{ headers: { 'content-length': String(MAX_BYTES + 1) } }]);
  await assert.rejects(fetchPostcardPhoto('https://images.example/photo', advertised.transport), unavailable);
  assert.equal(advertised.responses[0].destroyed, true);
  const exactBytes = Buffer.alloc(MAX_BYTES);
  PNG.copy(exactBytes);
  const exact = fakeTransport([{ chunks: [exactBytes] }]);
  assert.equal((await fetchPostcardPhoto('https://images.example/photo', exact.transport)).bytes.length, MAX_BYTES);
  const streamed = fakeTransport([{ chunks: [exactBytes, Buffer.from([0])] }]);
  await assert.rejects(fetchPostcardPhoto('https://images.example/photo', streamed.transport), unavailable);
  assert.equal(streamed.responses[0].destroyed, true);
});

test('one deadline covers DNS and a stalled response, and errors do not expose stored URLs', async () => {
  const pendingDns = fakeTransport([{}], () => new Promise(() => {}));
  await assert.rejects(fetchPostcardPhoto('https://images.example/photo?secret=private', { ...pendingDns.transport, timeoutMs: 10 }), unavailable);
  assert.equal(pendingDns.requests.length, 0);
  const stalledBody = fakeTransport([{ stall: true }]);
  await assert.rejects(fetchPostcardPhoto('https://images.example/photo?secret=private', { ...stalledBody.transport, timeoutMs: 10 }), unavailable);
  assert.equal(stalledBody.responses[0].destroyed, true);
  for (const step of [{ status: 404 }, { status: 500 }, { error: new Error('Network failed at secret URL') }, { status: 302 }]) {
    const fake = fakeTransport([step]);
    await assert.rejects(fetchPostcardPhoto('https://images.example/photo?secret=private', fake.transport), unavailable);
  }
});
