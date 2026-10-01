'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Heart, Users, PartyPopper, Moon, Cherry, Shuffle, Sparkles, Utensils, MessageCircle, Wine as WineIcon, MapPin, CloudSun, Search } from 'lucide-react';
import type { Wine } from '@/types/wine';
import type { EveningLocation, WeatherContext, WeatherPlace } from '@/types/evening-context';
import { occasionPicks, occasionCopy, occasions, parseEveningPlan, windowNote, type Occasion, type EveningPlan } from '@/utils/reserve';
import { locateEvening } from '@/utils/evening-location';
import { weatherCondition } from '@/utils/weather-condition';
import { highestCriticScore } from '@/utils/critic-ratings';
import BottlePortrait from './BottlePortrait';
import CriticScores from './CriticScores';
import CellarDialog from './CellarDialog';
import './reserve-context.css';

const icons = { unwind: Moon, dinner: Heart, company: Users, celebrate: PartyPopper, dessert: Cherry };

export default function ReserveSpotlight({ wines, locale, year, cellarId, onView, onDrink }: {
  wines: Wine[]; locale: 'en' | 'pt'; year: number; cellarId?: string; onView: (wine: Wine) => void; onDrink: (wine: Wine) => void;
}) {
  const pt = locale === 'pt';
  const sectionId = useId();
  const [occasion, setOccasion] = useState<Occasion>('unwind');
  const [generated, setGenerated] = useState<EveningPlan | null>(null);
  const [weather, setWeather] = useState<WeatherContext | null>(null);
  const [scene, setScene] = useState('');
  const [phase, setPhase] = useState<'locating' | 'planning' | null>(null);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [showQuestion, setShowQuestion] = useState(false);
  const [locationMode, setLocationMode] = useState<'auto' | 'city' | 'none'>('auto');
  const [locationNote, setLocationNote] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [city, setCity] = useState<WeatherPlace | null>(null);
  const [places, setPlaces] = useState<WeatherPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [cityNote, setCityNote] = useState('');
  const request = useRef<AbortController | null>(null);
  const cityRequest = useRef<AbortController | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const restoreFocus = useRef(false);
  const latestWines = useRef(wines); latestWines.current = wines;
  useEffect(() => {
    if (!expanded && restoreFocus.current) { trigger.current?.focus(); restoreFocus.current = false; }
  }, [expanded]);
  useEffect(() => () => { request.current?.abort(); cityRequest.current?.abort(); }, []);
  const picks = occasionPicks(wines, occasion, year);
  const wine = generated ? picks.find(w => w.id === generated.wineId) : undefined;
  const plan = wine ? generated : null;
  const busy = phase !== null;
  const canPlan = !!cellarId && picks.length > 0 && (locationMode !== 'city' || !!city);
  const pendingText = phase === 'locating' ? (pt ? 'Buscando o clima ao seu redor…' : 'Finding the weather around you…') : (pt ? 'Escolhendo uma garrafa para o momento…' : 'Finding a bottle for this moment…');
  const clear = () => {
    request.current?.abort(); request.current = null;
    setPhase(null); setError(''); setGenerated(null); setWeather(null); setShowQuestion(false);
  };
  const cancelCitySearch = () => { cityRequest.current?.abort(); cityRequest.current = null; setSearching(false); };
  const changeLocation = (next: typeof locationMode) => { clear(); cancelCitySearch(); setLocationMode(next); setLocationNote(''); setCityNote(''); };

  async function findCity() {
    if (!cellarId || cityQuery.trim().length < 2) return;
    cancelCitySearch(); setSearching(true); setCityNote(''); setPlaces([]);
    const controller = new AbortController(); cityRequest.current = controller;
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch('/api/weather/places', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal, body: JSON.stringify({ cellarId, query: cityQuery.trim() }) });
      const data = await response.json();
      if (cityRequest.current !== controller) return;
      if (!response.ok || data.cellarId !== cellarId || !Array.isArray(data.places)) throw new Error('City search unavailable');
      setPlaces(data.places);
      if (!data.places.length) setCityNote(pt ? 'Nenhuma cidade encontrada. Tente um nome próximo.' : 'No cities found. Try a nearby town.');
    } catch {
      if (cityRequest.current === controller) setCityNote(pt ? 'Busca indisponível. Tente novamente ou pule o clima.' : 'City search is unavailable. Try again or skip weather.');
    } finally {
      clearTimeout(timeout);
      if (cityRequest.current === controller) { cityRequest.current = null; setSearching(false); }
    }
  }

  async function personalize(avoidWineId?: string) {
    if (!canPlan || request.current) return;
    clear(); setLocationNote('');
    const controller = new AbortController(); request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 50000);
    try {
      let location: EveningLocation = { mode: 'none' };
      if (locationMode === 'auto') {
        setPhase('locating');
        location = await locateEvening(controller.signal);
        if (request.current !== controller) return;
        if (location.mode === 'none') {
          setLocationMode('none');
          setLocationNote(pt ? 'Localização não compartilhada. Vamos seguir sem o clima; você também pode escolher uma cidade.' : 'Location wasn’t shared. We’ll continue without weather; you can also choose a city.');
        }
      } else if (locationMode === 'city' && city) location = { mode: 'city', placeId: city.id };
      setPhase('planning');
      const response = await fetch('/api/ai/reserve', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ occasion, scene: scene.trim(), cellarId, location, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, ...(avoidWineId ? { avoidWineId } : {}) }),
      });
      const data = await response.json();
      if (request.current !== controller) return;
      if (!response.ok) throw new Error([409, 429].includes(response.status) && typeof data.error === 'string' ? data.error : (pt ? 'Não foi possível criar a sugestão. Tente novamente.' : 'We couldn’t create your recommendation. Please try again.'));
      const valid = parseEveningPlan(data.plan, occasionPicks(latestWines.current, occasion, year));
      if (!valid || data.cellarId !== cellarId || valid.wineId === avoidWineId) throw new Error(pt ? 'A adega mudou. Tente uma nova sugestão.' : 'The cellar has changed. Please request a fresh recommendation.');
      setGenerated(valid); setWeather(data.weather || { status: 'unavailable' });
    } catch (cause) {
      if (request.current === controller) setError(controller.signal.aborted ? (pt ? 'Demorou demais. Tente novamente.' : 'That took too long. Please try again.') : cause instanceof Error ? cause.message : (pt ? 'Tente novamente.' : 'Please try again.'));
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) { setPhase(null); request.current = null; }
    }
  }
  if (!wines.some(w => w.status === 'in_cellar' && w.quantity > 0)) return null;

  const open = (event: React.MouseEvent<HTMLButtonElement>) => { trigger.current = event.currentTarget; setExpanded(true); };
  const surprise = (event: React.MouseEvent<HTMLButtonElement>) => { open(event); void personalize(); };
  const close = (returnFocus = true) => { restoreFocus.current = returnFocus; request.current?.abort(); request.current = null; cancelCitySearch(); setPhase(null); setExpanded(false); };
  const viewWine = (selected: Wine) => { close(false); onView(selected); };
  const drinkWine = (selected: Wine) => { close(false); onDrink(selected); };

  return <>
    <aside className="reserve-note" aria-label={pt ? 'Uma ideia da sua adega' : 'An idea from your cellar'}>
      <button type="button" className={`reserve-note-bottle ${wine ? '' : 'reserve-note-invitation'}`} onClick={open} aria-label={pt ? 'Preparar uma surpresa' : 'Set the scene for a surprise'}>
        {wine ? <BottlePortrait wine={wine} /> : <Sparkles size={26} strokeWidth={1} />}
      </button>
      <div className="reserve-note-copy">
        <p className="eyebrow">{pt ? 'O MOMENTO. A GARRAFA.' : 'THE MOMENT. THE BOTTLE.'}</p>
        <button type="button" className="reserve-note-name" onClick={open}>{wine?.bottle || (pt ? 'Sua adega tem uma surpresa.' : 'Your cellar has a surprise in it.')}</button>
        <p className="reserve-note-meta">{wine ? `${wine.vintage || 'NV'} · ${wine.country} · ${wine.style}` : (pt ? 'Seu clima, seu paladar, algo inesperado.' : 'Your mood, your palate, a little unexpected.')}</p>
        <div className="reserve-note-actions">
          <button type="button" onClick={wine ? open : surprise} aria-haspopup="dialog"><Sparkles size={13} />{wine ? (pt ? 'Ver sua sugestão' : 'See your pick') : (pt ? 'Me surpreenda' : 'Surprise me')}<ArrowRight size={13} /></button>
          <span aria-hidden="true">·</span>
          <button type="button" onClick={open} aria-haspopup="dialog">{pt ? 'Preparar o momento' : 'Set the scene'}</button>
        </div>
        {!wine && <p className="reserve-location-disclosure">{pt ? 'Com sua permissão, usa a localização aproximada para consultar o clima.' : 'Uses approximate location for weather, with your permission.'}</p>}
      </div>
    </aside>
    {expanded && <CellarDialog title={pt ? 'O que vamos abrir?' : 'What shall we open?'} onClose={() => close()} wide>
      <section className="reserve-ritual" aria-label={pt ? 'Uma garrafa para o momento' : 'A bottle for this moment'}>
        <div className="ritual-body">
          <div className="ritual-invitation">
            <span className="ritual-kicker">{pt ? 'DA SUA RESERVA' : 'FROM YOUR RESERVE'}</span>
            <h2>{pt ? <>Um momento.<br /><em>Uma boa garrafa.</em></> : <>A little serendipity.<br /><em>From your cellar.</em></>}</h2>
            <p>{pt ? 'Seu paladar, o clima lá fora e o que você tem em mente. Vamos juntar tudo.' : 'Your palate, the weather outside, and whatever you have in mind. Let’s put them together.'}</p>
            <div className="ritual-occasions" role="group" aria-label={pt ? 'Qual é a ocasião?' : 'What’s the occasion?'}>{occasions.map(key => {
              const Icon = icons[key];
              return <button type="button" key={key} aria-pressed={occasion === key} onClick={() => { clear(); setOccasion(key); }}><Icon size={14} strokeWidth={1.5} />{occasionCopy[locale][key].label}</button>;
            })}</div>
            <form className="ritual-scene" onSubmit={e => { e.preventDefault(); void personalize(); }}>
              <label htmlFor={`${sectionId}-scene`}>{pt ? 'Tem algo em mente?' : 'Have something in mind?'}</label>
              <input id={`${sectionId}-scene`} value={scene} maxLength={240} onChange={e => { clear(); setScene(e.target.value); }} placeholder={pt ? 'Risoto, sofá, discos de jazz…' : 'Mushroom risotto, staying in, jazz…'} />
              <fieldset className="ritual-context-field">
                <legend><CloudSun size={14} />{pt ? 'O clima entra na conversa?' : 'Let the weather join in?'}</legend>
                <div className="ritual-location-modes">{(['auto', 'city', 'none'] as const).map(mode => <label key={mode}><input type="radio" name={`${sectionId}-location`} checked={locationMode === mode} onChange={() => changeLocation(mode)} /><span>{mode === 'auto' ? (pt ? 'Perto de mim' : 'Near me') : mode === 'city' ? (pt ? 'Uma cidade' : 'Choose a city') : (pt ? 'Sem clima' : 'Skip weather')}</span></label>)}</div>
                {locationMode === 'auto' && <p className="ritual-privacy">{pt ? 'Ao pedir a sugestão, o navegador pode solicitar sua permissão. A localização é aproximada antes do envio; a IA recebe o clima, não suas coordenadas.' : 'When you ask for a pick, your browser may request permission. We coarsen your location first; AI gets the weather, not your coordinates.'}</p>}
                {locationMode === 'none' && <p className="ritual-privacy">{pt ? 'Só seu clima, sua comida e suas garrafas.' : 'Just your mood, your food and your bottles.'}</p>}
                {locationMode === 'city' && <div className="ritual-city">
                  <label className="sr-only" htmlFor={`${sectionId}-city`}>{pt ? 'Nome da cidade' : 'City name'}</label>
                  <div className="ritual-city-search"><input id={`${sectionId}-city`} value={cityQuery} maxLength={100} placeholder={pt ? 'Cidade, região…' : 'City, region…'} onChange={e => { clear(); cancelCitySearch(); setCityQuery(e.target.value); setCity(null); setPlaces([]); setCityNote(''); }} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void findCity(); } }} /><button type="button" disabled={searching || cityQuery.trim().length < 2} onClick={() => void findCity()} aria-label={pt ? 'Buscar cidade' : 'Search cities'}><Search size={16} /></button></div>
                  {!!places.length && !city && <ul className="ritual-city-results" aria-label={pt ? 'Escolha uma cidade' : 'Choose a city'}>{places.map(place => <li key={place.id}><button type="button" onClick={() => { clear(); setCity(place); setPlaces([]); }}><MapPin size={12} />{place.label}</button></li>)}</ul>}
                  {city && <p className="ritual-city-selected"><MapPin size={12} />{city.label}<button type="button" onClick={() => { clear(); setCity(null); }}>{pt ? 'Trocar' : 'Change'}</button></p>}
                  <p className="ritual-privacy" role="status">{searching ? (pt ? 'Buscando…' : 'Searching…') : cityNote}</p>
                </div>}
              </fieldset>
              {locationNote && <p className="ritual-privacy" role="status">{locationNote}</p>}
              <button type="submit" className="ritual-generate" disabled={!canPlan || busy}><Sparkles size={16} className={busy ? 'ritual-working' : ''} />{busy ? (pt ? 'Preparando…' : 'A moment…') : (pt ? 'Me surpreenda' : 'Surprise me')}<ArrowRight size={15} /></button>
            </form>
            <p className="ritual-ai-note">{pt ? 'IA inspirada nas suas garrafas, nas janelas de consumo e nas suas preferências. Nada é salvo sem sua ação.' : 'AI inspired by your bottles, drinking windows and taste preferences. Opening a bottle is always your choice.'}</p>
            {!picks.length && <p className="ritual-error">{pt ? 'Sem garrafas para esta ocasião. Experimente outra.' : 'No bottles for this occasion. Try another mood.'}</p>}
            {error && <p className="ritual-error" role="alert">{error}</p>}
          </div>
          <div className="ritual-ticket" aria-busy={busy}>
            {wine && plan ? <>
              <div className="ritual-ticket-top"><span>{pt ? 'PARA ESTE MOMENTO · COM IA' : 'FOR THIS MOMENT · AI INSPIRED'}</span></div>
              {weather && <div className="ritual-weather"><CloudSun size={17} /><div>{weather.status === 'available' ? <>
                <strong>{Math.round(weather.temperatureC)}°C · {weatherCondition(weather.weatherCode, locale)}</strong>
                <span>{weather.place || (pt ? 'Perto de você' : 'Near you')} · {pt ? 'sensação de' : 'feels like'} {Math.round(weather.feelsLikeC)}°C</span>
                <small>{pt ? 'Estimativa local' : 'Local estimate'} · {new Date(weather.validAt).toLocaleTimeString(locale === 'pt' ? 'pt-BR' : 'en-CA', { timeZone: weather.timezone, hour: '2-digit', minute: '2-digit' })} · <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a>{weather.place && <> / <a href="https://www.geonames.org/" target="_blank" rel="noopener noreferrer">GeoNames</a></>}</small>
              </> : <span>{weather.status === 'unavailable' ? (pt ? 'Clima indisponível. Sugestão baseada no seu contexto e na adega.' : 'Weather unavailable. Based on your scene and cellar.') : (pt ? 'Baseado no seu contexto e na adega. Sem dados de clima.' : 'Based on your scene and cellar. No weather used.')}</span>}</div></div>}
              <div className="ritual-reveal" key={wine.id}>
                <div className="ritual-wine">
                  <button type="button" className="ritual-bottle" onClick={() => viewWine(wine)} aria-label={`${pt ? 'Ver' : 'View'} ${wine.bottle}`}><BottlePortrait wine={wine} /><span className="ritual-vintage">{wine.vintage || 'NV'}</span></button>
                  <div className="ritual-wine-copy"><p className="ritual-script">{plan.title}</p><button type="button" className="ritual-wine-name" onClick={() => viewWine(wine)}><h3>{wine.bottle}</h3><ArrowUpRight size={16} /></button><p className="ritual-provenance">{wine.vintage || 'NV'} · {wine.country} · {wine.style}</p>{highestCriticScore(wine) !== null && <CriticScores wine={wine} locale={locale} />}<p className="ritual-reason">{plan.reason}</p>{!!plan.evidence?.length && <details className="ritual-evidence"><summary>{pt ? 'Do seu diário' : 'From your journal'}</summary><ul>{plan.evidence.map(entry => <li key={entry.id}>{entry.bottle} · {entry.vintage || 'NV'}{entry.score === null ? '' : ` · ${entry.score}/100`}</li>)}</ul></details>}<small className="ritual-window">{windowNote(wine, year, locale)}</small></div>
                </div>
                <div className="ritual-table-plan"><Utensils size={15} /><div><span>{pt ? 'À MESA · SUGESTÃO' : 'ON THE TABLE · A SUGGESTION'}</span><p>{plan.meal}</p></div></div>
                <button type="button" className="ritual-conversation" aria-expanded={showQuestion} onClick={() => setShowQuestion(!showQuestion)}><MessageCircle size={14} /><span>{showQuestion ? plan.question : (pt ? 'Puxe uma conversa…' : 'Uncork a conversation…')}</span>{!showQuestion && <ArrowRight size={14} />}</button>
              </div>
              <footer className="ritual-ticket-footer">
                <button type="button" className="ritual-open" onClick={() => drinkWine(wine)}><WineIcon size={15} />{pt ? 'Vamos abrir' : 'Let’s open this'}<ArrowRight size={15} /></button>
                <button type="button" className="ritual-shuffle" disabled={picks.length < 2 || busy} onClick={() => void personalize(wine.id)}><Shuffle size={14} />{pt ? 'Outra ideia · IA' : 'Another idea · AI'}</button>
              </footer>
              {wine.location && <span className="ritual-location"><MapPin size={11} />{wine.location}</span>}
            </> : <div className="ritual-empty ritual-awaiting">
              <span className={`ritual-orbit ${busy ? 'ritual-working' : ''}`}><Sparkles size={32} strokeWidth={1} /></span>
              <span className="ritual-kicker">{pt ? 'UM POUCO DE ACASO. MUITO DE VOCÊ.' : 'A LITTLE CHANCE. A LOT OF YOU.'}</span>
              <h3>{busy ? (pt ? 'Juntando as pistas…' : 'Connecting the little things…') : (pt ? 'A boa surpresa começa aqui.' : 'Leave a little room for surprise.')}</h3>
              <p>{busy ? pendingText : (pt ? 'Conte o que tem em mente ou deixe conosco. A sugestão só aparece quando você pedir.' : 'Set the scene, or leave it to us. We’ll choose a bottle only when you ask.')}</p>
              <div className="ritual-context-cues"><span><WineIcon size={12} />{pt ? 'Sua adega' : 'Your cellar'}</span><span><Heart size={12} />{pt ? 'Seu paladar' : 'Your palate'}</span><span><CloudSun size={12} />{pt ? 'Seu momento' : 'Your moment'}</span></div>
            </div>}
            <span className="sr-only" role="status">{busy ? pendingText : wine?.bottle || ''}</span>
          </div>
        </div>
      </section>
    </CellarDialog>}
  </>;
}
