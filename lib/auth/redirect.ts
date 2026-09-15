export function safeRedirect(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020]/.test(value)) return '/';
  const url = new URL(value, 'https://flint.invalid');
  if (url.origin !== 'https://flint.invalid') return '/';
  if (['/login', '/pin', '/forgot-password'].includes(url.pathname) || url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return '/';
  return url.pathname + url.search + url.hash;
}

export const PUBLIC_PAGES = ['/login', '/pin', '/forgot-password'];
