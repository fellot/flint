'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, CalendarDays, Camera, Check, Clock3, Compass, Edit3, ExternalLink, GlassWater, LayoutGrid, List, MapPin, MoreHorizontal, Plus, Search, SlidersHorizontal, Sparkles, Trash2, Wine as WineIcon, X } from 'lucide-react';
import type { Wine, WineFilters, WineFormData } from '@/types/wine';
import { getMaturity, selectWines, styleFamily, type Maturity, type WineSort, type WineSortKey } from '@/utils/cellar';
import BottlePortrait from './BottlePortrait';
import CellarTable from './CellarTable';
import CellarDialog from './CellarDialog';
import WineModal from './WineModal';
import AIWineModal from './AIWineModal';
import AIExternalWineModal from './AIExternalWineModal';
import AddWineModal from './AddWineModal';
import AddExternalWineModal from './AddExternalWineModal';
import SommelierWidget from './SommelierWidget';

export interface CellarCollectionProps {
  wines: Wine[];
  mode?: 'cellar' | 'journal';
  locale?: 'en' | 'pt';
  loading?: boolean;
  error?: string;
  onRetry: () => void;
  onAdd: (wine: WineFormData) => Promise<void>;
  onUpdate: (wine: Wine) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onConsume: (wine: Wine, quantity: number, notes: string, location: string) => Promise<void>;
}

const defaultFilters: WineFilters = { search: '', country: 'all', region: 'all', style: 'all', vintage: 'all', status: 'all', coravin: 'all' };
const maturityLabels: Record<'en' | 'pt', Record<Maturity, string>> = {
  en: { ready: 'Ready to enjoy', soon: 'Almost its time', rest: 'Worth the wait', unknown: 'No window set' },
  pt: { ready: 'Pronto para abrir', soon: 'Quase na hora', rest: 'Vale a espera', unknown: 'Sem janela definida' },
};
const statusLabels = { en: { in_cellar: 'In cellar', consumed: 'Enjoyed', sold: 'Sold', gifted: 'Gifted' }, pt: { in_cellar: 'Na adega', consumed: 'Consumido', sold: 'Vendido', gifted: 'Presenteado' } };
const displayName = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

function MaturityLabel({ wine, locale, year }: { wine: Wine; locale: 'en' | 'pt'; year: number }) {
  const maturity = getMaturity(wine, year);
  return <span className={`maturity-label maturity-${maturity}`}><span />{maturityLabels[locale][maturity]}</span>;
}

function WineActions({ wine, locale, onView, onEdit, onDrink, onDelete }: { wine: Wine; locale: 'en' | 'pt'; onView: () => void; onEdit: () => void; onDrink: () => void; onDelete: () => void }) {
  const pt = locale === 'pt';
  return <div className="wine-card-actions">
    <button className="wine-action-primary" disabled={wine.status === 'in_cellar' && wine.quantity < 1} onClick={wine.status === 'in_cellar' ? onDrink : onView}>{wine.status === 'in_cellar' ? <GlassWater size={15} /> : <BookOpen size={15} />}{wine.status === 'in_cellar' ? (pt ? 'Abrir uma garrafa' : 'Open a bottle') : (pt ? 'Ver a história' : 'Revisit this bottle')}<ArrowUpRight size={14} /></button>
    <details className="wine-more"><summary aria-label={`${pt ? 'Opções para' : 'Actions for'} ${wine.bottle}`}><MoreHorizontal size={19} /></summary><div className="wine-more-menu">
      <button onClick={onView}><WineIcon size={14} />{pt ? 'Ver detalhes' : 'View details'}</button>
      <button onClick={onEdit}><Edit3 size={14} />{pt ? 'Editar vinho' : 'Edit wine'}</button>
      {wine.technical_sheet && <a href={wine.technical_sheet} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} />{pt ? 'Ficha técnica' : 'Technical sheet'}</a>}
      <button className="delete-action" onClick={onDelete}><Trash2 size={14} />{pt ? 'Excluir vinho' : 'Delete wine'}</button>
    </div></details>
  </div>;
}

