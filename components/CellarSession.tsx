'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { Cellar } from '@/types/database';
import { PUBLIC_PAGES } from '@/lib/auth/redirect';

type Session = { user: { email?: string }; cellars: Cellar[]; cellar: Cellar | null };
const Context = createContext<Cellar | null>(null);
export function useCellar() {
  const cellar = useContext(Context);
  if (!cellar) throw new Error('A cellar session is required.');
  return { cellar, dataSource: cellar.id, isPortugueseMode: cellar.locale === 'pt' };
}

export default function CellarSession({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const skip = PUBLIC_PAGES.includes(pathname) || pathname === '/reset-password';
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (skip) { setSession(null); return; }
    const controller = new AbortController();
    fetch('/api/auth/session', { cache: 'no-store', signal: controller.signal }).then(async response => {
      if (response.status === 401) {
        window.location.assign(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        return;
      }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setSession(result);
    }).catch(error => { if (error.name !== 'AbortError') setError(error.message || 'Unable to load your cellars.'); });
    return () => controller.abort();
  }, [skip]);

  async function accountAction(path: string, body: object, redirect: string) {
    setPending(true);
    setError('');
    try {
      const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!response.ok) { const result = await response.json(); throw new Error(result.error); }
      window.location.assign(redirect);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to complete the request.');
      setPending(false);
    }
  }

  if (skip) return <>{children}</>;
  if (!session) return <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-white"><p role={error ? 'alert' : 'status'}>{error || 'Opening your cellar…'}</p>{error && <button className="underline" onClick={() => window.location.reload()}>Try again</button>}</div>;
  const pt = session.cellar?.locale === 'pt';
  return (
    <Context.Provider value={session.cellar}>
      <div className="border-b border-red-800 bg-red-950 px-4 py-2 text-sm text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          {session.cellars.length > 1 ? <label className="flex items-center gap-2"><span>{pt ? 'Adega' : 'Cellar'}</span><select aria-label={pt ? 'Selecionar adega' : 'Select cellar'} disabled={pending} value={session.cellar?.id} onChange={e => accountAction('/api/auth/cellar', { cellarId: e.target.value }, '/')} className="rounded border border-red-700 bg-red-900 px-2 py-1">{session.cellars.map(cellar => <option key={cellar.id} value={cellar.id}>{cellar.name}</option>)}</select></label> : <span>{session.cellar?.name || 'Flint Cellar'}</span>}
          <div className="flex items-center gap-3"><span className="hidden sm:inline text-red-100">{session.user.email}</span><button disabled={pending} onClick={() => accountAction('/api/auth/logout', {}, '/login')} className="rounded border border-red-700 px-3 py-1 hover:bg-red-900 disabled:opacity-60">{pt ? 'Sair' : 'Sign out'}</button></div>
        </div>
        {error && <p role="alert" className="mx-auto mt-2 max-w-7xl text-red-100">{error}</p>}
      </div>
      {session.cellar ? children : <main className="mx-auto max-w-lg px-6 py-20 text-center text-white"><h1 className="mb-3 text-2xl font-semibold">Your account is ready</h1><p>Ask your cellar owner to assign your account to a cellar, then refresh this page.</p><button onClick={() => window.location.reload()} className="mt-6 underline">Refresh</button></main>}
    </Context.Provider>
  );
}
