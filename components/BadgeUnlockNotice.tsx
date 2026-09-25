'use client';

import { ArrowRight, Award, X } from 'lucide-react';
import type { JournalBadgeAward } from '@/lib/journal-badges';
import './badge-unlock-notice.css';

export default function BadgeUnlockNotice({ awards, locale, onDismiss }: { awards: JournalBadgeAward[]; locale: 'en' | 'pt'; onDismiss: () => void }) {
  if (!awards.length) return null;
  const pt = locale === 'pt';
  return <aside className="badge-unlock-notice" aria-label={pt ? 'Novas conquistas' : 'New discoveries'}>
    <span className="badge-unlock-seal" aria-hidden="true"><Award size={29} strokeWidth={1.3} /></span>
    <div>
      <div role="status" aria-live="polite" aria-atomic="true">
        <p className="badge-unlock-eyebrow">{pt ? 'UMA NOVA HISTÓRIA PARA CONTAR' : 'A NEW STORY TO TELL'}</p>
        <h2>{pt ? `${awards.length} ${awards.length === 1 ? 'conquista desbloqueada' : 'conquistas desbloqueadas'}` : `${awards.length} ${awards.length === 1 ? 'badge unlocked' : 'badges unlocked'}`}</h2>
        <ul>{awards.slice(0, 4).map(award => <li key={award.badge.id}>{award.badge.family === 'essential' ? (pt ? 'Essencial' : 'Cellar essential') : (pt ? 'Descoberta' : 'Discovery')}<span aria-hidden="true"> · </span><strong>{award.badge.name[locale]}</strong></li>)}</ul>
        {awards.length > 4 && <p className="badge-unlock-more">{pt ? `E mais ${awards.length - 4} no seu diário.` : `Plus ${awards.length - 4} more in your journal.`}</p>}
      </div>
      <a href="/cellar-journal#journal-badges" onClick={onDismiss}>{pt ? 'Ver minhas conquistas' : 'See my badges'}<ArrowRight size={14} /></a>
    </div>
    <button type="button" className="badge-unlock-close" onClick={onDismiss} aria-label={pt ? 'Fechar conquistas' : 'Dismiss badge notification'}><X size={17} /></button>
  </aside>;
}
