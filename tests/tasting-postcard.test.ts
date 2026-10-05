import test from 'node:test';
import assert from 'node:assert/strict';
import type { Wine } from '../types/wine';
import {
  buildTastingPostcardSvg, countPostcardNote, loadPostcardPhoto, postcardFileName,
  POSTCARD_HEIGHT, POSTCARD_NOTE_LIMIT, POSTCARD_WIDTH, renderPostcardPng, truncatePostcardNote,
  type PostcardOptions,
} from '../utils/tasting-postcard';

function wine(overrides: Partial<Wine> = {}): Wine {
  return {
    id: 'private-cellar-id', bottle: 'Quinta do Crasto Reserva', vintage: 2019,
    country: 'Portugal', region: 'Douro', style: 'Red', grapes: 'Field blend',
    drinkingWindow: '2024–2030', peakYear: 2027, foodPairingNotes: 'Private pairing',
    mealToHaveWithThisWine: 'Private dinner', status: 'consumed', consumedDate: '2026-10-05',
    notes: 'PRIVATE shared cellar notes', rating: 91, criticRating: 99,
    criticRatings: { wine_advocate: { score: 98, display_score: '98+', score_kind: 'plus', verification: 'verified', source_urls: ['https://private.example/critic'] } },
    myRating: 94, myComment: 'PRIVATE full journal entry', inMyJournal: true,
    participants: [{ id: 'private-person-id', name: 'PRIVATE participant name' }],
    price: 543.21, location: 'PRIVATE cellar address', quantity: 3,
    technical_sheet: 'https://private.example/technical-sheet',
    bottle_image: 'https://private.example/bottle.jpg', ...overrides,
  };
}

const options: PostcardOptions = { locale: 'en', note: 'Blackberries, soft tannins, and a lovely long finish.', showScore: true, showDate: true };

test('the postcard includes only the selected personal excerpt and personal score', () => {
  const svg = buildTastingPostcardSvg(wine(), options);
  assert.match(svg, /Quinta do Crasto Reserva/);
  assert.match(svg, /Douro · Portugal/);
  assert.match(svg, /MY SCORE/);
  assert.match(svg, />94<tspan/);
  assert.match(svg, /Oct 5, 2026/);
  assert.match(svg, /Blackberries, soft tannins/);
  for (const privateValue of ['PRIVATE', 'private-cellar-id', 'private-person-id', '543.21', '98+', 'private.example', 'Private pairing', 'Private dinner']) {
    assert.ok(!svg.includes(privateValue), `${privateValue} must not be embedded in the shared image`);
  }
  assert.ok(!svg.includes('>99<'), 'a critic score must not stand in for my score');
  assert.ok(!svg.includes('>91<'), 'the historic cellar score must not stand in for my score');
  assert.match(svg, new RegExp(`width="${POSTCARD_WIDTH}" height="${POSTCARD_HEIGHT}"`));
  assert.equal(POSTCARD_WIDTH / POSTCARD_HEIGHT, 4 / 5);
});

test('score and date toggles also remove their labels, and an empty excerpt stays empty', () => {
  const svg = buildTastingPostcardSvg(wine(), { ...options, note: '', showScore: false, showDate: false });
  assert.ok(!svg.includes('MY SCORE'));
  assert.ok(!svg.includes('ENJOYED ON'));
  assert.ok(!svg.includes('Oct 5, 2026'));
  assert.ok(!svg.includes('PRIVATE full journal entry'));
  assert.ok(!svg.includes('Blackberries'));
});

test('no historic or critic score appears when a personal score is absent or invalid', () => {
  for (const myRating of [undefined, null, NaN, Infinity, -1, 101]) {
    const svg = buildTastingPostcardSvg(wine({ myRating }), options);
    assert.ok(!svg.includes('MY SCORE'));
    assert.ok(!svg.includes('>99<'));
    assert.ok(!svg.includes('>91<'));
  }
  assert.match(buildTastingPostcardSvg(wine({ myRating: 0 }), options), />0<tspan/);
});

