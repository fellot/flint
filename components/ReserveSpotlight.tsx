'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Heart, Users, PartyPopper, Moon, Cherry, Shuffle, Sparkles, Utensils, MessageCircle, Wine as WineIcon, MapPin } from 'lucide-react';
import type { Wine } from '@/types/wine';
import { occasionPicks, occasionCopy, occasions, localEvening, parseEveningPlan, windowNote, type Occasion, type EveningPlan } from '@/utils/reserve';
import { highestCriticScore } from '@/utils/critic-ratings';
import BottlePortrait from './BottlePortrait';
import CriticScores from './CriticScores';
import CellarDialog from './CellarDialog';

const icons = { unwind: Moon, dinner: Heart, company: Users, celebrate: PartyPopper, dessert: Cherry };

export default function ReserveSpotlight({ wines, locale, year, cellarId, onView, onDrink }: {
  wines: Wine[]; locale: 'en' | 'pt'; year: number; cellarId?: string; onView: (wine: Wine) => void; onDrink: (wine: Wine) => void;
}) {
  const pt = locale === 'pt';
  const sectionId = useId();
  const [occasion, setOccasion] = useState<Occasion>('unwind');
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [generated, setGenerated] = useState<EveningPlan | null>(null);
  const [scene, setScene] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sealed, setSealed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showQuestion, setShowQuestion] = useState(false);
  const request = useRef<AbortController | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const restoreFocus = useRef(false);
  useEffect(() => {
    if (!expanded && restoreFocus.current) { trigger.current?.focus(); restoreFocus.current = false; }
  }, [expanded]);
  useEffect(() => () => request.current?.abort(), []);
  const picks = occasionPicks(wines, occasion, year);
  const wine = picks.find(w => w.id === pickedId) || picks[0];
  const aiPlan = wine && generated?.wineId === wine.id ? generated : null;
  const plan = wine ? aiPlan || localEvening(wine, occasion, year, locale) : null;
  const clear = () => {
    request.current?.abort(); request.current = null;
    setBusy(false); setError(''); setGenerated(null); setShowQuestion(false);
  };
  const changeOccasion = (next: Occasion) => { clear(); setOccasion(next); setPickedId(null); setSealed(false); };
  const shuffle = (blind: boolean) => {
    clear();
    const others = picks.filter(p => p.id !== wine?.id);
    if (others.length) setPickedId(others[Math.floor(Math.random() * others.length)].id);
    setSealed(blind);
  };
  async function personalize(event: React.FormEvent) {
    event.preventDefault();
    if (!wine || busy) return;
    clear(); setBusy(true); setSealed(false);
    const controller = new AbortController(); request.current = controller;
    try {
      const response = await fetch('/api/ai/reserve', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ occasion, scene: scene.trim(), cellarId, locale }),
      });
      const data = await response.json();
      if (request.current !== controller) return;
      if (!response.ok) throw new Error('Unavailable');
      const valid = parseEveningPlan(data.plan, picks);
      if (!valid) throw new Error('Invalid plan');
      setPickedId(valid.wineId); setGenerated(valid);
    } catch {
      if (request.current === controller && !controller.signal.aborted) setError(pt ? 'O plano personalizado está indisponível. As sugestões da adega continuam aqui.' : 'Personalized plans are unavailable right now. Your cellar picks still work.');
    } finally {
      if (request.current === controller) { setBusy(false); request.current = null; }
    }
  }
  if (!wines.some(w => w.status === 'in_cellar' && w.quantity > 0)) return null;

  const open = (event: React.MouseEvent<HTMLButtonElement>) => { trigger.current = event.currentTarget; setExpanded(true); };
  const close = (returnFocus = true) => { restoreFocus.current = returnFocus; request.current?.abort(); request.current = null; setBusy(false); setExpanded(false); };
  const viewWine = (selected: Wine) => { close(false); onView(selected); };
  const drinkWine = (selected: Wine) => { close(false); onDrink(selected); };

  return <>
    <aside className="reserve-note" aria-label={pt ? 'Uma ideia da sua adega' : 'An idea from your cellar'}>
      <button type="button" className="reserve-note-bottle" onClick={open} aria-label={pt ? 'Explorar uma garrafa para esta noite' : 'Explore a bottle for tonight'}>
        {wine && !sealed ? <BottlePortrait wine={wine} /> : <WineIcon size={32} strokeWidth={1} />}
      </button>
      <div className="reserve-note-copy">
        <p className="eyebrow">{pt ? 'PARA ESTA NOITE, TALVEZ…' : 'TONIGHT, PERHAPS…'}</p>
        <button type="button" className="reserve-note-name" onClick={open}>{sealed ? (pt ? 'Uma surpresa da sua adega.' : 'A surprise from your cellar.') : wine?.bottle || (pt ? 'Vamos escolher uma garrafa.' : 'Let’s find your bottle.')}</button>
        {wine && !sealed && <p className="reserve-note-meta">{wine.vintage || 'NV'} · {wine.country} · {wine.style}</p>}
        <div className="reserve-note-actions">
          <button type="button" onClick={open} aria-haspopup="dialog">{pt ? 'Escolher o clima' : 'Set the mood'}<ArrowRight size={13} /></button>
          <span aria-hidden="true">·</span>
          <button type="button" disabled={picks.length < 2} onClick={() => shuffle(false)} aria-label={pt ? 'Sugerir outra garrafa' : 'Suggest another bottle'}><Shuffle size={12} />{pt ? 'Outra garrafa' : 'Another bottle'}</button>
        </div>
      </div>
    </aside>
    {expanded && <CellarDialog title={pt ? 'O que vamos abrir?' : 'What shall we open?'} onClose={() => close()} wide>
    <section className="reserve-ritual" aria-label={pt ? 'O ritual desta noite' : 'Tonight’s little ritual'}>
    <div id={sectionId} className="ritual-body">
      <div className="ritual-invitation">
        <span className="ritual-kicker">{pt ? 'DA SUA RESERVA' : 'FROM YOUR RESERVE'}</span>
        <h2>{pt ? <>O que vamos{' '}<br /><em>abrir esta noite?</em></> : <>What shall{' '}<br /><em>we open tonight?</em></>}</h2>
        <p>{pt ? 'Escolha o clima. A gente encontra a garrafa.' : 'Set the mood. We’ll find the bottle.'}</p>
        <div className="ritual-occasions" role="group" aria-label={pt ? 'Qual é a ocasião?' : 'What’s the occasion?'}>{occasions.map(key => {
          const Icon = icons[key];
          return <button type="button" key={key} aria-pressed={occasion === key} onClick={() => changeOccasion(key)}><Icon size={14} strokeWidth={1.5} />{occasionCopy[locale][key].label}</button>;
        })}</div>
        <form className="ritual-scene" onSubmit={personalize}>
          <label htmlFor={`${sectionId}-scene`}>{pt ? 'Tem algo em mente?' : 'Have something in mind?'}</label>
          <div><input id={`${sectionId}-scene`} value={scene} maxLength={240} onChange={e => setScene(e.target.value)} placeholder={pt ? 'Risoto, dia de chuva, discos de jazz…' : 'Mushroom risotto, rainy night, jazz…'} /><button type="submit" disabled={!wine || busy} aria-label={pt ? 'Criar um plano com IA' : 'Make an evening plan with AI'}><Sparkles size={16} className={busy ? 'ritual-working' : ''} /><span>{busy ? (pt ? 'Criando…' : 'Dreaming…') : (pt ? 'Criar a noite' : 'Make a night of it')}</span></button></div>
        </form>
        <p className="ritual-ai-note">{pt ? 'Um toque de IA, inspirado nas suas garrafas.' : 'A little AI inspiration, drawn from your own bottles.'}</p>
        {error && <p className="ritual-error" role="status">{error}</p>}
      </div>
      <div className={`ritual-ticket ${busy ? 'ritual-pending' : ''}`} aria-busy={busy}>
        {wine && plan ? <>
          <div className="ritual-ticket-top"><span>{sealed ? (pt ? 'UMA SURPRESA DA ADEGA' : 'A CELLAR SURPRISE') : aiPlan ? (pt ? 'SEU PLANO · COM IA' : 'YOUR EVENING · AI INSPIRED') : (pt ? 'A ESCOLHA DA NOITE' : 'THE EVENING’S PICK')}</span><span>{String(picks.findIndex(p => p.id === wine.id) + 1).padStart(2, '0')} / {String(picks.length).padStart(2, '0')}</span></div>
          {sealed ? <div className="ritual-mystery" key="mystery">
            <span className="ritual-seal" aria-hidden="true">?</span><h3>{pt ? 'Sem olhar o rótulo.' : 'No peeking at the label.'}</h3>
            <p>{pt ? `Uma pista: ${wine.country || wine.style}.` : `One clue: ${wine.country || wine.style}.`}</p>
            <button type="button" onClick={() => setSealed(false)}>{pt ? 'Revelar a garrafa' : 'Reveal the bottle'}<ArrowRight size={16} /></button>
          </div> : <div className="ritual-reveal" key={wine.id}>
            <div className="ritual-wine">
              <button type="button" className="ritual-bottle" onClick={() => viewWine(wine)} aria-label={`${pt ? 'Ver' : 'View'} ${wine.bottle}`}><span className="ritual-bottle-halo" /><BottlePortrait wine={wine} /><span className="ritual-vintage">{wine.vintage || 'NV'}</span></button>
              <div className="ritual-wine-copy"><p className="ritual-script">{plan.title}</p><button type="button" className="ritual-wine-name" onClick={() => viewWine(wine)}><h3>{wine.bottle}</h3><ArrowUpRight size={16} /></button><p className="ritual-provenance">{wine.vintage || 'NV'} · {wine.country} · {wine.style}</p>{highestCriticScore(wine) !== null && <CriticScores wine={wine} locale={locale} />}<p className="ritual-reason">{plan.reason}</p>{aiPlan && <small className="ritual-window">{windowNote(wine, year, locale)}</small>}</div>
            </div>
            <div className="ritual-table-plan"><Utensils size={15} /><div><span>{pt ? 'À MESA · SUGESTÃO' : 'ON THE TABLE · A SUGGESTION'}</span><p>{plan.meal}</p></div></div>
            <button type="button" className="ritual-conversation" aria-expanded={showQuestion} onClick={() => setShowQuestion(!showQuestion)}><MessageCircle size={14} /><span>{showQuestion ? plan.question : (pt ? 'Puxe uma conversa…' : 'Uncork a conversation…')}</span>{!showQuestion && <ArrowRight size={14} />}</button>
          </div>}
          <footer className="ritual-ticket-footer">
            {!sealed && <button type="button" className="ritual-open" onClick={() => drinkWine(wine)}><WineIcon size={15} />{pt ? 'Vamos abrir' : 'Let’s open this'}<ArrowRight size={15} /></button>}
            <button type="button" className="ritual-shuffle" disabled={picks.length < 2} onClick={() => shuffle(false)}><Shuffle size={14} />{pt ? 'Outra opção' : 'Another pour'}</button>
            <button type="button" className="ritual-blind" disabled={picks.length < 2} onClick={() => shuffle(true)}>{pt ? 'Me surpreenda' : 'Surprise me'}</button>
          </footer>
          {!sealed && wine.location && <span className="ritual-location"><MapPin size={11} />{wine.location}</span>}
          <span className="sr-only" role="status">{busy ? (pt ? 'Criando seu plano' : 'Making your evening plan') : sealed ? (pt ? 'Garrafa surpresa pronta' : 'Mystery bottle ready') : wine.bottle}</span>
        </> : <div className="ritual-empty"><WineIcon size={30} strokeWidth={1} /><h3>{pt ? 'Outro clima?' : 'A different mood?'}</h3><p>{pt ? 'Nenhuma garrafa disponível para esta seleção. Experimente outra ocasião.' : 'No bottles in stock for this selection. Try another occasion.'}</p><button type="button" onClick={() => changeOccasion(occasion === 'dessert' ? 'unwind' : 'dessert')}>{pt ? 'Explorar outra seleção' : 'Explore another selection'}<ArrowRight size={15} /></button></div>}
      </div>
    </div>
    </section>
    </CellarDialog>}
  </>;
}
