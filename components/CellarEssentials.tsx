'use client';

import { useMemo, useState } from 'react';
import { ArrowUpRight, Check, ChevronDown, Search, Sparkles, Star, Wine as WineIcon, X } from 'lucide-react';
import { CELLAR_ESSENTIALS, type GuideCategory, type GuideTier, type LocalizedText } from '@/data/cellar-essentials';
import { getEssentialMatches } from '@/lib/cellar-essentials';
import type { Wine } from '@/types/wine';
import './cellar-essentials.css';

const CATEGORIES: { id: GuideCategory; name: LocalizedText; subtitle: LocalizedText }[] = [
  { id: 'red', name: { en: 'Red wines', pt: 'Tintos' }, subtitle: { en: 'From quiet elegance to a little fire.', pt: 'Da elegância delicada à intensidade.' } },
  { id: 'white', name: { en: 'White wines', pt: 'Brancos' }, subtitle: { en: 'Freshness, texture, and everything between.', pt: 'Frescor, textura e tudo entre eles.' } },
  { id: 'sparkling', name: { en: 'Sparkling wines', pt: 'Espumantes' }, subtitle: { en: 'For an occasion. Or for making one.', pt: 'Para uma ocasião. Ou para criar uma.' } },
  { id: 'rose', name: { en: 'Rosé wines', pt: 'Rosés' }, subtitle: { en: 'A place at the table, all year round.', pt: 'Um lugar à mesa, o ano inteiro.' } },
  { id: 'fortified', name: { en: 'Dry fortified wines', pt: 'Fortificados secos' }, subtitle: { en: 'A small pour. A different world.', pt: 'Uma pequena taça. Um outro mundo.' } },
  { id: 'sweet', name: { en: 'Sweet wines', pt: 'Vinhos doces' }, subtitle: { en: 'An optional chapter, entirely to your taste.', pt: 'Um capítulo opcional, ao seu gosto.' } },
];

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

