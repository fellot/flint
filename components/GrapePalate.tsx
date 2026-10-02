'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Grape, Plus, Search } from 'lucide-react';
import { GRAPES, grapeName, normalizeGrapeText } from '@/data/grapes';
import { GRAPE_LABELS, GRAPE_NOTE_LIMIT, GRAPE_PREFERENCE_LIMIT } from '@/lib/grape-profile';
import type { GrapePreference, PalatePreferences, PalateProfile } from '@/types/palate';

export default function GrapePalate({ profile, draft, onChange, pt, cellarName }: {
  profile: PalateProfile; draft: PalatePreferences; onChange: (preferences: GrapePreference[]) => void;
  pt: boolean; cellarName: string;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'stated' | 'journal'>('all');
  const [showAll, setShowAll] = useState(false);
  const [notice, setNotice] = useState('');
  const locale = pt ? 'pt' : 'en';
  const journal = draft.journal_enabled ? profile.grapes : [];
  // Keep a journal card in place while its label/notes are being edited.
  const ids = Array.from(new Set([...journal.map(g => g.grapeId), ...draft.grape_preferences.map(p => p.grapeId)]));
  const matches = (id: string) => {
    const grape = GRAPES.find(g => g.id === id);
    return normalizeGrapeText([grape?.name || id, ...(grape && 'aliases' in grape ? grape.aliases : [])].join(' ')).includes(normalizeGrapeText(query));
  };
  const filtered = ids.filter(id => matches(id)
    && (filter !== 'stated' || draft.grape_preferences.some(p => p.grapeId === id))
    && (filter !== 'journal' || journal.some(g => g.grapeId === id)));
  const suggestions = GRAPES.filter(g => !ids.includes(g.id) && matches(g.id)).slice(0, 8);
  const atLimit = draft.grape_preferences.length >= GRAPE_PREFERENCE_LIMIT;
  const journalSettingsChanged = draft.journal_enabled !== profile.preferences.journal_enabled
    || JSON.stringify(draft.dismissed_patterns) !== JSON.stringify(profile.preferences.dismissed_patterns);
  function setPreference(grapeId: string, preference: GrapePreference['preference'], notes?: string) {
    const current = draft.grape_preferences.find(p => p.grapeId === grapeId);
    if (!current && atLimit) return;
    const next = { grapeId, preference, notes: notes ?? current?.notes ?? '' };
    onChange(current ? draft.grape_preferences.map(p => p.grapeId === grapeId ? next : p) : [...draft.grape_preferences, next]);
  }
  function explore(grapeId: string) {
    setPreference(grapeId, 'explore');
    setQuery(''); setFilter('stated'); setShowAll(true);
    setNotice(`${grapeName(grapeId)} — ${pt ? 'adicionada para explorar. Salve seu paladar para guardar.' : 'added to explore. Save your palate to keep it.'}`);
  }
  return <section className="grape-palate" aria-labelledby="grape-profile-title">
    <header className="grape-heading">
      <div><p className="eyebrow">01 / {pt ? 'DE UVA EM UVA' : 'GRAPE BY GRAPE'}</p>
        <h2 id="grape-profile-title">{pt ? 'As uvas do seu paladar.' : 'Your taste, by grape.'}</h2>
        <p className="palate-muted">{pt ? 'Um retrato das suas provas, com espaço para o que você já sabe e o que quer descobrir.' : 'A portrait of your tastings, with room for what you know and what you’re curious about.'}</p>
      </div>
      <div className="grape-tally"><Grape size={24} aria-hidden="true" /><strong>{ids.length}</strong><span>{pt ? 'uvas no perfil' : 'grapes in your profile'}</span></div>
    </header>
    <p className="grape-method">{pt ? 'Suas preferências valem em todas as suas adegas. As pistas abaixo vêm só do seu diário em' : 'Your preferences follow you across cellars. Journal clues below come only from your tastings in'} <strong>{cellarName}</strong>. {pt ? 'As médias são de vinhos com uma única uva registrada. Notas de blends não são atribuídas a cada uva.' : 'Averages use wines recorded with a single grape. Blend scores aren’t assigned to each grape.'}</p>
    <div className="grape-toolbar">
      <label className="grape-search"><Search size={17} aria-hidden="true" /><span className="sr-only">{pt ? 'Buscar uma uva' : 'Find a grape'}</span><input value={query} placeholder={pt ? 'Busque uma uva, ex.: Shiraz…' : 'Find a grape, e.g. Shiraz…'} onChange={e => { setQuery(e.target.value); setShowAll(false); }} /></label>
      <div className="grape-filters" aria-label={pt ? 'Filtrar perfil' : 'Filter grape profile'}>
        {(['all', 'stated', 'journal'] as const).map(value => <button type="button" key={value} aria-pressed={filter === value} onClick={() => { setFilter(value); setShowAll(false); }}>{value === 'all' ? (pt ? 'Todas' : 'All grapes') : value === 'stated' ? (pt ? 'O que eu digo' : 'My preferences') : (pt ? 'Do diário' : 'From my journal')}</button>)}
      </div>
    </div>
    {journalSettingsChanged && <p className="grape-notice" role="status">{pt ? 'Salve para atualizar as pistas com as novas opções do diário.' : 'Save to refresh the clues using your updated journal settings.'}</p>}
    {!draft.journal_enabled && <p className="grape-notice">{pt ? 'Aprendizado do diário desativado. Você ainda pode contar quais uvas gosta e quer explorar.' : 'Journal learning is off. You can still tell us which grapes you enjoy and want to explore.'}</p>}
    {atLimit && <p className="grape-notice">{pt ? 'Você tem 40 preferências. Remova uma antes de adicionar outra.' : 'You have 40 preferences. Clear one before adding another.'}</p>}
    <div className="grape-grid">
      {(showAll ? filtered : filtered.slice(0, 6)).map(id => {
        const stated = draft.grape_preferences.find(p => p.grapeId === id);
        const learned = journal.find(g => g.grapeId === id);
        const grape = GRAPES.find(g => g.id === id);
        return <article className={`grape-card ${stated ? `grape-${stated.preference}` : ''}`} key={id} aria-label={grapeName(id)}>
          <div className="grape-card-heading"><div><h3>{grapeName(id)}</h3>{grape && 'aliases' in grape && <p className="grape-aliases">{grape.aliases.join(' · ')}</p>}</div>
            <span className={`grape-source ${stated ? 'stated' : ''}`}>{stated ? (pt ? 'Você diz' : 'You say') : (pt ? 'Pista do diário' : 'Journal clue')}</span>
          </div>
          <div className="grape-labels" role="group" aria-label={`${pt ? 'Minha preferência por' : 'My preference for'} ${grapeName(id)}`}>
            {(Object.keys(GRAPE_LABELS) as GrapePreference['preference'][]).map(value => <button key={value} type="button" aria-pressed={stated?.preference === value} disabled={!stated && atLimit} onClick={() => setPreference(id, value)}>{GRAPE_LABELS[value][locale]}</button>)}
          </div>
          {learned ? <div className="grape-evidence-summary">
            {learned.average !== null ? <><div className="grape-average"><strong>{learned.average}<small>/100</small></strong><span>{pt ? 'média dos seus vinhos com uma única uva' : 'your average for single-grape wines'}</span></div>
              <p>{learned.scoredSingleWines === 1 ? (pt ? 'Uma primeira pista · 1 vinho avaliado' : 'An early clue · 1 scored wine') : `${learned.scoredSingleWines} ${pt ? 'vinhos diferentes avaliados' : 'distinct scored wines'}`}</p></>
              : <p>{learned.singleWines ? (pt ? 'Ainda sem notas para os vinhos com uma única uva.' : 'No scores for single-grape wines yet.') : (pt ? 'Vista em blends ou composições incompletas; ainda sem pista isolada.' : 'Seen in blends or partial compositions; no standalone clue yet.')}</p>}
            <p>{learned.singleWines} {pt ? 'com uma uva' : 'single-grape'} · {learned.blendWines} {pt ? 'em blends / parciais' : 'in blends / partial'}{learned.styles.length ? ` · ${learned.styles.join(', ')}` : ''}</p>
            <details className="grape-evidence"><summary>{pt ? 'Ver provas do diário' : 'See journal evidence'} ({learned.evidence.length})</summary>
              <p>{pt ? 'Repetições da mesma safra contam uma vez na média. Estilo, região e ocasião também influenciam o gosto.' : 'Repeat tastings of a vintage count once in the average. Style, region and occasion also shape enjoyment.'}</p>
              <ul>{learned.evidence.map(e => <li key={e.id}><div><strong>{e.bottle} · {e.vintage || 'NV'}</strong><span>{e.score === null ? (pt ? 'Sem nota' : 'Unrated') : `${e.score}/100`}</span></div>
                <small>{[e.style, e.region, e.country].filter(Boolean).join(' · ')}</small><small>{e.grapes} · {e.composition === 'single' ? (pt ? 'uma uva registrada' : 'single grape recorded') : (pt ? 'blend / composição parcial' : 'blend / partial composition')}</small>
                {e.comment && <p className="grape-comment">{e.comment}</p>}
              </li>)}</ul>
            </details>
          </div> : <p className="grape-no-evidence">{pt ? 'Sua preferência, mesmo sem provas no diário. O que você conta já ajuda a próxima escolha.' : 'Your say, even without journal evidence. What you tell us already helps the next choice.'}</p>}
          {stated && <div className="grape-personal-note"><label htmlFor={`grape-note-${id}`}>{pt ? 'Do seu jeito' : 'In your own words'} <span>{pt ? '(opcional)' : '(optional)'}</span></label>
            <textarea id={`grape-note-${id}`} rows={2} maxLength={GRAPE_NOTE_LIMIT} value={stated.notes} onChange={e => setPreference(id, stated.preference, e.target.value)} placeholder={pt ? 'Ex.: adoro em tintos leves; prefiro sem madeira…' : 'e.g. Love it in lighter reds; prefer less oak…'} />
            <button type="button" className="text-button" onClick={() => onChange(draft.grape_preferences.filter(p => p.grapeId !== id))}>{pt ? 'Remover minha preferência e nota' : 'Clear my preference & note'}</button>
          </div>}
        </article>;
      })}
    </div>
    {!filtered.length && <p className="palate-empty">{query ? (pt ? 'Nenhuma uva do perfil corresponde à busca. Você pode adicionar uma abaixo.' : 'No profile grapes match. You can add a grape below.') : (pt ? 'Seu perfil começa com as suas provas — ou com uma uva que você escolher abaixo.' : 'Your profile starts with your tastings—or a grape you choose below.')}</p>}
    {filtered.length > 6 && <button className="text-button grape-show-more" type="button" onClick={() => setShowAll(!showAll)}>{showAll ? (pt ? 'Mostrar menos' : 'Show fewer') : `${pt ? 'Ver todas as' : 'Show all'} ${filtered.length} ${pt ? 'uvas' : 'grapes'}`}</button>}
    <details className="grape-add" open={!!query || ids.length === 0}>
      <summary><Plus size={16} aria-hidden="true" />{pt ? 'Mais uma uva para conhecer' : 'Another grape to get to know'}</summary>
      <p>{pt ? 'Adicione como “Quero explorar” e depois escolha seu rótulo e nota. Busque pelo nome ou sinônimo acima.' : 'Add as “Want to explore”, then choose your label and note. Search by name or synonym above.'}</p>
      <div className="grape-suggestions">{suggestions.map(g => <button type="button" disabled={atLimit} key={g.id} onClick={() => explore(g.id)}><Plus size={13} aria-hidden="true" />{g.name}<span>{pt ? 'Explorar' : 'Explore'}</span></button>)}</div>
      {!suggestions.length && <p>{pt ? 'Sem outras uvas listadas para esta busca. Use as notas gerais abaixo para variedades que ainda não estão no catálogo.' : 'No other listed grapes match. Use the general notes below for varieties not yet in the catalogue.'}</p>}
    </details>
    <span className="sr-only" role="status">{notice}</span>
    {!!profile.unmappedGrapeWines && draft.journal_enabled && <p className="grape-method">{profile.unmappedGrapeWines} {pt ? 'vinho(s) têm composição incompleta ou não reconhecida. Corrija o campo de uvas no' : 'wine(s) have incomplete or unrecognised composition. Update their grape field in your'} <Link href="/cellar-journal">{pt ? 'diário' : 'journal'}</Link> {pt ? 'para melhorar o perfil.' : 'to improve your profile.'}</p>}
    <p className="grape-method">{pt ? '“Evitar” exclui vinhos com essa uva registrada, inclusive blends. Salve as alterações no fim da página para usá-las no sommelier e nas sugestões de compra.' : '“Avoid” excludes wines with that grape recorded, including blends. Save at the bottom of this page to use your changes in sommelier and shopping suggestions.'}</p>
  </section>;
}
