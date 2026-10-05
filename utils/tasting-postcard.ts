import type { Wine } from '@/types/wine';
import { styleFamily } from './cellar';

export const POSTCARD_WIDTH = 1080;
export const POSTCARD_HEIGHT = 1350;
export const POSTCARD_NOTE_LIMIT = 220;

export interface PostcardOptions {
  locale: 'en' | 'pt';
  note: string;
  showScore: boolean;
  showDate: boolean;
  momentPhotoFit?: 'contain' | 'cover';
}

const BURGUNDY = '#642c3c';
const CREAM = '#f8f2e7';
const INK = '#442c30';
const MUTED = '#876f65';
// The authenticated image endpoint has an eight-second upstream deadline.
const PHOTO_TIMEOUT_MS = 10000;

// Remove characters that are illegal in XML, including unpaired UTF-16 surrogates.
function cleanText(value: string | null | undefined): string {
  return Array.from(String(value || '')).filter(char => {
    const point = char.codePointAt(0)!;
    return (point === 9 || point === 10 || point === 13 || point >= 32)
      && !(point >= 0xd800 && point <= 0xdfff)
      && point !== 0xfffe && point !== 0xffff
      && !(point >= 0x202a && point <= 0x202e)
      && !(point >= 0x2066 && point <= 0x2069);
  }).join('').replace(/\s+/g, ' ').trim();
}

function xml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]!));
}

type SegmenterConstructor = new (locale?: string, options?: { granularity: 'grapheme' }) => {
  segment(text: string): Iterable<{ segment: string }>;
};

function graphemes(text: string): string[] {
  const Segmenter = (Intl as unknown as { Segmenter?: SegmenterConstructor }).Segmenter;
  return Segmenter
    ? Array.from(new Segmenter(undefined, { granularity: 'grapheme' }).segment(text), item => item.segment)
    : Array.from(text);
}

/** Count user-visible characters, so emoji and accented letters count once. */
export function countPostcardNote(value: string): number {
  return graphemes(value).length;
}

/** Preserve editable whitespace and complete characters while applying the cap. */
export function truncatePostcardNote(value: string): string {
  return graphemes(value).slice(0, POSTCARD_NOTE_LIMIT).join('');
}

function limitedText(value: string | null | undefined, limit: number): string {
  const parts = graphemes(cleanText(value));
  return parts.length > limit ? parts.slice(0, limit - 1).join('').trimEnd() + '…' : parts.join('');
}

