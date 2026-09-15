'use client';

import { useState } from 'react';
import { ArrowUpRight, BookOpen, ChevronDown, Compass, LayoutGrid, LogOut, Menu, Sparkles, Wine, X } from 'lucide-react';
import type { Cellar } from '@/types/database';
import FlintMark from './FlintMark';

interface Props {
  children: React.ReactNode;
  pathname: string;
  cellar: Cellar | null;
  cellars: Cellar[];
  email?: string;
  pending?: boolean;
  error?: string;
  onSwitch: (id: string) => void;
  onSignOut: () => void;
}

export default function CellarShell({ children, pathname, cellar, cellars, email, pending, error, onSwitch, onSignOut }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pt = cellar?.locale === 'pt';
  const navigation = [
    { href: '/', label: pt ? 'Minha adega' : 'My cellar', icon: LayoutGrid },
    { href: '/cellar-journal', label: pt ? 'Diário da adega' : 'Cellar journal', icon: BookOpen },
    { href: '/wine-map', label: pt ? 'Mapa de vinhos' : 'Wine map', icon: Compass },
    { href: '/sommelier', label: 'Sommelier', icon: Sparkles },
    { href: '/wine-trivia', label: pt ? 'Quiz de vinhos' : 'Wine trivia', icon: Wine },
  ];
  const pageName = navigation.find(item => item.href === pathname)?.label || 'Flint Cellar';
  return <div className="flint-shell">
    <a className="flint-skip" href="#main-content">{pt ? 'Ir para o conteúdo' : 'Skip to content'}</a>
    <aside className={`flint-sidebar ${menuOpen ? 'is-open' : ''}`}>
      <a href="/" className="flint-brand" aria-label="Flint Cellar"><FlintMark /><span>flint<span className="brand-period">.</span><small>THE PERSONAL CELLAR</small></span></a>
      <p className="sidebar-label">{pt ? 'SEU ESPAÇO' : 'YOUR SPACE'}</p>
      <nav aria-label={pt ? 'Navegação principal' : 'Main navigation'}>
        {navigation.map(({ href, label, icon: Icon }, index) => <div key={href}>
          {index === 2 && <p className="sidebar-label discover-label">{pt ? 'DESCUBRA' : 'A LITTLE DISCOVERY'}</p>}
          <a href={href} onClick={() => setMenuOpen(false)} className={`sidebar-link ${pathname === href ? 'active' : ''}`} aria-current={pathname === href ? 'page' : undefined}><Icon size={18} strokeWidth={1.5} /><span>{label}</span>{pathname === href && <span className="nav-active-dot" />}</a>
        </div>)}
      </nav>
      <div className="sidebar-note"><span className="sidebar-star">✳</span><p>{pt ? 'Bons vinhos.\nBoas histórias.' : 'Good bottles.\nEven better stories.'}</p><span>{pt ? 'UMA TAÇA DE CADA VEZ' : 'ONE GLASS AT A TIME'}</span></div>
      <div className="sidebar-bottom"><span className="live-dot" />{pt ? 'Sua coleção, bem guardada.' : 'Your collection, well kept.'}</div>
    </aside>
    {menuOpen && <button className="sidebar-backdrop" aria-label={pt ? 'Fechar menu' : 'Close menu'} onClick={() => setMenuOpen(false)} />}
    <div className="flint-main">
      <header className="flint-topbar">
        <div className="topbar-path"><button className="mobile-menu icon-button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button><span className="topbar-brand">flint.</span><span className="path-divider">/</span><span>{pageName}</span></div>
        <div className="topbar-account">
          <span className="cellar-indicator"><span className="live-dot" />{pt ? 'Adega pessoal' : 'Personal cellar'}</span>
          <details className="account-menu"><summary><span className="account-avatar">{(email || cellar?.name || 'F').slice(0, 1).toUpperCase()}</span><span className="account-name">{cellar?.name || 'Flint Cellar'}</span><ChevronDown size={14} /></summary>
            <div className="account-dropdown">{email && <p>{email}</p>}{cellars.length > 1 && <label>{pt ? 'Sua adega' : 'Your cellar'}<select value={cellar?.id || ''} disabled={pending} onChange={event => onSwitch(event.target.value)}>{cellars.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>}<button disabled={pending} onClick={onSignOut}><LogOut size={15} />{pt ? 'Sair' : 'Sign out'}</button></div>
          </details>
        </div>
      </header>
      {error && <div role="alert" className="flint-alert shell-alert">{error}</div>}
      <div id="main-content">{children}</div>
      <footer className="flint-footer"><span>flint<span className="brand-period">.</span></span><p>{pt ? 'Colecione momentos. Saboreie histórias.' : 'Collect moments. Savor stories.'}</p><a href="/wine-trivia">{pt ? 'Algo para descobrir' : 'Something to discover'}<ArrowUpRight size={14} /></a></footer>
    </div>
  </div>;
}
