'use client';

import { useState } from 'react';
import { ArrowUpRight, GlassWater, Shuffle } from 'lucide-react';
import type { Wine } from '@/types/wine';
import { reservePicks, type ReserveMode } from '@/utils/reserve';
import BottlePortrait from './BottlePortrait';
import CriticScores from './CriticScores';

export default function ReserveSpotlight({ wines, locale, year, onView, onDrink }: {
  wines: Wine[]; locale: 'en' | 'pt'; year: number; onView: (wine: Wine) => void; onDrink: (wine: Wine) => void;
}) {
  const pt = locale === 'pt';
  const [mode, setMode] = useState<ReserveMode>('explore');
  const [pickedId, setPickedId] = useState<string | null>(null);
  const picks = reservePicks(wines, mode, year);
  const wine = picks.find(wine => wine.id === pickedId) || picks[0];
  if (!wines.some(wine => wine.status === 'in_cellar' && wine.quantity > 0)) return null;
  const options: { key: ReserveMode; label: string }[] = [
    { key: 'explore', label: pt ? 'Descobrir' : 'Explore' },
    { key: 'ready', label: pt ? 'Prontos para abrir' : 'Ready now' },
    { key: 'critics', label: pt ? 'Favoritos da crítica' : 'Critics’ picks' },
  ];
  const another = () => {
    const others = picks.filter(pick => pick.id !== wine?.id);
    if (others.length) setPickedId(others[Math.floor(Math.random() * others.length)].id);
  };
  return <section className="reserve-discovery" aria-label={pt ? 'Da sua reserva' : 'From your reserve'}>
    <header><span className="eyebrow">{pt ? 'DA SUA RESERVA' : 'FROM YOUR RESERVE'}</span><span className="reserve-pick-count">{picks.length} {pt ? 'opções' : 'picks'}</span></header>
    <div className="reserve-pick-modes" role="group" aria-label={pt ? 'Escolha uma seleção' : 'Choose a selection'}>{options.map(option => <button key={option.key} aria-pressed={mode === option.key} onClick={() => { setMode(option.key); setPickedId(null); }}>{option.label}</button>)}</div>
    <div className="reserve-pick-content" aria-live="polite" aria-atomic="true">
      {wine ? <>
        <button className="reserve-pick-wine" onClick={() => onView(wine)} aria-label={`${pt ? 'Ver detalhes de' : 'View details of'} ${wine.bottle}`}>
          <BottlePortrait wine={wine} /><span><strong>{wine.bottle}</strong><small>{wine.vintage || 'NV'} · {wine.country} · {wine.style}</small></span><ArrowUpRight size={16} />
        </button>
        <div className="reserve-pick-context">{mode === 'critics' ? <CriticScores wine={wine} locale={locale} /> : <span>{mode === 'ready' ? (pt ? 'Da sua seleção de vinhos prontos para abrir.' : 'From your ready-to-enjoy selection.') : (pt ? 'Uma descoberta na sua própria adega.' : 'A discovery from your own cellar.')}</span>}</div>
      </> : <p className="reserve-pick-empty">{mode === 'ready' ? (pt ? 'Nenhum vinho com janela de consumo aberta. Explore sua reserva.' : 'No wines with a current drinking window. Try Explore.') : (pt ? 'Ainda não há notas de críticos nesta seleção. Explore sua reserva.' : 'No critic scores available yet. Try Explore.')}</p>}
    </div>
    <footer>{wine && <button className="reserve-open" onClick={() => onDrink(wine)}><GlassWater size={13} />{pt ? 'Abrir uma garrafa' : 'Open a bottle'}</button>}<button className="reserve-another" onClick={another} disabled={picks.length < 2} title={picks.length < 2 ? (pt ? 'Sem outras garrafas nesta seleção' : 'No other bottles in this selection') : undefined}><Shuffle size={13} />{pt ? 'Outra opção' : 'Another bottle'}</button></footer>
  </section>;
}