// Conservative advance widths, then SVG textLength ensures even unusual fonts
// and scripts stay inside the card. Wrapping never splits a grapheme cluster.
function textWidth(value: string, size: number): number {
  return graphemes(value).reduce((width, char) => {
    let units = 0.58;
    if (char === ' ') units = 0.28;
    else if (/^[ilI.,'!:;|]$/.test(char)) units = 0.3;
    else if (/^[MW@%&]$/.test(char)) units = 0.95;
    else if ((char.codePointAt(0) || 0) > 0x2e7f) units = 1.05;
    return width + units * size;
  }, 0);
}

function wrapText(value: string, size: number, width: number, maxLines: number): string[] {
  const remaining = graphemes(value);
  const lines: string[] = [];
  while (remaining.length && lines.length < maxLines) {
    let take = 0;
    let measured = 0;
    while (take < remaining.length && measured + textWidth(remaining[take], size) <= width) {
      measured += textWidth(remaining[take], size);
      take += 1;
    }
    take = Math.max(1, take);
    if (take < remaining.length) {
      const space = remaining.slice(0, take).lastIndexOf(' ');
      if (space > take * 0.4) take = space + 1;
    }
    lines.push(remaining.splice(0, take).join('').trim());
    while (remaining[0] === ' ') remaining.shift();
  }
  if (remaining.length && lines.length) {
    const last = graphemes(lines[lines.length - 1]);
    while (last.length && textWidth(last.join('') + '…', size) > width) last.pop();
    lines[lines.length - 1] = last.join('').trimEnd() + '…';
  }
  return lines;
}

function textLine(value: string, x: number, y: number, size: number, width: number, extra = ''): string {
  // Explicit bounds are particularly useful for CJK, emoji and long unbroken names.
  const length = Math.min(width, textWidth(value, size));
  return `<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle" textLength="${length.toFixed(1)}" lengthAdjust="spacingAndGlyphs" ${extra}>${xml(value)}</text>`;
}

function vintageLabel(wine: Wine): string {
  return Number.isInteger(wine.vintage) && wine.vintage > 0 && wine.vintage <= 9999 ? String(wine.vintage) : 'NV';
}

export function postcardTastingDate(value: string | null | undefined, locale: 'en' | 'pt'): string | null {
  if (!value) return null;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  // Only ISO calendar dates or ISO timestamps are accepted; browsers otherwise
  // disagree about informal dates, and Date silently rolls February 30 forward.
  if (!dateOnly && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return null;
  const calendarPart = value.slice(0, 10);
  const calendarDate = new Date(calendarPart + 'T00:00:00Z');
  if (!Number.isFinite(calendarDate.getTime()) || calendarDate.toISOString().slice(0, 10) !== calendarPart) return null;
  const date = dateOnly ? calendarDate : new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale === 'pt' ? 'pt-BR' : 'en', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  }).format(date);
}

function embeddedRaster(value: string | null | undefined): value is string {
  return !!value && value.length <= 8 * 1024 * 1024
    && /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
}

function bottleIllustration(wine: Wine, transform = 'translate(434 222) scale(2.1)'): string {
  const palette = {
    red: ['#273b30', '#586647', '#642c3c'],
    white: ['#607246', '#a6b77e', '#bca375'],
    rose: ['#bd7f77', '#e3b6a2', '#9e5c68'],
    sparkling: ['#24392f', '#63714c', '#bba36a'],
    sweet: ['#392934', '#665142', '#977142'],
    orange: ['#877343', '#c2a763', '#8a5336'],
  }[styleFamily(wine.style || '')];
  return `<g transform="${transform}">
    <defs><linearGradient id="bottle-glass"><stop stop-color="${palette[0]}"/><stop offset=".36" stop-color="${palette[1]}"/><stop offset=".8" stop-color="${palette[0]}"/><stop offset="1" stop-color="#18271f"/></linearGradient></defs>
    <ellipse cx="50" cy="205" rx="38" ry="4" fill="${INK}" opacity=".14"/>
    <path d="M39 9h22v47c0 14 18 21 19 39v102q0 7-8 7H28q-8 0-8-7V95c1-18 19-25 19-39Z" fill="url(#bottle-glass)"/>
    <path d="M39 7h22v39H39Z" fill="${palette[2]}"/><path d="M40 16h20m-20 23h20" stroke="${CREAM}" opacity=".24"/>
    <path d="M44 53v8c0 15-17 22-17 39v91" stroke="#fff" stroke-width="2.4" opacity=".18" fill="none"/>
    <rect x="22" y="112" width="56" height="61" rx="1" fill="${CREAM}"/>
    <rect x="25" y="115" width="50" height="55" fill="none" stroke="#bdab8d" stroke-width=".5"/>
    <path d="M50 122v13m-5-9 5 4 5-4m-8 7 3 2 3-2" fill="none" stroke="${BURGUNDY}" stroke-width=".8"/>
    <text x="50" y="148" text-anchor="middle" font-family="Georgia, serif" font-size="8" fill="${BURGUNDY}">flint</text>
    <text x="50" y="162" text-anchor="middle" font-family="Georgia, serif" font-size="7" fill="${MUTED}">${vintageLabel(wine)}</text>
  </g>`;
}

function momentArtwork(wine: Wine, options: PostcardOptions, momentPhoto: string, bottlePhoto?: string | null): string {
  const fit = options.momentPhotoFit === 'cover' ? 'slice' : 'meet';
  const bottle = embeddedRaster(bottlePhoto)
    ? `<image x="800" y="302" width="140" height="310" preserveAspectRatio="xMidYMid meet" xlink:href="${bottlePhoto}"/>`
    : bottleIllustration(wine, 'translate(802 311) scale(1.35)');
  return `<defs>
        <clipPath id="postcard-moment-photo"><rect x="151" y="230" width="594" height="355"/></clipPath>
        <clipPath id="postcard-moment-bottle"><rect x="798" y="298" width="144" height="315" rx="4"/></clipPath>
      </defs>
      <rect x="141" y="220" width="628" height="433" rx="2" fill="${INK}" opacity=".09"/>
      <rect x="134" y="213" width="628" height="433" rx="2" fill="#fffaf1" stroke="#c4ad91" stroke-width="1"/>
      <rect x="151" y="230" width="594" height="355" fill="#ece4d6"/>
      <image x="151" y="230" width="594" height="355" clip-path="url(#postcard-moment-photo)" preserveAspectRatio="xMidYMid ${fit}" xlink:href="${momentPhoto}"/>
      <text x="448" y="623" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" letter-spacing="3" fill="${MUTED}">${options.locale === 'pt' ? 'O MOMENTO' : 'THE MOMENT'}</text>
      <path d="M784 633V380a86 86 0 0 1 172 0v253Z" fill="#ece2d4"/>
      <path d="M790 626V380a80 80 0 0 1 160 0v246" fill="none" stroke="#c4ad91" stroke-width="1"/>
      <g clip-path="url(#postcard-moment-bottle)">${bottle}</g>
      <text x="870" y="653" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" letter-spacing="2" fill="${MUTED}">${options.locale === 'pt' ? 'O VINHO' : 'THE WINE'}</text>`;
}

/** A self-contained, exportable SVG. Only explicitly selected personal text is included. */
export function buildTastingPostcardSvg(wine: Wine, options: PostcardOptions, photoDataUrl?: string | null, momentPhotoDataUrl?: string | null): string {
  const pt = options.locale === 'pt';
  const title = limitedText(wine.bottle, 300) || (pt ? 'Um vinho para lembrar' : 'A wine to remember');
  let titleSize = graphemes(title).length > 60 ? 42 : graphemes(title).length > 32 ? 50 : 56;
  let titleLines = wrapText(title, titleSize, 866, 3);
  if (titleLines.length === 3 && titleSize > 42) {
    titleSize = 42;
    titleLines = wrapText(title, titleSize, 866, 3);
  }
  const titleLeading = titleLines.length === 3 ? 43 : 57;
  const titleStart = titleLines.length === 3 ? 746 : 777 - ((titleLines.length - 1) * titleLeading) / 2;
  const origin = [limitedText(wine.region, 110), limitedText(wine.country, 80)].filter(Boolean).join(' · ');
  const originLines = wrapText(origin, 23, 825, 2);
  const note = limitedText(options.note, POSTCARD_NOTE_LIMIT);
  const noteLines = wrapText(note, 29, 812, 4);
  const noteStart = 1037 - ((noteLines.length - 1) * 39) / 2;
  const score = options.showScore && typeof wine.myRating === 'number' && Number.isFinite(wine.myRating)
    && wine.myRating >= 0 && wine.myRating <= 100 ? Math.round(wine.myRating * 10) / 10 : null;
  const date = options.showDate ? postcardTastingDate(wine.consumedDate, options.locale) : null;
  const scoreX = date ? 344 : 540;
  const dateX = score !== null ? 736 : 540;
  const art = embeddedRaster(photoDataUrl)
    ? `<image x="348" y="213" width="384" height="439" preserveAspectRatio="xMidYMid meet" xlink:href="${photoDataUrl}"/>`
    : bottleIllustration(wine);
  const artwork = embeddedRaster(momentPhotoDataUrl)
    ? momentArtwork(wine, options, momentPhotoDataUrl, photoDataUrl)
    : `<path d="M282 656V463a258 258 0 0 1 516 0v193Z" fill="#ece2d4"/>
      <path d="M294 650V464a246 246 0 0 1 492 0v186" fill="none" stroke="#c4ad91" stroke-width="1"/>
      <g fill="none" stroke="#947b60" stroke-width="2" stroke-linecap="round" opacity=".65">
        <path d="M215 642c49-87 37-194 6-260m8 206-42-40m47-11 35-48m-34-5-37-47m27 1 19-39"/>
        <path d="M865 642c-49-87-37-194-6-260m-8 206 42-40m-47-11-35-48m34-5 37-47m-27 1-19-39"/>
        <path d="M187 548c-28-4-33-20-29-29 17-1 29 10 29 29Zm82-59c21-11 25-29 18-36-18 6-23 19-18 36Zm-71-52c-22-5-27-23-23-31 17 1 26 13 23 31Zm46-39c12-14 11-28 3-32-13 9-13 21-3 32Z"/>
        <path d="M893 548c28-4 33-20 29-29-17-1-29 10-29 29Zm-82-59c-21-11-25-29-18-36 18 6 23 19 18 36Zm71-52c22-5 27-23 23-31-17 1-26 13-23 31Zm-46-39c-12-14-11-28-3-32 13 9 13 21 3 32Z"/>
      </g>
      ${art}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${POSTCARD_WIDTH}" height="${POSTCARD_HEIGHT}" viewBox="0 0 ${POSTCARD_WIDTH} ${POSTCARD_HEIGHT}">
    <rect width="1080" height="1350" fill="${BURGUNDY}"/>
    <rect x="22" y="22" width="1036" height="1306" rx="2" fill="${CREAM}"/>
    <rect x="43" y="43" width="994" height="1264" rx="1" fill="none" stroke="#ba9b80" stroke-width="1"/>
    <g font-family="Georgia, 'Times New Roman', serif" fill="${INK}">
      <text x="540" y="104" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" letter-spacing="4" fill="${BURGUNDY}">${pt ? 'UM VINHO, UMA MEMÓRIA' : 'A BOTTLE, A MEMORY'}</text>
      <text x="540" y="160" text-anchor="middle" font-size="35" font-style="italic">${pt ? 'Um brinde para guardar.' : 'A little toast to keep.'}</text>
      ${artwork}
      <text x="540" y="690" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" letter-spacing="4" fill="${BURGUNDY}">${pt ? 'SAFRA' : 'VINTAGE'} ${vintageLabel(wine)}</text>
      ${titleLines.map((line, i) => textLine(line, 540, titleStart + i * titleLeading, titleSize, 866)).join('')}
      ${originLines.map((line, i) => textLine(line, 540, 877 - ((originLines.length - 1) * 29) / 2 + i * 29, 23, 825, `fill="${MUTED}"`)).join('')}
      <path d="M166 931H480m120 0h314" stroke="#c8b49b" stroke-width="1"/>
      <path d="m540 922 7 9-7 9-7-9Z" fill="none" stroke="${BURGUNDY}" stroke-width="1"/>
      ${noteLines.map((line, i) => textLine(line, 540, noteStart + i * 39, 29, 812, `font-style="italic" fill="${BURGUNDY}"`)).join('')}
      ${score !== null ? `<text x="${scoreX}" y="1156" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" letter-spacing="3" fill="${MUTED}">${pt ? 'MINHA NOTA' : 'MY SCORE'}</text><text x="${scoreX}" y="1211" text-anchor="middle" font-size="49" fill="${BURGUNDY}">${score}<tspan font-size="19" fill="${MUTED}"> / 100</tspan></text>` : ''}
      ${date ? `<text x="${dateX}" y="1156" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" letter-spacing="3" fill="${MUTED}">${pt ? 'PROVADO EM' : 'ENJOYED ON'}</text>${textLine(date, dateX, 1203, 26, 342, `fill="${BURGUNDY}"`)}` : ''}
      ${score !== null && date ? '<path d="M540 1152v65" stroke="#c8b49b" stroke-width="1"/>' : ''}
      <text x="540" y="1284" text-anchor="middle" font-size="27" fill="${BURGUNDY}" letter-spacing="1">flint<tspan font-family="Arial, sans-serif" font-size="10" letter-spacing="2" fill="${MUTED}"> · ${pt ? 'MEU DIÁRIO DE VINHOS' : 'MY WINE JOURNAL'}</tspan></text>
    </g>
  </svg>`;
}

/** Rasterization strips metadata and keeps all exports self-contained. */
export async function loadPostcardPhoto(url: string | undefined, context?: { wineId: string; cellarId?: string }): Promise<string | null> {
  if (!url || typeof window === 'undefined' || typeof Image === 'undefined') return null;
  let source: URL;
  try { source = new URL(url, window.location.href); } catch { return null; }
  if (source.username || source.password) return null;
  const rasterData = source.protocol === 'data:' && embeddedRaster(url);
  const sameOriginBlob = source.protocol === 'blob:' && source.origin === window.location.origin;
  if (!['http:', 'https:'].includes(source.protocol) && !rasterData && !sameOriginBlob) return null;
  // Remote hosts can display a photo in <img> while denying canvas access.
  // Fetch the authorized stored photo through our own origin before exporting.
  if (context && ['http:', 'https:'].includes(source.protocol) && source.origin !== window.location.origin) {
    source = new URL(`/api/wines/${encodeURIComponent(context.wineId)}/postcard-photo`, window.location.href);
    if (context.cellarId) source.searchParams.set('dataSource', context.cellarId);
  }
  return new Promise(resolve => {
    const img = new Image();
    let done = false;
    const finish = (result: string | null) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      img.onload = null;
      img.onerror = null;
      img.src = '';
      resolve(result);
    };
    const timer = setTimeout(() => finish(null), PHOTO_TIMEOUT_MS);
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => {
      try {
        if (!img.naturalWidth || !img.naturalHeight) return finish(null);
        const scale = Math.min(1, 1200 / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) return finish(null);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const photo = canvas.toDataURL('image/png');
        finish(embeddedRaster(photo) ? photo : null);
      } catch { finish(null); }
    };
    img.onerror = () => finish(null);
    img.src = source.href;
  });
}

/** Render the same SVG used for preview into a shareable, opaque PNG. */
export async function renderPostcardPng(svg: string): Promise<Blob> {
  if (typeof document === 'undefined' || typeof Image === 'undefined') throw new Error('Postcard export requires a browser.');
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    let done = false;
    const finish = (blob: Blob | null, error?: Error) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      img.onload = null;
      img.onerror = null;
      URL.revokeObjectURL(url);
      if (blob) resolve(blob);
      else reject(error || new Error('Could not render the tasting postcard.'));
    };
    const timer = setTimeout(() => finish(null, new Error('Postcard rendering timed out.')), 10000);
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = POSTCARD_WIDTH;
        canvas.height = POSTCARD_HEIGHT;
        const ctx = canvas.getContext('2d');
        if (!ctx) return finish(null);
        ctx.fillStyle = CREAM;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => finish(blob), 'image/png');
      } catch (error) { finish(null, error instanceof Error ? error : new Error('Could not render the tasting postcard.')); }
    };
    img.onerror = () => finish(null);
    img.src = url;
  });
}

export function postcardFileName(wine: Wine): string {
  const slug = cleanText(wine.bottle).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 65).replace(/-+$/g, '') || 'wine';
  return `flint-${slug}-${vintageLabel(wine)}-tasting.png`;
}