interface Props {
  wines: Wine[];
  locale?: 'en' | 'pt';
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

export default function CellarEssentials({ wines, locale = 'en', loading = false, error = false, onRetry }: Props) {
  const pt = locale === 'pt';
  const [category, setCategory] = useState<GuideCategory | 'all'>('all');
  const [tier, setTier] = useState<GuideTier | 'all'>('all');
  const [search, setSearch] = useState('');
  const [inCellar, setInCellar] = useState(false);
  const matches = useMemo(() => new Map(CELLAR_ESSENTIALS.map(entry => [entry.id, getEssentialMatches(entry.id, wines)])), [wines]);
  const represented = Array.from(matches.values()).filter(items => items.length > 0).length;
  const inventoryAvailable = !loading && !error;
  const query = normalize(search.trim());
  const filtered = CELLAR_ESSENTIALS.filter(entry =>
    (tier === 'all' || entry.tier === tier) &&
    (!inCellar || !inventoryAvailable || !!matches.get(entry.id)?.length) &&
    (!query || normalize([entry.name.en, entry.name.pt, entry.region.en, entry.region.pt, entry.grapes.en, entry.grapes.pt, entry.character[locale], entry.role[locale]].join(' ')).includes(query))
  );
  const visible = filtered.filter(entry => category === 'all' || entry.category === category);
  const hasFilters = category !== 'all' || tier !== 'all' || search !== '' || inCellar;
  const resetFilters = () => { setCategory('all'); setTier('all'); setSearch(''); setInCellar(false); };
  const tierLabel = (value: GuideTier) => value === 'foundation' ? (pt ? 'Fundamental' : 'Foundation') : value === 'discovery' ? (pt ? 'Descoberta' : 'Discovery') : (pt ? 'Clássico' : 'Classic');

  return <main className="flint-subpage essentials-page">
    <header className="essentials-masthead">
      <div>
        <p className="eyebrow"><span />{pt ? 'O GUIA DA ADEGA · FLINT' : 'THE CELLAR FIELD GUIDE · FLINT'}</p>
        <h1>{pt ? 'Uma adega bem escolhida.' : 'The shape of a good cellar.'}</h1>
        <p className="essentials-deck">{pt ? 'Regiões clássicas, uvas emblemáticas e algumas boas surpresas. Um guia para descobrir o que merece um lugar na sua adega.' : 'Classic regions, signature grapes, and a few good surprises. Find the styles worth making room for.'}</p>
      </div>
      <aside className="essentials-margin-note">
        <span aria-hidden="true">✳</span>
        <p>{pt ? 'Uma garrafa para cada vontade.' : 'A bottle for every mood.'}</p>
        <small>{pt ? 'Frescor. Textura. Perfume. Maturidade. Descoberta.' : 'Freshness. Texture. Perfume. Maturity. Discovery.'}</small>
      </aside>
    </header>

    <div className="essentials-intro-line">
      <p><strong>{CELLAR_ESSENTIALS.length}</strong> {pt ? 'estilos para conhecer' : 'styles to know'}<span aria-hidden="true">/</span><strong>{CATEGORIES.length}</strong> {pt ? 'famílias de vinho' : 'wine families'}</p>
      <span className="essentials-coverage" role="status">{loading ? (pt ? 'Consultando sua adega…' : 'Checking your cellar…') : error ? (pt ? 'Guia disponível · adega indisponível' : 'Guide available · cellar unavailable') : <><Check size={14} /><strong>{represented}</strong> {pt ? 'com vinhos na sua adega' : 'represented in your cellar'}</>}</span>
    </div>

    <section className="essentials-controls" aria-label={pt ? 'Explorar o guia' : 'Browse the guide'}>
      <div className="essentials-search-row">
        <label className="essentials-search"><Search size={18} /><span className="sr-only">{pt ? 'Buscar estilos, uvas ou regiões' : 'Search styles, grapes or regions'}</span><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder={pt ? 'Uma uva, uma região, algo novo…' : 'A grape, a place, something new…'} />{search && <button type="button" onClick={() => setSearch('')} aria-label={pt ? 'Limpar busca' : 'Clear search'}><X size={16} /></button>}</label>
        <div className="essentials-tier-switch" role="group" aria-label={pt ? 'Tipo de seleção' : 'Selection'}>
          {(['all', 'foundation', 'discovery'] as const).map(value => <button key={value} type="button" aria-pressed={tier === value} onClick={() => setTier(value)}>{value === 'foundation' ? <Star size={13} /> : value === 'discovery' ? <Sparkles size={13} /> : null}{value === 'all' ? (pt ? 'Todos os estilos' : 'All styles') : value === 'foundation' ? (pt ? 'Fundamentais' : 'Foundations') : (pt ? 'Descobertas' : 'Adventurous')}</button>)}
        </div>
      </div>
      <div className="essentials-category-row">
        <div className="essentials-categories" role="group" aria-label={pt ? 'Tipo de vinho' : 'Wine type'}>
          <button type="button" aria-pressed={category === 'all'} onClick={() => setCategory('all')}>{pt ? 'Todos' : 'All wines'}<span>{filtered.length}</span></button>
          {CATEGORIES.map(item => <button type="button" key={item.id} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}><i className={`essentials-dot essential-${item.id}`} aria-hidden="true" />{item.name[locale]}<span>{filtered.filter(entry => entry.category === item.id).length}</span></button>)}
        </div>
      </div>
      <div className="essentials-filter-summary">
        <p aria-live="polite">{visible.length} {pt ? 'estilos' : 'styles'}<span> · </span>{pt ? 'Abra um estilo para conhecer melhor.' : 'Open a style to get to know it.'}</p>
        <div>
          <label className="essentials-stock-filter"><input type="checkbox" checked={inCellar} disabled={!inventoryAvailable} onChange={event => setInCellar(event.target.checked)} />{pt ? 'Na minha adega' : 'In my cellar'}</label>
          {hasFilters && <button type="button" onClick={resetFilters}>{pt ? 'Limpar filtros' : 'Reset filters'}</button>}
        </div>
      </div>
    </section>

    {error && <div className="essentials-error" role="alert"><p>{pt ? 'Você pode explorar o guia. Não foi possível consultar seus vinhos agora.' : 'You can still explore the guide. We couldn’t check your wines right now.'}</p>{onRetry && <button type="button" onClick={onRetry}>{pt ? 'Tentar novamente' : 'Try again'}</button>}</div>}