test('date-only tastings retain their calendar day across timezones and invalid dates are omitted', () => {
  const previousTimezone = process.env.TZ;
  try {
    process.env.TZ = 'America/Los_Angeles';
    assert.match(buildTastingPostcardSvg(wine({ consumedDate: '2026-01-01' }), options), /Jan 1, 2026/);
    assert.match(buildTastingPostcardSvg(wine({ consumedDate: '2024-02-29' }), options), /Feb 29, 2024/);
    for (const consumedDate of [null, '', 'not a date', '2025-02-29', '2026-02-30', '2026-13-05', '10/05/2026']) {
      assert.ok(!buildTastingPostcardSvg(wine({ consumedDate }), options).includes('ENJOYED ON'), String(consumedDate));
    }
    const pt = buildTastingPostcardSvg(wine(), { ...options, locale: 'pt' });
    assert.match(pt, /MINHA NOTA/);
    assert.match(pt, /PROVADO EM/);
    assert.match(pt, /5 de out\. de 2026/);
  } finally {
    if (previousTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = previousTimezone;
  }
});

test('XML metacharacters and unsafe image references cannot introduce active or remote content', () => {
  const svg = buildTastingPostcardSvg(wine({ bottle: 'Estate <script> & "Reserve"', region: "D'ouro", country: 'A > B' }),
    { ...options, note: '<image href="https://evil.example"/> & a toast' }, 'https://evil.example/external.jpg');
  assert.match(svg, /Estate &lt;script&gt; &amp; &quot;Reserve&quot;/);
  assert.match(svg, /D&apos;ouro/);
  assert.match(svg, /A &gt; B/);
  assert.ok(!svg.includes('<script>'));
  assert.ok(!svg.includes('<image '));
  assert.ok(!svg.includes('xlink:href="https:'));
  const svgData = 'data:image/svg+xml;base64,PHN2Zy8+';
  assert.ok(!buildTastingPostcardSvg(wine(), options, svgData).includes('<image '));
  const rasterData = 'data:image/png;base64,aGVsbG8=';
  assert.match(buildTastingPostcardSvg(wine(), options, rasterData), /<image[^>]+xlink:href="data:image\/png;base64,aGVsbG8="/);
});

test('a moment photo accompanies the wine bottle and preserves all selected tasting details', () => {
  const bottle = 'data:image/png;base64,Ym90dGxl';
  const moment = 'data:image/jpeg;base64,bW9tZW50';
  const svg = buildTastingPostcardSvg(wine(), options, bottle, moment);
  assert.equal((svg.match(/<image\s/g) || []).length, 2, 'both the moment and wine bottle should be visible');
  assert.ok(svg.includes(`xlink:href="${bottle}"`));
  assert.ok(svg.includes(`xlink:href="${moment}"`));
  assert.match(svg, /THE MOMENT/);
  assert.match(svg, /Quinta do Crasto Reserva/);
  assert.match(svg, /Douro · Portugal/);
  assert.match(svg, />94<tspan/);
  assert.match(svg, /Oct 5, 2026/);
  assert.match(svg, /Blackberries, soft tannins/);
  assert.ok(!svg.includes('PRIVATE'));
  assert.ok(!svg.includes('private.example'));
  const illustrated = buildTastingPostcardSvg(wine(), { ...options, locale: 'pt' }, null, moment);
  assert.equal((illustrated.match(/<image\s/g) || []).length, 1);
  assert.match(illustrated, /id="bottle-glass"/);
  assert.match(illustrated, /O MOMENTO/);
  assert.match(illustrated, /O VINHO/);
});

test('the moment keeps the entire snapshot by default, with an explicitly clipped optional fill', () => {
  const moment = 'data:image/jpeg;base64,bW9tZW50';
  const contained = buildTastingPostcardSvg(wine(), options, null, moment);
  const explicitContain = buildTastingPostcardSvg(wine(), { ...options, momentPhotoFit: 'contain' }, null, moment);
  assert.equal(contained, explicitContain);
  const filled = buildTastingPostcardSvg(wine(), { ...options, momentPhotoFit: 'cover' }, null, moment);
  const momentImage = (svg: string) => (svg.match(/<image[^>]+clip-path="url\(#postcard-moment-photo\)"[^>]+>/) || [])[0] || '';
  assert.match(momentImage(contained), /preserveAspectRatio="xMidYMid meet"/);
  assert.match(momentImage(filled), /preserveAspectRatio="xMidYMid slice"/);
  for (const svg of [contained, filled]) {
    const clips = Array.from(svg.matchAll(/<clipPath[^>]+><rect x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)"/g));
    assert.equal(clips.length, 2, 'moment and bottle each need an explicit bounded clip');
    clips.forEach(clip => {
      const [, x, y, width, height] = clip.map(Number);
      assert.ok(x >= 100 && x + width <= 980);
      assert.ok(y >= 213 && y + height <= 656, 'photo content must stay above the wine identity');
    });
  }
});

test('absent or unsafe moment photos leave the original postcard byte-identical', () => {
  const bottle = 'data:image/png;base64,Ym90dGxl';
  const original = buildTastingPostcardSvg(wine(), options, bottle);
  for (const moment of [undefined, null, '', 'https://private.example/moment.jpg', 'file:///private/moment.jpg', 'data:image/svg+xml;base64,PHN2Zy8+', 'data:image/jpeg;base64,bW9tZW50\"/><script/>', 'data:image/jpeg;base64,' + 'a'.repeat(8 * 1024 * 1024)]) {
    assert.equal(buildTastingPostcardSvg(wine(), options, bottle, moment), original);
  }
  assert.equal(buildTastingPostcardSvg(wine(), { ...options, momentPhotoFit: 'cover' }, bottle), original);
  assert.ok(!original.includes('THE MOMENT'));
  assert.ok(!original.includes('postcard-moment-photo'));
});

test('long Unicode tasting text retains bounded layout when a moment photo is included', () => {
  const moment = 'data:image/jpeg;base64,bW9tZW50';
  const extremeWine = wine({ bottle: 'W葡萄👩‍👩‍👧‍👦'.repeat(1000), region: '葡萄'.repeat(1000), country: '国'.repeat(1000) });
  const extremeOptions = { ...options, note: '🍷e\u0301 '.repeat(1000) };
  const svg = buildTastingPostcardSvg(extremeWine, extremeOptions, null, moment);
  const plain = buildTastingPostcardSvg(extremeWine, extremeOptions);
  const identity = '<text x="540" y="690"';
  assert.equal(svg.slice(svg.indexOf(identity)), plain.slice(plain.indexOf(identity)), 'adding a photo must preserve the lower tasting layout');
  assert.ok(svg.length < 20000);
  assert.ok(svg.includes('…'));
  Array.from(svg.matchAll(/textLength="([\d.]+)"/g)).forEach(match => assert.ok(Number(match[1]) <= 866));
  assert.match(svg, /width="1080" height="1350"/);
});

test('extreme Unicode and unbroken strings stay bounded without corrupting graphemes or XML', () => {
  const family = '👩‍👩‍👧‍👦';
  const svg = buildTastingPostcardSvg(wine({ bottle: ('W' + family + '葡萄' + 'e\u0301').repeat(1000), region: 'R'.repeat(10000), country: '国'.repeat(10000) }),
    { ...options, note: (family + 'e\u0301 ').repeat(1000) + '\u0001\ud800\uffff' });
  assert.ok(svg.length < 20000, 'input size must not expand the shared artifact without bounds');
  assert.ok(!svg.includes('\u0001'));
  assert.ok(!svg.includes('\ud800'));
  assert.ok(!svg.includes('\uffff'));
  assert.ok(svg.includes(family));
  assert.ok(svg.includes('e\u0301'));
  assert.ok(svg.includes('…'));
  Array.from(svg.matchAll(/textLength="([\d.]+)"/g)).forEach(match => assert.ok(Number(match[1]) <= 866, 'rendered text exceeds the safe card width'));
  assert.equal(POSTCARD_NOTE_LIMIT, 220);
});

test('the editable note limit counts visible characters without splitting emoji or removing whitespace', () => {
  const family = '👩‍👩‍👧‍👦';
  assert.equal(countPostcardNote(family + 'e\u0301'), 2);
  assert.equal(truncatePostcardNote(' first\n second '), ' first\n second ');
  const limited = truncatePostcardNote(family.repeat(219) + 'e\u0301' + 'one too many');
  assert.equal(countPostcardNote(limited), POSTCARD_NOTE_LIMIT);
  assert.ok(limited.endsWith('e\u0301'));
  const svg = buildTastingPostcardSvg(wine(), { ...options, note: 'A\u0000B\ud800C\uffffD' });
  assert.match(svg, />ABCD<\/text>/);
});

test('missing identity metadata has a useful fallback and filenames cannot escape their download directory', () => {
  const svg = buildTastingPostcardSvg(wine({ bottle: '', country: '', region: '', vintage: 0 }), options);
  assert.match(svg, /A wine to remember/);
  assert.match(svg, /VINTAGE NV/);
  assert.ok(!svg.includes('undefined'));
  assert.ok(!svg.includes('NaN'));
  assert.equal(postcardFileName(wine({ bottle: '../../Château <Danger> / "2020"', vintage: 0 })), 'flint-chateau-danger-2020-NV-tasting.png');
  assert.equal(postcardFileName(wine({ bottle: '🍷', vintage: 2020 })), 'flint-wine-2020-tasting.png');
  assert.ok(postcardFileName(wine({ bottle: 'a'.repeat(10000) })).length < 100);
});

test('browser helpers fail safely outside a browser', async () => {
  assert.equal(await loadPostcardPhoto(undefined), null);
  assert.equal(await loadPostcardPhoto('https://example.com/bottle.jpg'), null);
  await assert.rejects(renderPostcardPng('<svg/>'), /requires a browser/);
});

test('photo conversion requires safe protocols and anonymous CORS, and falls back on tainted canvas', async t => {
  const keys = ['window', 'document', 'Image'] as const;
  const descriptors = keys.map(key => Object.getOwnPropertyDescriptor(globalThis, key));
  t.after(() => keys.forEach((key, index) => {
    const descriptor = descriptors[index];
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }));
  const loaded: { url: string; cors: string; referrer: string }[] = [];
  let tainted = false;
  class TestImage {
    crossOrigin = '';
    referrerPolicy = '';
    naturalWidth = 2400;
    naturalHeight = 1200;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(value: string) {
      if (!value) return;
      loaded.push({ url: value, cors: this.crossOrigin, referrer: this.referrerPolicy });
      queueMicrotask(() => this.onload?.());
    }
  }
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { href: 'https://flint.example/journal', origin: 'https://flint.example' } } });
  Object.defineProperty(globalThis, 'Image', { configurable: true, value: TestImage });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { createElement: () => ({
    width: 0, height: 0, getContext: () => ({ drawImage: () => {} }),
    toDataURL: () => { if (tainted) throw new Error('SecurityError: tainted canvas'); return 'data:image/png;base64,aGVsbG8='; },
  }) } });
  for (const source of ['javascript:alert(1)', 'file:///private/photo.png', 'data:image/svg+xml;base64,PHN2Zy8+', 'https://username:password@remote.example/photo.jpg', 'blob:https://remote.example/private-photo']) {
    assert.equal(await loadPostcardPhoto(source), null);
  }
  assert.equal(loaded.length, 0, 'disallowed schemes must never request an image');
  assert.equal(await loadPostcardPhoto('/bottle.jpg'), 'data:image/png;base64,aGVsbG8=');
  assert.deepEqual(loaded[0], { url: 'https://flint.example/bottle.jpg', cors: 'anonymous', referrer: 'no-referrer' });
  tainted = true;
  assert.equal(await loadPostcardPhoto('https://remote.example/bottle.jpg'), null, 'CORS failure should use illustration, not break postcard creation');
});
