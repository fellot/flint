import { lookup as dnsLookup } from 'node:dns/promises';
import { request as httpRequest, type ClientRequest, type IncomingMessage, type RequestOptions } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { isIP } from 'node:net';
import { ApiError } from './api-error';

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 8000;
const UNAVAILABLE = 'The bottle photo is unavailable.';

type Address = { address: string; family: number };
type PhotoRequest = (url: URL, options: RequestOptions, response: (message: IncomingMessage) => void) => ClientRequest;
export interface PostcardPhotoTransport {
  lookup: (hostname: string) => Promise<Address[]>;
  request: PhotoRequest;
  timeoutMs: number;
}

export interface PostcardPhoto {
  bytes: Buffer;
  contentType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
}

/** Only globally routable addresses may be used, including for DNS answers. */
function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) {
    const [a, b, c] = address.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224
      || (a === 100 && b >= 64 && b <= 127)
      || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && (b === 168 || (b === 0 && (c === 0 || c === 2)) || (b === 88 && c === 99)))
      || (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100)))
      || (a === 203 && b === 0 && c === 113));
  }
  if (family === 6) {
    const words = address.split(':');
    const first = parseInt(words[0] || '0', 16);
    const second = parseInt(words[1] || '0', 16);
    // Allow global unicast only. This also excludes loopback, ULA, link-local,
    // multicast, translation prefixes, and IPv4-mapped IPv6 addresses.
    return first >= 0x2000 && first <= 0x3fff
      && first !== 0x2002 && first !== 0x3ffe && first !== 0x3fff
      && !(first === 0x2001 && (second <= 0x01ff || second === 0x0db8));
  }
  return false;
}

function photoUrl(source: string | URL): URL {
  const url = new URL(source);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error(UNAVAILABLE);
  url.hash = '';
  return url;
}

async function pinnedAddress(url: URL, lookup: PostcardPhotoTransport['lookup'], signal: AbortSignal): Promise<Address> {
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  const literalFamily = isIP(hostname);
  const addresses = literalFamily ? [{ address: hostname, family: literalFamily }] : await lookup(hostname);
  signal.throwIfAborted();
  // Reject mixed public/private answers rather than relying on DNS answer order.
  if (!addresses.length || addresses.some(item => item.family !== isIP(item.address) || !isPublicAddress(item.address))) throw new Error(UNAVAILABLE);
  return addresses[0];
}

function requestPhoto(url: URL, address: Address, transport: PostcardPhotoTransport, signal: AbortSignal): Promise<IncomingMessage> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const request = transport.request(url, {
      method: 'GET', agent: false, signal, maxHeaderSize: 16 * 1024,
      headers: { Accept: 'image/png,image/jpeg,image/webp,image/gif', 'User-Agent': 'Flint tasting postcard' },
      // Keep the URL hostname for Host and TLS verification, but pin the socket
      // to the IP validated above. A second DNS resolution cannot rebind it.
      lookup: (_hostname, options, callback) => {
        if (options.all) callback(null, [{ address: address.address, family: address.family }]);
        else callback(null, address.address, address.family);
      },
    }, resolve);
    request.once('error', reject);
    request.end();
  });
}

function rasterType(bytes: Buffer): PostcardPhoto['contentType'] | null {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  if (bytes.length >= 6 && ['GIF87a', 'GIF89a'].includes(bytes.toString('ascii', 0, 6))) return 'image/gif';
  return null;
}

async function download(source: string, transport: PostcardPhotoTransport, signal: AbortSignal): Promise<PostcardPhoto> {
  let url = photoUrl(source);
  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    signal.throwIfAborted();
    const address = await pinnedAddress(url, transport.lookup, signal);
    const response = await requestPhoto(url, address, transport, signal);
    if ([301, 302, 303, 307, 308].includes(response.statusCode || 0)) {
      const location = response.headers.location;
      response.destroy();
      if (!location || redirects === MAX_REDIRECTS) throw new Error(UNAVAILABLE);
      url = photoUrl(new URL(location, url));
      continue;
    }
    if (response.statusCode !== 200 || Number(response.headers['content-length']) > MAX_BYTES) {
      response.destroy();
      throw new Error(UNAVAILABLE);
    }
    const chunks: Buffer[] = [];
    let length = 0;
    for await (const part of response) {
      signal.throwIfAborted();
      const chunk = Buffer.isBuffer(part) ? part : Buffer.from(part);
      length += chunk.length;
      if (length > MAX_BYTES) {
        response.destroy();
        throw new Error(UNAVAILABLE);
      }
      chunks.push(chunk);
    }
    const bytes = Buffer.concat(chunks, length);
    const contentType = rasterType(bytes);
    if (!contentType) throw new Error(UNAVAILABLE);
    return { bytes, contentType };
  }
  throw new Error(UNAVAILABLE);
}

function withDeadline<T>(operation: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(new Error(UNAVAILABLE));
    if (signal.aborted) return abort();
    signal.addEventListener('abort', abort, { once: true });
    operation.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
  });
}

/** Fetch only a stored wine URL, with one deadline covering DNS, redirects and body. */
export async function fetchPostcardPhoto(source: string, injected: Partial<PostcardPhotoTransport> = {}): Promise<PostcardPhoto> {
  const transport: PostcardPhotoTransport = {
    lookup: hostname => dnsLookup(hostname, { all: true, verbatim: true }),
    request: (url, options, response) => (url.protocol === 'https:' ? httpsRequest : httpRequest)(url, options, response),
    timeoutMs: TIMEOUT_MS, ...injected,
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), transport.timeoutMs);
  try {
    return await withDeadline(download(source, transport, controller.signal), controller.signal);
  } catch { throw new ApiError(502, UNAVAILABLE); }
  finally { clearTimeout(timer); }
}
