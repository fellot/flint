'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import CellarShell from './CellarShell';
import FlintMark from './FlintMark';
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
  if (!session) return <div className="session-loading"><FlintMark /><p role={error ? 'alert' : 'status'}>{error || 'Opening your cellar…'}</p>{error && <button className="flint-button" onClick={() => window.location.reload()}>Try again</button>}</div>;
  return (
    <Context.Provider value={session.cellar}>
      <CellarShell pathname={pathname} cellar={session.cellar} cellars={session.cellars} email={session.user.email} pending={pending} error={error}
        onSwitch={id => accountAction('/api/auth/cellar', { cellarId: id }, '/')}
        onSignOut={() => accountAction('/api/auth/logout', {}, '/login')}>
        {session.cellar ? children : <main className="session-empty"><p className="eyebrow">WELCOME TO FLINT</p><h1>Your next chapter starts here.</h1><p>Ask your cellar owner to assign your account to a cellar, then refresh this page.</p><button onClick={() => window.location.reload()} className="flint-button">Refresh</button></main>}
      </CellarShell>
    </Context.Provider>
  );
}