    <div className="essentials-directory">
      {CATEGORIES.map((group, index) => {
        const entries = visible.filter(entry => entry.category === group.id);
        if (!entries.length) return null;
        return <section key={group.id} className={`essentials-chapter essential-${group.id}`} aria-labelledby={`chapter-${group.id}`}>
          <header className="essentials-chapter-heading"><span className="essentials-chapter-number">{String(index + 1).padStart(2, '0')}</span><div><h2 id={`chapter-${group.id}`}>{group.name[locale]}</h2><p>{group.subtitle[locale]}</p></div><span className="essentials-chapter-count">{entries.length}</span></header>
          {group.id === 'sparkling' && <p className="essentials-category-note">{pt ? 'Prefere seco? Procure Brut, Extra Brut ou Brut Nature. “Extra Dry” é mais doce que Brut.' : 'Prefer dry? Look for Brut, Extra Brut or Brut Nature. “Extra Dry” is sweeter than Brut.'} <a href="https://www.champagne.fr/en/about-champagne/how-champagne-is-made/dosage" target="_blank" rel="noopener noreferrer">{pt ? 'Entenda o rótulo' : 'Read the label'}<ArrowUpRight size={12} /></a></p>}
          {group.id === 'sweet' && <p className="essentials-category-note">{pt ? 'Não gostar de vinhos meio doces não significa rejeitar vinhos de sobremesa. Este capítulo é opcional: deixe seu paladar decidir.' : 'Disliking semi-sweet wine does not rule out dessert wines. This chapter is optional: let your enjoyment decide.'}</p>}
          {entries.map(entry => {
            const bottles = matches.get(entry.id) || [];
            return <details className="essential-entry" key={entry.id}>
              <summary>
                <div className="essential-identity"><span className={`essential-tier tier-${entry.tier}`}>{entry.tier === 'foundation' ? <Star size={10} /> : entry.tier === 'discovery' ? <Sparkles size={10} /> : null}{tierLabel(entry.tier)}</span><h3>{entry.name[locale]}</h3><p>{entry.region[locale]}</p></div>
                <p className="essential-character">{entry.character[locale]}</p>
                <div className="essential-entry-end">{inventoryAvailable && bottles.length > 0 && <span className="essential-match"><Check size={12} />{pt ? 'Na adega' : 'In cellar'}</span>}<ChevronDown className="essential-expand" size={19} /></div>
              </summary>
              <div className="essential-detail">
                <div className="essential-detail-copy"><p className="eyebrow">{pt ? 'POR QUE TER NA ADEGA' : 'WHY MAKE ROOM FOR IT'}</p><p>{entry.role[locale]}</p><dl><dt>{pt ? 'Uvas' : 'Grapes'}</dt><dd>{entry.grapes[locale]}</dd></dl>{entry.source && <a className="essential-source" href={entry.source.url} target="_blank" rel="noopener noreferrer">{entry.source.label}<ArrowUpRight size={14} /><span className="sr-only">{pt ? '(abre em nova aba)' : '(opens in a new tab)'}</span></a>}</div>
                <div className="essential-your-cellar"><p className="eyebrow"><WineIcon size={13} />{pt ? 'NA SUA ADEGA' : 'IN YOUR CELLAR'}</p>{!inventoryAvailable ? <p>{loading ? (pt ? 'Consultando suas garrafas…' : 'Checking your bottles…') : (pt ? 'Seus vinhos estão indisponíveis no momento.' : 'Your wines are unavailable right now.')}</p> : bottles.length ? <ul>{bottles.map(wine => <li key={wine.id}><strong>{wine.bottle}</strong><span>{wine.vintage || (pt ? 'Sem safra' : 'Non-vintage')} · {wine.quantity} {pt ? (wine.quantity === 1 ? 'garrafa' : 'garrafas') : (wine.quantity === 1 ? 'bottle' : 'bottles')}{wine.location ? ` · ${wine.location}` : ''}</span></li>)}</ul> : <><p>{pt ? 'Nenhuma correspondência clara.' : 'No clear match yet.'}</p><small>{pt ? 'Se você já tem este estilo, confira a região, as uvas e o tipo no cadastro do vinho.' : 'Already have this style? Check the region, grapes and style saved on the bottle.'}</small></>}</div>
              </div>
            </details>;
          })}
        </section>;
      })}
      {!visible.length && <div className="essentials-empty"><Search size={25} /><h2>{pt ? 'Há mais para descobrir.' : 'There’s more to discover.'}</h2><p>{pt ? 'Nenhum estilo corresponde a esses filtros. Experimente outra uva ou amplie sua seleção.' : 'No styles match these filters. Try another grape or broaden your selection.'}</p><button className="flint-button secondary" type="button" onClick={resetFilters}>{pt ? 'Ver todos os estilos' : 'Show all styles'}</button></div>}
    </div>

    <footer className="essentials-closing"><Star size={18} strokeWidth={1.3} /><div><h2>{pt ? 'Colecione com intenção.' : 'Collect with a little intention.'}</h2><p>{pt ? 'Os fundamentais são pontos de partida, não obrigações. Produtor e safra fazem diferença. Para um estilo que você adora, experimente ter uma garrafa pronta para abrir e outra para acompanhar com o tempo.' : 'Foundations are starting points, not obligations. Producer and vintage matter. For a style you love, keep one bottle ready to open and another to follow as it ages.'}</p><small>{pt ? 'As correspondências usam os dados das garrafas em estoque. Cadastros incompletos podem não aparecer. Este guia não avalia seu gosto pessoal nem o ponto de maturidade de cada vinho.' : 'Matches use the details of bottles currently in stock; incomplete records may not appear. This guide does not assess your personal taste or each bottle’s maturity.'}</small></div></footer>
  </main>;
}
