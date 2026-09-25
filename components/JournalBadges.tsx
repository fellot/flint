'use client';

import { useId, useMemo, useState } from 'react';
import { ArrowUpRight, Award, Check, ChevronDown, Compass, Grape, Landmark, Sparkles, Wine, X } from 'lucide-react';
import { JOURNAL_BADGES, type JournalBadgeDefinition } from '@/data/journal-badges';
import type { JournalBadgeAward } from '@/lib/journal-badges';
import './journal-badges.css';

interface Props {
  awards: JournalBadgeAward[];
  locale: 'en' | 'pt';
  loading?: boolean;
  error?: boolean;
  onViewWine: (id: string) => void;
}

const BADGE_ICONS = { wine: Wine, grape: Grape, compass: Compass, sparkles: Sparkles, landmark: Landmark };
const PREVIEW_COUNT = 6;

function dateLabel(value: string | null, locale: 'en' | 'pt') {
  if (!value) return locale === 'pt' ? 'Data não registrada' : 'Date not recorded';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return locale === 'pt' ? 'Data não registrada' : 'Date not recorded';
  return new Intl.DateTimeFormat(locale === 'pt' ? 'pt-BR' : 'en-CA', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
}

export function JournalBadgeSeal({ badge, earned = true }: { badge: JournalBadgeDefinition; earned?: boolean }) {
  const Icon = BADGE_ICONS[badge.icon];
  return <span className={`journal-badge-seal badge-seal-${badge.category || 'discovery'} ${earned ? 'is-earned' : 'is-unearned'}`} aria-hidden="true">
    <span className="journal-badge-seal-ring"><Icon size={24} strokeWidth={1.35} /></span>
    <span className="journal-badge-seal-mark">{earned ? <Check size={9} strokeWidth={2.5} /> : <span>✧</span>}</span>
  </span>;
}

export default function JournalBadges({ awards, locale, loading = false, error = false, onViewWine }: Props) {
  const pt = locale === 'pt';
  const sectionId = useId();
  const [mode, setMode] = useState<'earned' | 'discover'>('earned');
  const [expanded, setExpanded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const available = !loading && !error;
  const awardMap = useMemo(() => new Map(awards.map(award => [award.badge.id, award])), [awards]);
  const earned = useMemo(() => [...awards].sort((a, b) => {
    const aDate = a.earnedOn ? Date.parse(a.earnedOn) : NaN;
    const bDate = b.earnedOn ? Date.parse(b.earnedOn) : NaN;
    return (Number.isFinite(bDate) ? bDate : 0) - (Number.isFinite(aDate) ? aDate : 0) || a.badge.name[locale].localeCompare(b.badge.name[locale]);
  }).map(award => award.badge), [awards, locale]);
  const undiscovered = JOURNAL_BADGES.filter(badge => !awardMap.has(badge.id));
  const collection = mode === 'earned' ? earned : undiscovered;
  const visible = expanded ? collection : collection.slice(0, PREVIEW_COUNT);
  const selected = available ? collection.find(badge => badge.id === selectedId) : undefined;
  const selectedAward = selected ? awardMap.get(selected.id) : undefined;
  const familyLabel = (badge: JournalBadgeDefinition) => badge.family === 'essential'
    ? (pt ? 'Essencial da adega' : 'Cellar essential')
    : (pt ? 'Descoberta' : 'Discovery');
  const switchMode = (next: 'earned' | 'discover') => { setMode(next); setExpanded(false); setSelectedId(null); };

  return <section id="journal-badges" className="journal-badges" aria-labelledby={`${sectionId}-heading`} aria-busy={loading}>
    <header className="journal-badges-header">
      <div className="journal-badges-title"><Award size={23} strokeWidth={1.3} /><div><p className="eyebrow">{pt ? 'SEU PASSAPORTE DE VINHOS' : 'YOUR TASTING PASSPORT'}</p><h2 id={`${sectionId}-heading`}>{pt ? 'Suas descobertas.' : 'Your discoveries.'}</h2></div></div>
      {available && <div className="journal-badges-switch" role="group" aria-label={pt ? 'Coleção de emblemas' : 'Badge collection'}>
        <button type="button" aria-pressed={mode === 'earned'} onClick={() => switchMode('earned')}>{pt ? 'Conquistados' : 'Earned'}<span>{awards.length}</span></button>
        <button type="button" aria-pressed={mode === 'discover'} onClick={() => switchMode('discover')}><Compass size={13} />{pt ? 'A descobrir' : 'To discover'}</button>
      </div>}
    </header>

    {!available ? <p className="journal-badges-status" role={error ? 'alert' : 'status'}>{loading ? (pt ? 'Reunindo as descobertas do seu diário…' : 'Gathering the discoveries in your journal…') : (pt ? 'Os emblemas estarão disponíveis quando seu diário carregar.' : 'Badges will be available when your journal loads.')}</p> : <>
      {!!visible.length && <ul className="journal-badges-grid" id={`${sectionId}-collection`}>
        {visible.map(badge => {
          const isEarned = awardMap.has(badge.id);
          const isSelected = selected?.id === badge.id;
          return <li key={badge.id}>
            <button type="button" className={`journal-badge-tile ${isEarned ? 'is-earned' : 'is-unearned'}`} aria-expanded={isSelected} aria-controls={isSelected ? `${sectionId}-detail` : undefined} onClick={() => setSelectedId(isSelected ? null : badge.id)}>
              <JournalBadgeSeal badge={badge} earned={isEarned} />
              <span className="journal-badge-name">{badge.name[locale]}</span>
              <span className="journal-badge-family">{familyLabel(badge)}</span>
            </button>
          </li>;
        })}
      </ul>}

      {!collection.length && <div className="journal-badges-empty"><Sparkles size={23} strokeWidth={1.3} /><div><h3>{mode === 'earned' ? (pt ? 'Toda descoberta começa com uma história.' : 'Every discovery starts with a story.') : (pt ? 'Um passaporte cheio de histórias.' : 'A passport full of stories.')}</h3><p>{mode === 'earned' ? (pt ? 'Seus emblemas aparecem a partir dos vinhos do seu diário, incluindo os que você já registrou.' : 'Badges come from the wines in your journal, including those you’ve already recorded.') : (pt ? 'Você já conheceu todos os estilos desta coleção. Seus vinhos continuam contando novas histórias.' : 'You’ve explored every style in this collection. Your wines still have new stories to tell.')}</p>{mode === 'earned' && <button type="button" onClick={() => switchMode('discover')}>{pt ? 'Conhecer os emblemas' : 'Explore the badges'}<ArrowUpRight size={13} /></button>}</div></div>}

      {selected && <div className="journal-badge-detail" id={`${sectionId}-detail`}>
        <div className="journal-badge-detail-copy"><p className="eyebrow">{familyLabel(selected)}</p><h3>{selected.name[locale]}</h3><p>{selected.description[locale]}</p></div>
        <div className="journal-badge-proof">{selectedAward ? <><span>{pt ? 'PRIMEIRO REGISTRO NO SEU DIÁRIO' : 'FIRST RECORDED IN YOUR JOURNAL'}</span><strong>{selectedAward.bottle}</strong><p>{selectedAward.vintage || (pt ? 'Sem safra' : 'Non-vintage')}<span aria-hidden="true"> · </span>{dateLabel(selectedAward.earnedOn, locale)}</p><button type="button" onClick={() => onViewWine(selectedAward.wineId)}>{pt ? 'Ver no diário' : 'View journal entry'}<ArrowUpRight size={14} /></button></> : <><span>{pt ? 'UMA DESCOBERTA PARA OUTRA HISTÓRIA' : 'A DISCOVERY FOR ANOTHER STORY'}</span><p>{pt ? 'Um vinho que corresponda a este estilo no seu diário pessoal conquista o emblema. Não é preciso atribuir uma nota.' : 'A matching wine in your personal journal earns this badge. No rating is required.'}</p></>}</div>
        <button className="journal-badge-detail-close" type="button" aria-label={pt ? 'Fechar detalhes do emblema' : 'Close badge details'} onClick={() => setSelectedId(null)}><X size={17} /></button>
      </div>}

      <footer className="journal-badges-footer"><p>{pt ? 'Um emblema por descoberta. Seu diário anterior também conta.' : 'One badge per discovery. Your past journal entries count too.'}</p>{collection.length > PREVIEW_COUNT && <button type="button" aria-expanded={expanded} aria-controls={`${sectionId}-collection`} onClick={() => { setExpanded(!expanded); setSelectedId(null); }}>{expanded ? (pt ? 'Mostrar menos' : 'Show fewer') : (pt ? `Ver todos (${collection.length})` : `View all badges (${collection.length})`)}<ChevronDown size={14} className={expanded ? 'is-expanded' : ''} /></button>}</footer>
    </>}
  </section>;
}
