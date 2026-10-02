'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check, Compass, Heart, Sparkles } from 'lucide-react';
import { useCellar } from '@/components/CellarSession';
import GrapePalate from '@/components/GrapePalate';
import { DEFAULT_PALATE } from '@/lib/palate';
import type { PalatePreferences, PalateProfile } from '@/types/palate';
import type { Cellar } from '@/types/database';
import './palate.css';

export default function MyPalate() {
  const { cellar, isPortugueseMode: pt } = useCellar();
  return <PalatePage key={cellar.id} cellar={cellar} pt={pt} />;
}

function PalatePage({ cellar, pt }: { cellar: Cellar; pt: boolean }) {
  const [profile, setProfile] = useState<PalateProfile | null>(null);
  const [draft, setDraft] = useState<PalatePreferences>(DEFAULT_PALATE);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const requests = useRef<AbortController | null>(null);
  const endpoint = `/api/palate?cellarId=${encodeURIComponent(cellar.id)}`;
  useEffect(() => {
    const controller = new AbortController();
    requests.current = controller;
    setProfile(null); setError('');
    fetch(endpoint, { cache: 'no-store', signal: controller.signal }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setProfile(result); setDraft(result.preferences);
    }).catch(e => { if (e.name !== 'AbortError') setError(e.message); });
    return () => controller.abort();
  }, [endpoint]);
  const change = (values: Partial<PalatePreferences>) => { setDraft(current => ({ ...current, ...values })); setSaved(false); };
  const dirty = profile && JSON.stringify(draft) !== JSON.stringify(profile.preferences);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  async function save(event: React.FormEvent) {
    event.preventDefault(); setPending(true); setError(''); setSaved(false);
    const signal = requests.current?.signal;
    try {
      const response = await fetch(endpoint, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft), signal });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (signal?.aborted) return;
      setProfile(result); setDraft(result.preferences); setSaved(true);
    } catch (e) { if (!signal?.aborted) setError(e instanceof Error ? e.message : 'Unable to save your preferences.'); }
    finally { if (!signal?.aborted) setPending(false); }
  }
  return <main className="flint-subpage palate-page">
    <header className="subpage-heading">
      <p className="eyebrow">{pt ? 'SEU GOSTO, EM EVOLUÇÃO' : 'A TASTE OF WHO YOU ARE'}</p>
      <h1>{pt ? 'Meu paladar.' : 'My palate.'}</h1>
      <p>{pt ? 'As garrafas mudam. Seu gosto também. Ajude seu sommelier a acompanhar.' : 'Bottles change. So does your taste. Let your sommelier get to know you.'}</p>
      <Link className="text-button" href="/sommelier">{pt ? 'Conversar com o sommelier' : 'Put your palate to work'} <ArrowUpRight size={16} /></Link>
    </header>
    {error && <p className="flint-alert" role="alert">{error}</p>}
    {!profile ? <p role="status">{error ? (pt ? 'Atualize a página após resolver o problema.' : 'Reload this page after resolving the issue.') : (pt ? 'Conhecendo seu diário…' : 'Getting to know your journal…')}</p> : <form onSubmit={save}>
      <fieldset disabled={pending} className="palate-fieldset">
        <GrapePalate key={cellar.id} profile={profile} draft={draft} onChange={grape_preferences => change({ grape_preferences })} pt={pt} cellarName={cellar.name} />
        <div className="palate-columns">
          <section className="palate-preferences" aria-labelledby="palate-explicit">
            <p className="eyebrow">02 / {pt ? 'O QUE VOCÊ NOS CONTA' : 'YOU TOLD US'}</p>
            <h2 id="palate-explicit">{pt ? 'O que faz a sua taça?' : 'What makes your glass?'}</h2>
            <p className="palate-muted">{pt ? 'Estas preferências são suas e valem em todas as suas adegas.' : 'These preferences belong to you and follow you across your cellars.'}</p>
            <fieldset className="palate-discovery">
              <legend>{pt ? 'Quanta aventura?' : 'How far shall we wander?'}</legend>
              {([
                ['familiar', Heart, pt ? 'Meus favoritos' : 'Familiar favourites', pt ? 'Estilos que já aprecio.' : 'Stay close to styles I enjoy.'],
                ['balanced', Sparkles, pt ? 'Um pouco dos dois' : 'A little of both', pt ? 'Conforto com uma novidade.' : 'A favourite, with a fresh possibility.'],
                ['adventurous', Compass, pt ? 'Surpreenda-me' : 'Take me somewhere new', pt ? 'Abra espaço para o desconhecido.' : 'Make room for unfamiliar styles.'],
              ] as const).map(([value, Icon, title, description]) => <label className={`palate-choice ${draft.discovery === value ? 'selected' : ''}`} key={value}>
                <input type="radio" name="discovery" value={value} checked={draft.discovery === value} onChange={() => change({ discovery: value })} />
                <Icon size={20} /><span><strong>{title}</strong><small>{description}</small></span>
              </label>)}
            </fieldset>
            <label className="palate-toggle"><input type="checkbox" checked={draft.avoid_semi_sweet} onChange={e => change({ avoid_semi_sweet: e.target.checked })} /><span><strong>{pt ? 'Evitar vinhos meio doces' : 'Avoid semi-sweet wines'}</strong><small>{pt ? 'Vinhos de sobremesa continuam sendo uma opção. Doçura desconhecida deve ser informada.' : 'Fully sweet dessert wines remain an option. Unknown sweetness should be called out.'}</small></span></label>
            <label className="palate-notes">{pt ? 'O que mais devo saber?' : 'Anything else I should know?'}
              <textarea rows={5} maxLength={2000} value={draft.preferences} onChange={e => change({ preferences: e.target.value })} placeholder={pt ? 'Sabores favoritos, coisas a evitar, restrições alimentares…' : 'Flavours you love, things to avoid, dietary preferences…'} />
              <small>{pt ? 'Seu pedido de hoje também orienta a escolha. Conversas não alteram este perfil automaticamente.' : 'Tonight’s request also guides the choice. Chat messages never change this profile automatically.'}</small>
            </label>
          </section>
          <section className="palate-learning" aria-labelledby="palate-learned">
            <p className="eyebrow">03 / {pt ? 'O QUE SEU DIÁRIO CONTA' : 'YOUR JOURNAL TELLS US'}</p>
            <h2 id="palate-learned">{pt ? 'Um gosto tomando forma.' : 'A taste taking shape.'}</h2>
            <p className="palate-muted">{pt ? 'Somente suas avaliações em' : 'Only your own tastings in'} <strong>{cellar.name}</strong>. {pt ? 'Novas avaliações e edições atualizam estas pistas.' : 'New reviews and edits refresh these clues.'}</p>
            <div className="palate-stats"><span><strong>{profile.scoredCount}</strong>{pt ? 'notas pessoais' : 'personal scores'}</span><span><strong>{profile.average ?? '—'}</strong>{pt ? 'média por vinho / 100' : 'average per wine / 100'}</span></div>
            <label className="palate-toggle"><input type="checkbox" checked={draft.journal_enabled} onChange={e => change({ journal_enabled: e.target.checked })} /><span><strong>{pt ? 'Aprender com meu diário' : 'Learn from my journal'}</strong><small>{pt ? 'Compartilha suas notas e comentários com o sommelier ao pedir sugestões.' : 'Uses your scores and comments as AI context when you ask for suggestions.'}</small></span></label>
            {!draft.journal_enabled && <p className="palate-empty">{pt ? 'Com esta opção desativada e salva, suas preferências explícitas continuam valendo, mas o diário não é enviado ao sommelier.' : 'With this setting saved off, your stated preferences still apply, but journal evidence is not sent to the sommelier.'}</p>}
            {draft.journal_enabled && <>
              <p className="palate-muted">{pt ? 'Pistas acima da sua média pessoal. Uma prova não define um estilo; repetir a mesma safra não aumenta a confiança.' : 'Clues above your personal average. One tasting doesn’t define a style; repeating a vintage doesn’t increase confidence.'}</p>
              {!profile.patterns.filter(p => !draft.dismissed_patterns.includes(p.id)).length && <p className="palate-empty">{pt ? 'Ainda sem padrões para mostrar. Cada avaliação ajuda, sem pressa para tirar conclusões.' : 'No patterns to show yet. Every tasting helps; there’s no rush to draw conclusions.'}</p>}
              {profile.patterns.filter(p => !draft.dismissed_patterns.includes(p.id)).map(pattern => <article className="palate-pattern" key={pattern.id}>
                <div className="palate-pattern-heading"><h3>{pattern.name[pt ? 'pt' : 'en']}</h3><strong>{pattern.average}<small>/100</small></strong></div>
                <p className="palate-confidence">{pattern.confidence === 'early' ? (pt ? 'Primeira pista · 1 vinho' : 'An early clue · 1 wine') : `${pattern.confidence === 'established' ? (pt ? 'Padrão recorrente' : 'Repeated pattern') : (pt ? 'Padrão inicial' : 'Emerging pattern')} · ${pattern.distinctWines} ${pt ? 'vinhos diferentes' : 'distinct wines'}`}</p>
                <details><summary>{pt ? 'Ver as avaliações' : 'See the evidence'}</summary><ul>{pattern.evidence.map(e => <li key={e.id}><span>{e.bottle} · {e.vintage || 'NV'}</span><strong>{e.score}/100</strong></li>)}</ul></details>
                <button className="text-button" type="button" onClick={() => change({ dismissed_patterns: [...draft.dismissed_patterns, pattern.id] })}>{pt ? 'Não use este padrão' : 'Don’t use this pattern'}</button>
              </article>)}
              {profile.excludedCount > 0 && <p className="palate-muted">{profile.excludedCount} {pt ? 'avaliação(ões) marcada(s) como jovem demais ou com defeito foram excluídas das pistas.' : 'tasting(s) marked too young to judge or faulty are excluded from these clues.'}</p>}
            </>}
            {draft.dismissed_patterns.length > 0 && <button type="button" className="text-button" onClick={() => change({ dismissed_patterns: [] })}>{pt ? 'Restaurar padrões descartados' : 'Restore dismissed patterns'} ({draft.dismissed_patterns.length})</button>}
            <Link href="/cellar-journal" className="palate-journal-link">{pt ? 'Voltar ao meu diário' : 'Back to my journal'} <ArrowUpRight size={15} /></Link>
          </section>
        </div>
        <div className="palate-save"><button className="flint-button" disabled={pending || !dirty}>{pending ? (pt ? 'Salvando…' : 'Saving…') : (pt ? 'Salvar meu paladar' : 'Save my palate')}</button><button className="text-button" type="button" onClick={() => change({ ...DEFAULT_PALATE, dismissed_patterns: [] })}>{pt ? 'Redefinir preferências' : 'Reset preferences'}</button><span role="status">{saved ? <><Check size={16} />{pt ? 'Salvo. Seu próximo pedido já usará este perfil.' : 'Saved. Your next request will use this profile.'}</> : dirty ? (pt ? 'Há alterações para salvar.' : 'You have changes to save.') : ''}</span></div>
      </fieldset>
    </form>}
  </main>;
}
