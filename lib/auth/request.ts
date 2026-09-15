// Next.js may use an internal bind address in request.url. Preserve the public
// destination when checking request origins or constructing auth redirects.
export function requestOrigin(request: Request): string {
  const target = new URL(request.url);
  const host = request.headers.get('host') || target.host;
  const protocol = request.headers.get('x-forwarded-proto') || target.protocol.slice(0, -1);
  return `${protocol}://${host}`;
}