export default function CellarCollection({ wines, mode = 'cellar', locale = 'en', loading = false, error, onRetry, onAdd, onUpdate, onDelete, onConsume }: CellarCollectionProps) {
  const pt = locale === 'pt';
  const journal = mode === 'journal';
  const year = new Date().getFullYear();
  const [filters, setFilters] = useState<WineFilters>({ ...defaultFilters });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [sort, setSort] = useState<WineSort>({ key: 'name', direction: 'asc' });
  const sortColumn = (key: WineSortKey) => setSort(previous => ({ key, direction: previous.key === key && previous.direction === 'asc' ? 'desc' : 'asc' }));
  const [readyOnly, setReadyOnly] = useState(false);
  const [selected, setSelected] = useState<Wine | null>(null);
  const [editing, setEditing] = useState<Wine | null>(null);
  const [drinking, setDrinking] = useState<Wine | null>(null);
  const [adding, setAdding] = useState<'choose' | 'scan' | 'manual' | null>(null);
  const [sommelierOpen, setSommelierOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [destination, setDestination] = useState('Wine Heaven');
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => { if (toast) { const timer = setTimeout(() => setToast(''), 4500); return () => clearTimeout(timer); } }, [toast]);
  useEffect(() => { const url = new URL(window.location.href); if (url.searchParams.has('welcome')) { url.searchParams.delete('welcome'); window.history.replaceState({}, '', url.pathname + url.search + url.hash); } }, []);
  const collection = useMemo(() => wines.filter(wine => journal ? ['consumed', 'sold', 'gifted'].includes(wine.status) : wine.status === 'in_cellar'), [wines, journal]);
  const filtered = useMemo(() => selectWines(collection, filters, readyOnly, sort, year), [collection, filters, readyOnly, sort, year]);
  const ready = collection.filter(wine => getMaturity(wine, year) === 'ready');
  const bottles = collection.reduce((sum, wine) => sum + wine.quantity, 0);
  const countries = Array.from(new Set(collection.map(wine => wine.country).filter(Boolean))).sort();
  const styles = Array.from(new Set(collection.map(wine => wine.style).filter(Boolean))).sort();
  const regions = Array.from(new Set(collection.filter(wine => filters.country === 'all' || wine.country === filters.country).map(wine => wine.region).filter(Boolean))).sort();
  const vintages = Array.from(new Set(collection.map(wine => wine.vintage))).sort((a, b) => b - a);
  const filterCount = Object.entries(filters).filter(([key, value]) => key !== 'search' && value !== 'all').length + Number(readyOnly);
  const featured = [...ready].sort((a, b) => a.vintage - b.vintage)[0] || collection[0];
  const setFilter = (key: keyof WineFilters, value: string) => setFilters(previous => ({ ...previous, [key]: value, ...(key === 'country' ? { region: 'all' } : {}) }));
  const clearFilters = () => { setFilters({ ...defaultFilters }); setReadyOnly(false); };
  const beginDrink = (wine: Wine) => { setSelected(null); setDrinking(wine); setQuantity(1); setNotes(wine.notes); setDestination('Wine Heaven'); setActionError(''); };
  const editWine = (wine: Wine) => { setSelected(null); setEditing(wine); };
  const deleteWine = async (wine: Wine) => {
    if (!confirm(pt ? `Excluir ${wine.bottle} da sua coleção?` : `Delete ${wine.bottle} from your collection?`)) return;
    try { await onDelete(wine.id); setSelected(null); setToast(pt ? 'Vinho excluído.' : 'Wine deleted.'); }
    catch (error) { setActionError(error instanceof Error ? error.message : 'Unable to delete wine.'); }
  };
  const addWine = async (wine: WineFormData) => { await onAdd(wine); setAdding(null); setToast(pt ? 'Uma nova história na sua coleção.' : 'A new story added to your collection.'); };
  const saveWine = async (wine: Wine) => { await onUpdate(wine); setToast(pt ? 'Vinho atualizado.' : 'Wine details updated.'); };
  const consumeWine = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!drinking || pending) return;
    setPending(true); setActionError('');
    try { await onConsume(drinking, quantity, notes, destination); setDrinking(null); setToast(pt ? 'Momento guardado no seu diário.' : 'A moment saved to your cellar journal.'); }
    catch (error) { setActionError(error instanceof Error ? error.message : 'Unable to record this bottle.'); }
    finally { setPending(false); }
  };
  const scrollToCollection = () => { if (ready.length) setReadyOnly(true); document.getElementById('collection')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); };
  const stats = [
    { icon: WineIcon, value: bottles, label: journal ? (pt ? 'Garrafas com história' : 'Bottles with a story') : (pt ? 'Garrafas na adega' : 'Bottles in your cellar'), detail: pt ? 'Cada uma, uma descoberta' : 'A little world of discovery' },
    { icon: journal ? BookOpen : GlassWater, value: journal ? collection.filter(wine => wine.status === 'consumed').reduce((sum, wine) => sum + wine.quantity, 0) : ready.reduce((sum, wine) => sum + wine.quantity, 0), label: journal ? (pt ? 'Garrafas apreciadas' : 'Bottles enjoyed') : (pt ? 'Prontas para abrir' : 'Ready to enjoy'), detail: journal ? (pt ? 'Momentos para recordar' : 'Moments worth remembering') : (pt ? 'Pelas suas janelas de consumo' : 'Based on your drinking windows') },
    { icon: Compass, value: countries.length, label: pt ? 'Países na coleção' : 'Countries to explore', detail: pt ? 'O mundo, em uma taça' : 'The world, one glass at a time' },
    { icon: journal ? CalendarDays : BookOpen, value: collection.length, label: pt ? 'Rótulos diferentes' : 'Different labels', detail: journal ? (pt ? 'Seu diário de descobertas' : 'Your journal of discoveries') : (pt ? 'Uma coleção só sua' : 'A collection that is yours alone') },
  ];

  return <main className={`collection-page ${journal ? 'journal-page' : ''} ${view === 'list' ? 'compact-collection' : ''}`}>
    <section className={`cellar-hero ${journal ? 'journal-hero' : ''}`}>
      <div className="hero-copy"><p className="eyebrow"><span />{journal ? (pt ? 'O DIÁRIO DA SUA ADEGA' : 'THE CELLAR JOURNAL') : (pt ? 'BEM-VINDO À SUA ADEGA' : 'WELCOME TO YOUR CELLAR')}</p>
        <h1>{journal ? (pt ? <>Cada garrafa,<br /><em>uma memória.</em></> : <>Every bottle,<br /><em>a memory.</em></>) : (pt ? <>Um bom vinho.<br /><em>Um grande momento.</em></> : <>A good bottle.<br /><em>A great moment.</em></>)}</h1>
        <p className="hero-description">{journal ? (pt ? 'Os vinhos que você abriu, compartilhou e adorou. Guarde cada descoberta.' : 'The bottles you opened, shared, and loved. A place for every discovery.') : (pt ? 'Seu gosto, suas descobertas, sua coleção. Encontre a garrafa perfeita para o próximo momento.' : 'Your taste. Your discoveries. Your collection. Find just the bottle for whatever comes next.')}</p>
        <div className="hero-actions"><button className="flint-button" onClick={journal ? () => setAdding('choose') : scrollToCollection}>{journal ? (pt ? 'Registrar um vinho' : 'Log a wine') : (pt ? 'Encontre sua próxima taça' : 'Find your next pour')}{journal ? <Plus size={16} /> : <ArrowDown size={16} />}</button>{!journal && <button className="text-button" onClick={() => setSommelierOpen(true)}><Sparkles size={15} />{pt ? 'Uma ajudinha?' : 'A little inspiration?'}</button>}</div>
      </div>
      <div className="hero-photograph"><img src="/images/flint-still-life.png" alt={pt ? 'Uma garrafa e uma taça de vinho ao sol da tarde' : 'A bottle and a glass of red wine in the afternoon light'} fetchPriority="high" width={1536} height={1024} /><div className="photo-caption"><span>{pt ? 'A ARTE DE APRECIAR' : 'THE ART OF TAKING YOUR TIME'}</span><span>flint.</span></div></div>
    </section>

    <section className="cellar-metrics" aria-label={pt ? 'Resumo da coleção' : 'Collection overview'}>{stats.map(({ icon: Icon, value, label, detail }) => <div className="cellar-metric" key={label}><div className="metric-top"><Icon size={18} strokeWidth={1.4} /><span>{label}</span></div><strong>{loading ? '—' : value.toLocaleString(locale)}</strong><p>{detail}</p></div>)}</section>

    <section id="collection" className="wine-collection">
      <div className="collection-heading"><div><p className="eyebrow">{journal ? (pt ? 'MOMENTOS BEM GUARDADOS' : 'MEMORIES, WELL KEPT') : (pt ? 'SEUS VINHOS, BEM GUARDADOS' : 'YOUR BOTTLES, BEAUTIFULLY KEPT')}</p><h2>{journal ? (pt ? 'As histórias até aqui' : 'The stories so far') : (pt ? 'Dentro da sua adega' : 'Inside your cellar')}<span>{loading ? '' : collection.length}</span></h2></div><button className="flint-button" onClick={() => setAdding('choose')}><Plus size={17} />{journal ? (pt ? 'Registrar vinho' : 'Log a wine') : (pt ? 'Adicionar vinho' : 'Add a wine')}</button></div>
      <div className="collection-toolbar"><label className="collection-search"><Search size={18} /><span className="sr-only">{pt ? 'Buscar na coleção' : 'Search your collection'}</span><input type="search" value={filters.search} onChange={event => setFilter('search', event.target.value)} placeholder={pt ? 'Busque um vinho, uva, região…' : 'Find a wine, grape, region…'} /></label><div className="toolbar-controls"><button className={`filter-toggle ${filtersOpen ? 'active' : ''}`} aria-expanded={filtersOpen} aria-controls="wine-filters" onClick={() => setFiltersOpen(!filtersOpen)}><SlidersHorizontal size={16} />{pt ? 'Filtros' : 'Filters'}{filterCount > 0 && <span>{filterCount}</span>}</button>{view === 'grid' && <label className="sort-select"><span className="sr-only">{pt ? 'Ordenar vinhos' : 'Sort wines'}</span><select value={`${sort.key}:${sort.direction}`} onChange={event => { const [key, direction] = event.target.value.split(':'); setSort({ key: key as WineSortKey, direction: direction as 'asc' | 'desc' }); }}>{!['name:asc', 'vintage:desc', 'vintage:asc', 'ready:asc'].includes(`${sort.key}:${sort.direction}`) && <option value={`${sort.key}:${sort.direction}`}>{pt ? 'Ordem da tabela' : 'Table column order'}</option>}<option value="name:asc">{pt ? 'Nome: A–Z' : 'Name: A–Z'}</option><option value="vintage:desc">{pt ? 'Safras recentes' : 'Newest vintage'}</option><option value="vintage:asc">{pt ? 'Safras antigas' : 'Oldest vintage'}</option>{!journal && <option value="ready:asc">{pt ? 'Prontos primeiro' : 'Ready first'}</option>}</select></label>}<div className="view-switch" role="group" aria-label={pt ? 'Visualização' : 'Collection layout'}><button className={view === 'grid' ? 'active' : ''} aria-pressed={view === 'grid'} aria-label={pt ? 'Ver cartões' : 'Grid view'} onClick={() => setView('grid')}><LayoutGrid size={16} /></button><button className={view === 'list' ? 'active' : ''} aria-pressed={view === 'list'} aria-label={pt ? 'Ver lista' : 'List view'} onClick={() => setView('list')}><List size={18} /></button></div></div></div>
      {filtersOpen && <div id="wine-filters" className="expanded-filters">{([
        ['country', pt ? 'País' : 'Country', countries], ['region', pt ? 'Região' : 'Region', regions], ['vintage', pt ? 'Safra' : 'Vintage', vintages.map(String)],
      ] as const).map(([key, label, values]) => <label key={key}>{label}<select value={filters[key]} onChange={event => setFilter(key, event.target.value)}><option value="all">{pt ? 'Todos' : 'All'}</option>{values.map(value => <option key={value} value={value}>{value === '0' ? 'NV' : value}</option>)}</select></label>)}<label>Coravin<select value={filters.coravin} onChange={event => setFilter('coravin', event.target.value)}><option value="all">{pt ? 'Todos' : 'All bottles'}</option><option value="yes">{pt ? 'Com Coravin' : 'With Coravin'}</option><option value="no">{pt ? 'Sem Coravin' : 'Without Coravin'}</option></select></label><button className="text-button" onClick={clearFilters}><X size={14} />{pt ? 'Limpar' : 'Reset'}</button></div>}
      <div className="collection-tabs"><div className="style-tabs"><button className={filters.style === 'all' && !readyOnly && filters.status === 'all' ? 'active' : ''} onClick={() => { setFilter('style', 'all'); setFilter('status', 'all'); setReadyOnly(false); }}>{journal ? (pt ? 'Todas as histórias' : 'All memories') : (pt ? 'Todos os vinhos' : 'All wines')}</button>{journal ? (['consumed', 'gifted', 'sold'] as const).map(status => <button key={status} className={filters.status === status ? 'active' : ''} onClick={() => setFilter('status', status)}>{statusLabels[locale][status]}</button>) : styles.map(style => <button key={style} className={filters.style === style ? 'active' : ''} onClick={() => setFilter('style', style)}><span className={`style-dot dot-${styleFamily(style)}`} />{displayName(style)}</button>)}</div>{!journal && <button className={`ready-filter ${readyOnly ? 'active' : ''}`} aria-pressed={readyOnly} onClick={() => setReadyOnly(!readyOnly)}><Clock3 size={14} />{pt ? 'Prontos para abrir' : 'Ready to enjoy'}{readyOnly && <X size={12} />}</button>}</div>
      {(filters.search || filterCount > 0) && <div className="filter-summary"><span>{filtered.length} {pt ? 'vinhos encontrados' : 'wines found'}</span><button onClick={clearFilters}>{pt ? 'Limpar filtros' : 'Clear filters'}<X size={12} /></button></div>}
      {(error || (actionError && !drinking)) && <div className="flint-alert" role="alert">{error || actionError}<button onClick={error ? onRetry : () => setActionError('')}>{error ? (pt ? 'Tentar novamente' : 'Try again') : (pt ? 'Fechar' : 'Dismiss')}</button></div>}
      {loading ? <div className="wine-grid" aria-label={pt ? 'Carregando vinhos' : 'Loading wines'} aria-busy="true">{[1, 2, 3, 4, 5, 6].map(id => <div className="wine-skeleton" key={id}><div /><span /><span /></div>)}</div> : filtered.length ? view === 'list' ? <CellarTable wines={filtered} locale={locale} journal={journal} sort={sort} onSort={sortColumn} onView={setSelected} onEdit={editWine} onDrink={beginDrink} onDelete={deleteWine} /> : <div className="wine-grid">
        {filtered.map(wine => <article key={wine.id} className="collection-wine-card">
          <div className="wine-image-wrap"><button className="bottle-view-button" aria-label={`${pt ? 'Ver' : 'View'} ${wine.bottle}`} onClick={() => setSelected(wine)}><BottlePortrait wine={wine} /></button><span className={`wine-style-badge badge-${styleFamily(wine.style)}`}><span />{displayName(wine.style)}</span>{wine.coravin && <span className="coravin-badge">Coravin</span>}<button className="wine-expand" aria-label={`${pt ? 'Detalhes de' : 'Details for'} ${wine.bottle}`} onClick={() => setSelected(wine)}><ArrowUpRight size={17} /></button></div>
          <div className="wine-card-body"><p className="wine-origin">{wine.country}{wine.region && <><span> / </span>{wine.region}</>}</p><h3><button onClick={() => setSelected(wine)}>{wine.bottle}</button></h3><div className="wine-facts"><span>{wine.vintage || 'NV'}</span><span>{wine.quantity} {wine.quantity === 1 ? (pt ? 'garrafa' : 'bottle') : (pt ? 'garrafas' : 'bottles')}</span>{wine.rating != null && wine.rating > 0 && <span className="wine-rating">{wine.rating}<small>/100</small></span>}</div><div className="wine-window">{journal ? <span className={`history-label history-${wine.status}`}><BookOpen size={12} />{statusLabels[locale][wine.status]}{wine.consumedDate && <> · {new Intl.DateTimeFormat(pt ? 'pt-BR' : 'en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(wine.consumedDate))}</>}</span> : <MaturityLabel wine={wine} locale={locale} year={year} />}{wine.location && !journal && <span className="wine-location"><MapPin size={11} />{wine.location}</span>}</div>
          {journal && wine.notes && <p className="journal-card-note">“{wine.notes}”</p>}
          <WineActions wine={wine} locale={locale} onView={() => setSelected(wine)} onEdit={() => editWine(wine)} onDrink={() => beginDrink(wine)} onDelete={() => deleteWine(wine)} />
          </div></article>)}
      </div> : !error && <div className="collection-empty"><WineIcon size={35} strokeWidth={1} /><h3>{collection.length ? (pt ? 'Ainda não encontramos essa garrafa.' : 'That bottle is playing hide-and-seek.') : (pt ? 'Toda coleção começa com uma história.' : 'Every collection starts with a story.')}</h3><p>{collection.length ? (pt ? 'Tente outra busca ou limpe os filtros.' : 'Try another search or give your filters a fresh start.') : (pt ? 'Adicione seu primeiro vinho e comece a explorar.' : 'Add your first wine and make yourself at home.')}</p><button className="flint-button" onClick={collection.length ? clearFilters : () => setAdding('choose')}>{collection.length ? (pt ? 'Limpar filtros' : 'Clear filters') : (pt ? 'Adicionar vinho' : 'Add a wine')}<Plus size={15} /></button></div>}
      {!loading && filtered.length > 0 && <p className="collection-results">{pt ? `${filtered.length} rótulos · ${filtered.reduce((sum, wine) => sum + wine.quantity, 0)} garrafas` : `${filtered.length} labels · ${filtered.reduce((sum, wine) => sum + wine.quantity, 0)} bottles`}</p>}
    </section>

    {!journal && <section className="cellar-discovery"><div className="sommelier-teaser"><div className="teaser-icon"><Sparkles size={22} strokeWidth={1.2} /></div><div><p className="eyebrow">{pt ? 'SEU SOMMELIER PESSOAL' : 'YOUR SOMMELIER, ON CALL'}</p><h2>{pt ? 'O que vai bem com hoje?' : 'What pairs with today?'}</h2><p>{pt ? 'Um jantar, uma celebração ou uma terça-feira. Vamos encontrar a garrafa.' : 'A dinner, a celebration, or just a Tuesday. Let’s find your bottle.'}</p></div><button className="flint-button" onClick={() => setSommelierOpen(true)}>{pt ? 'Vamos conversar' : 'Let’s talk wine'}<ArrowUpRight size={16} /></button></div>{featured && <button className="next-bottle" onClick={() => setSelected(featured)}><BottlePortrait wine={featured} /><span><span className="eyebrow">{pt ? 'NO SEU RADAR' : 'ON YOUR RADAR'}</span><strong>{featured.bottle}</strong><span>{featured.vintage || 'NV'} · {featured.country}</span><MaturityLabel wine={featured} locale={locale} year={year} /></span><ArrowUpRight size={19} /></button>}</section>}

    {selected && <CellarDialog title={selected.bottle} onClose={() => setSelected(null)} wide><div className="wine-detail"><BottlePortrait wine={selected} /><div className="wine-detail-content"><p className="eyebrow">{selected.country} / {selected.region}</p><h2>{selected.bottle}</h2><span className="detail-style">{selected.vintage || 'NV'} · {selected.style} · {statusLabels[locale][selected.status]}</span><dl>{[
      [pt ? 'Uvas' : 'Grapes', selected.grapes], [pt ? 'Localização' : 'Location', selected.location], [pt ? 'Garrafas' : 'Bottles', selected.quantity], [pt ? 'Janela de consumo' : 'Drinking window', selected.drinkingWindow], [pt ? 'Apogeu' : 'Peak', selected.peakYear], [pt ? 'Avaliação' : 'Rating', selected.rating != null ? `${selected.rating}/100` : null], [pt ? 'Preço' : 'Price', selected.price], ['Coravin', selected.coravin ? selected.coravinDate || (pt ? 'Sim' : 'Yes') : null], [pt ? 'Consumido em' : 'Enjoyed on', selected.consumedDate],
    ].filter(([, value]) => value !== null && value !== undefined && value !== '').map(([label, value]) => <div key={String(label)}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>{selected.foodPairingNotes && <section className="detail-note"><h3>{pt ? 'À mesa' : 'At the table'}</h3><p>{selected.foodPairingNotes}</p></section>}{selected.mealToHaveWithThisWine && <section className="detail-note"><h3>{pt ? 'Uma ideia para o jantar' : 'A dinner idea'}</h3><p>{selected.mealToHaveWithThisWine}</p></section>}{selected.notes && <section className="detail-note"><h3>{pt ? 'Suas notas' : 'Your notes'}</h3><p>{selected.notes}</p></section>}{selected.technical_sheet && <a href={selected.technical_sheet} target="_blank" rel="noopener noreferrer" className="text-button">{pt ? 'Ficha técnica' : 'Technical sheet'}<ExternalLink size={14} /></a>}<div className="detail-actions"><button className="flint-button" onClick={() => editWine(selected)}><Edit3 size={15} />{pt ? 'Editar vinho' : 'Edit wine'}</button>{selected.status === 'in_cellar' && selected.quantity > 0 && <button className="flint-button secondary" onClick={() => beginDrink(selected)}><GlassWater size={15} />{pt ? 'Abrir uma garrafa' : 'Open a bottle'}</button>}</div></div></div></CellarDialog>}
    {drinking && <CellarDialog title={pt ? 'Abra uma garrafa' : 'Make a little moment'} pending={pending} onClose={() => setDrinking(null)}><p className="eyebrow">{pt ? 'UMA HISTÓRIA PARA GUARDAR' : 'A STORY WORTH KEEPING'}</p><h2>{pt ? 'Abra um bom momento.' : 'Make a little moment.'}</h2><p className="dialog-description">{drinking.bottle} · {drinking.vintage || 'NV'}</p><form onSubmit={consumeWine} className="drink-form"><label>{pt ? 'Quantas garrafas?' : 'How many bottles?'}<input type="number" required min={1} max={drinking.quantity} value={quantity} onChange={event => setQuantity(Number(event.target.value))} /> <small>{drinking.quantity} {pt ? 'disponíveis na sua adega' : 'available in your cellar'}</small></label><label>{pt ? 'Como foi?' : 'How was it?'}<select value={destination} onChange={event => setDestination(event.target.value)}><option value="Wine Heaven">{pt ? 'Adorei — Wine Heaven' : 'Loved it — Wine Heaven'}</option><option value="Wine Hell">{pt ? 'Não foi para mim — Wine Hell' : 'Not for me — Wine Hell'}</option></select></label><label>{pt ? 'Uma nota para lembrar' : 'A note to remember'}<textarea value={notes} onChange={event => setNotes(event.target.value)} rows={4} placeholder={pt ? 'O sabor, a companhia, a ocasião…' : 'The flavor, the company, the occasion…'} /></label>{actionError && <p className="flint-alert" role="alert">{actionError}</p>}<button className="flint-button" type="submit" disabled={pending}>{pending ? (pt ? 'Guardando…' : 'Saving your moment…') : (pt ? 'Guardar no diário' : 'Save to my journal')}<ArrowRight size={16} /></button></form></CellarDialog>}
    {adding === 'choose' && <CellarDialog title={pt ? 'Adicione uma nova história' : 'Add a new story'} onClose={() => setAdding(null)}><p className="eyebrow">{pt ? 'ESPAÇO PARA UMA DESCOBERTA' : 'ROOM FOR A NEW DISCOVERY'}</p><h2>{pt ? 'Um vinho para sua coleção.' : 'A bottle for your collection.'}</h2><p className="dialog-description">{journal ? (pt ? 'Registre um vinho que você apreciou fora da adega.' : 'Remember a wine you enjoyed beyond your cellar.') : (pt ? 'Como você gostaria de adicionar seu vinho?' : 'How would you like to add your wine?')}</p><div className="add-options"><button onClick={() => setAdding('scan')}><Camera size={25} /><strong>{pt ? 'Fotografe o rótulo' : 'Scan a label'}</strong><span>{pt ? 'Deixe a IA preencher os detalhes.' : 'Let AI take care of the details.'}</span><ArrowUpRight size={17} /></button><button onClick={() => setAdding('manual')}><Edit3 size={24} /><strong>{pt ? 'Adicione à mão' : 'Add it yourself'}</strong><span>{pt ? 'Preencha os detalhes do seu vinho.' : 'Enter the details of your bottle.'}</span><ArrowUpRight size={17} /></button></div></CellarDialog>}
    {editing && <WineModal wine={editing} isOpen onClose={() => setEditing(null)} onSave={saveWine} mode="edit" locale={locale} />}
    {!journal && adding === 'scan' && <AIWineModal isOpen onClose={() => setAdding(null)} onAddWine={addWine} locale={locale} />}
    {journal && adding === 'scan' && <AIExternalWineModal isOpen onClose={() => setAdding(null)} onAddWine={addWine} locale={locale} />}
    {!journal && adding === 'manual' && <AddWineModal isOpen onClose={() => setAdding(null)} onAddWine={addWine} />}
    {journal && adding === 'manual' && <AddExternalWineModal isOpen onClose={() => setAdding(null)} onAddWine={addWine} />}
    <SommelierWidget isOpen={sommelierOpen} onClose={() => setSommelierOpen(false)} wines={wines.filter(wine => wine.status === 'in_cellar')} locale={locale} />
    {toast && <div className="flint-toast" role="status"><Check size={17} />{toast}<button onClick={() => setToast('')} aria-label="Dismiss notification"><X size={15} /></button></div>}
  </main>;
}
