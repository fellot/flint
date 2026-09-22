'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, CalendarDays, Camera, Check, Clock3, Compass, Edit3, ExternalLink, GlassWater, LayoutGrid, List, MapPin, MoreHorizontal, Plus, Search, SlidersHorizontal, Sparkles, Trash2, Wine as WineIcon, Users, X } from 'lucide-react';
import type { Person, TastingInput, CellarStorage, FridgeInput } from '@/types/database';
import PersonalReviewDialog from './PersonalReviewDialog';
import AddParticipantsDialog from './AddParticipantsDialog';
import TastingDialog from './TastingDialog';
import CellarPeopleDialog from './CellarPeopleDialog';
import CellarStorageDialog from './CellarStorageDialog';
import type { Wine, WineFilters, WineFormData } from '@/types/wine';
import { getMaturity, selectWines, styleFamily, type Maturity, type WineSort, type WineSortKey } from '@/utils/cellar';
import BottlePortrait from './BottlePortrait';
import CellarTable from './CellarTable';
import ReserveSpotlight from './ReserveSpotlight';
import CriticScores from './CriticScores';
import CellarDialog from './CellarDialog';
import WineModal from './WineModal';
import AIWineModal from './AIWineModal';
import AIExternalWineModal from './AIExternalWineModal';
import AddWineModal from './AddWineModal';
import AddExternalWineModal from './AddExternalWineModal';
import SommelierWidget from './SommelierWidget';

export interface CellarCollectionProps {
  wines: Wine[];
  storage: CellarStorage;
  onSaveFridge: (input: FridgeInput) => Promise<void>;
  onDeleteFridge: (id: string) => Promise<void>;
  cellarName?: string;
  cellarId?: string;
  mode?: 'cellar' | 'journal';
  locale?: 'en' | 'pt';
  loading?: boolean;
  error?: string;
  onRetry: () => void;
  onAdd: (wine: WineFormData) => Promise<void>;
  onUpdate: (wine: Wine) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onConsume: (wine: Wine, input: TastingInput) => Promise<void>;
  people: Person[];
  isOwner: boolean;
  onAddParticipants: (id: string, personIds: string[]) => Promise<void>;
  onReview: (id: string, rating: number | null, comment: string) => Promise<void>;
  onAddPerson: (name: string, email: string) => Promise<{ invitationSent: boolean; warning: string }>;
}

const defaultFilters: WineFilters = { search: '', country: 'all', region: 'all', style: 'all', vintage: 'all', status: 'all', coravin: 'all' };
const maturityLabels: Record<'en' | 'pt', Record<Maturity, string>> = {
  en: { ready: 'Ready to enjoy', soon: 'Almost its time', rest: 'Worth the wait', unknown: 'No window set' },
  pt: { ready: 'Pronto para abrir', soon: 'Quase na hora', rest: 'Vale a espera', unknown: 'Sem janela definida' },
};
const statusLabels = { en: { in_cellar: 'In cellar', consumed: 'Consumed', sold: 'Sold', gifted: 'Gifted' }, pt: { in_cellar: 'Na adega', consumed: 'Consumido', sold: 'Vendido', gifted: 'Presenteado' } };
const displayName = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

function MaturityLabel({ wine, locale, year }: { wine: Wine; locale: 'en' | 'pt'; year: number }) {
  const maturity = getMaturity(wine, year);
  return <span className={`maturity-label maturity-${maturity}`}><span />{maturityLabels[locale][maturity]}</span>;
}

function WineActions({ wine, locale, onView, onEdit, onDrink, onDelete, onParticipants }: { wine: Wine; locale: 'en' | 'pt'; onView: () => void; onEdit: () => void; onDrink: () => void; onDelete: () => void; onParticipants?: () => void }) {
  const pt = locale === 'pt';
  return <div className="wine-card-actions">
    <button className="wine-action-primary" disabled={wine.status === 'in_cellar' && wine.quantity < 1} onClick={wine.status === 'in_cellar' ? onDrink : onView}>{wine.status === 'in_cellar' ? <GlassWater size={15} /> : <BookOpen size={15} />}{wine.status === 'in_cellar' ? (pt ? 'Abrir uma garrafa' : 'Open a bottle') : (pt ? 'Ver a história' : 'Revisit this bottle')}<ArrowUpRight size={14} /></button>
    <details className="wine-more"><summary aria-label={`${pt ? 'Opções para' : 'Actions for'} ${wine.bottle}`}><MoreHorizontal size={19} /></summary><div className="wine-more-menu">
      <button onClick={onView}><WineIcon size={14} />{pt ? 'Ver detalhes' : 'View details'}</button>
      {onParticipants && <button onClick={onParticipants}><Users size={14} />{pt ? 'Adicionar participantes' : 'Add participants'}</button>}
      <button onClick={onEdit}><Edit3 size={14} />{pt ? 'Editar vinho' : 'Edit wine'}</button>
      {wine.technical_sheet && <a href={wine.technical_sheet} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} />{pt ? 'Ficha técnica' : 'Technical sheet'}</a>}
      <button className="delete-action" onClick={onDelete}><Trash2 size={14} />{pt ? 'Excluir vinho' : 'Delete wine'}</button>
    </div></details>
  </div>;
}

export default function CellarCollection({ wines, cellarName, cellarId, mode = 'cellar', locale = 'en', loading = false, error, onRetry, onAdd, onUpdate, onDelete, onConsume, people, isOwner, onReview, onAddPerson, onAddParticipants, storage, onSaveFridge, onDeleteFridge }: CellarCollectionProps) {
  const pt = locale === 'pt';
  const journal = mode === 'journal';
  const year = new Date().getFullYear();
  const [filters, setFilters] = useState<WineFilters>({ ...defaultFilters });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [sort, setSort] = useState<WineSort>(journal ? { key: 'myRating', direction: 'desc' } : { key: 'name', direction: 'asc' });
  const sortColumn = (key: WineSortKey) => setSort(previous => ({ key, direction: previous.key === key ? (previous.direction === 'asc' ? 'desc' : 'asc') : key === 'criticRating' ? 'desc' : 'asc' }));
  const [readyOnly, setReadyOnly] = useState(false);
  const [selected, setSelected] = useState<Wine | null>(null);
  const [editing, setEditing] = useState<Wine | null>(null);
  const [drinking, setDrinking] = useState<Wine | null>(null);
  const [adding, setAdding] = useState<'choose' | 'scan' | 'manual' | null>(null);
  const [sommelierOpen, setSommelierOpen] = useState(false);
  const [reviewing, setReviewing] = useState<Wine | null>(null);
  const [sharing, setSharing] = useState<Wine | null>(null);
  const [logging, setLogging] = useState<WineFormData | null>(null);
  const [storageOpen, setStorageOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [unratedOnly, setUnratedOnly] = useState(false);
  const [actionError, setActionError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => { if (toast) { const timer = setTimeout(() => setToast(''), 4500); return () => clearTimeout(timer); } }, [toast]);
  useEffect(() => { const url = new URL(window.location.href); if (url.searchParams.has('welcome')) { url.searchParams.delete('welcome'); window.history.replaceState({}, '', url.pathname + url.search + url.hash); } }, []);
  const collection = useMemo(() => wines.filter(wine => journal ? wine.status === 'consumed' && wine.inMyJournal : wine.status === 'in_cellar'), [wines, journal]);
  const filtered = useMemo(() => selectWines(unratedOnly ? collection.filter(wine => wine.myRating == null) : collection, filters, readyOnly, sort, year), [collection, filters, readyOnly, sort, year, unratedOnly]);
  const ready = collection.filter(wine => getMaturity(wine, year) === 'ready');
  const bottles = collection.reduce((sum, wine) => sum + wine.quantity, 0);
  const countries = Array.from(new Set(collection.map(wine => wine.country).filter(Boolean))).sort();
  const styles = Array.from(new Set(collection.map(wine => wine.style).filter(Boolean))).sort();
  const regions = Array.from(new Set(collection.filter(wine => filters.country === 'all' || wine.country === filters.country).map(wine => wine.region).filter(Boolean))).sort();
  const vintages = Array.from(new Set(collection.map(wine => wine.vintage))).sort((a, b) => b - a);
  const filterCount = Object.entries(filters).filter(([key, value]) => key !== 'search' && value !== 'all').length + Number(readyOnly) + Number(unratedOnly);
  const featured = journal ? [...collection].filter(wine => wine.myRating != null).sort((a, b) => b.myRating! - a.myRating!)[0] : [...ready].sort((a, b) => a.vintage - b.vintage)[0] || collection[0];
  const setFilter = (key: keyof WineFilters, value: string) => {
    setFilters(previous => ({ ...previous, [key]: value, ...(key === 'country' ? { region: 'all' } : {}) }));
    if (journal && key === 'style') setSort({ key: 'myRating', direction: 'desc' });
  };
  const clearFilters = () => { setFilters({ ...defaultFilters }); setReadyOnly(false); setUnratedOnly(false); };
  const beginDrink = (wine: Wine) => { setSelected(null); setDrinking(wine); setActionError(''); };
  const editWine = (wine: Wine) => { setSelected(null); setEditing(wine); };
  const deleteWine = async (wine: Wine) => {
    if (!confirm(pt ? `Excluir ${wine.bottle} da sua coleção?` : `Delete ${wine.bottle} from your collection?`)) return;
    try { await onDelete(wine.id); setSelected(null); setToast(pt ? 'Vinho excluído.' : 'Wine deleted.'); }
    catch (error) { setActionError(error instanceof Error ? error.message : 'Unable to delete wine.'); }
  };
  const addWine = async (wine: WineFormData) => {
    if (journal) { setLogging(wine); setAdding(null); return; }
    await onAdd(wine); setAdding(null); setToast(pt ? 'Vinho adicionado.' : 'Wine added to your collection.');
  };
  const beginSharing = (wine: Wine) => { setSelected(null); setSharing(wine); };
  const saveParticipants = async (id: string, personIds: string[]) => { await onAddParticipants(id, personIds); setToast(pt ? 'Participantes adicionados. O vinho já está nos diários deles.' : 'Participants added. This wine is now in their journals.'); };
  const beginReview = (wine: Wine) => { setSelected(null); setReviewing(wine); };
  const saveReview = async (id: string, rating: number | null, comment: string) => { await onReview(id, rating, comment); setToast(pt ? 'Sua avaliação foi salva.' : 'Your review is saved.'); };
  const saveWine = async (wine: Wine) => { await onUpdate(wine); setToast(pt ? 'Vinho atualizado.' : 'Wine details updated.'); };

  const stats = [
    { icon: WineIcon, value: bottles, label: journal ? (pt ? 'Garrafas provadas' : 'Bottles tasted') : (pt ? 'Garrafas' : 'Bottles') },
    { icon: journal ? BookOpen : GlassWater, value: journal ? collection.filter(wine => wine.myRating != null).length : ready.reduce((sum, wine) => sum + wine.quantity, 0), label: journal ? (pt ? 'Avaliados' : 'Rated') : (pt ? 'Prontas para abrir' : 'Ready to open') },
    { icon: Compass, value: countries.length, label: pt ? 'Países' : 'Countries' },
    { icon: journal ? CalendarDays : BookOpen, value: collection.length, label: pt ? 'Rótulos' : 'Labels' },
  ];

  return <main className={`collection-page ${journal ? 'journal-page' : ''} ${view === 'list' ? 'compact-collection' : ''}`}>
    <section className="cellar-masthead">
      <div className="cellar-title"><p className="eyebrow"><span />{journal ? (pt ? 'AS NOTAS DE QUEM PROVOU' : 'TASTED, SHARED & REMEMBERED') : (pt ? 'RESERVA PESSOAL · FLINT' : 'PRIVATE RESERVE · FLINT')}</p>
        <h1>{journal ? (pt ? 'Meu diário de vinhos.' : 'My tasting journal.') : (cellarName || (pt ? 'Minha adega.' : 'My cellar.'))}</h1>
        <p>{journal ? (pt ? 'As garrafas que você abriu. As histórias que ficaram.' : 'The bottles you opened. The ones you won’t forget.') : (pt ? 'Para guardar. Para compartilhar. Para abrir uma boa garrafa.' : 'For keeping. For sharing. For opening something good.')}</p>
      </div>
      {journal && featured && !loading && <button className="cellar-spotlight" onClick={() => setSelected(featured)} aria-label={`${pt ? 'Ver' : 'View'} ${featured.bottle}: ${pt ? 'uma das suas melhores notas' : 'one of your highest scores'}`}>
        <BottlePortrait wine={featured} /><span><span className="eyebrow">{journal ? (pt ? 'ENTRE OS FAVORITOS' : 'ONE TO REMEMBER') : (pt ? 'DA SUA RESERVA' : 'FROM YOUR RESERVE')}</span><strong>{featured.bottle}</strong><small>{featured.vintage || 'NV'} · {featured.country}{journal && featured.myRating != null ? ` · ${featured.myRating}/100` : ''}</small></span><ArrowUpRight size={18} />
      </button>}
    </section>
    {!journal && !loading && <ReserveSpotlight key={cellarId || cellarName} wines={collection} locale={locale} year={year} cellarId={cellarId} onView={setSelected} onDrink={beginDrink} />}
    <section className="reserve-totals" aria-label={pt ? 'Resumo da coleção' : 'Collection overview'}>{stats.map(({ icon: Icon, value, label }) => <div key={label}><Icon size={15} strokeWidth={1.5} /><strong>{loading ? '—' : value.toLocaleString(locale)}</strong><span>{label}</span></div>)}</section>

    <section id="collection" className="wine-collection">
      <div className="collection-heading"><div><h2>{journal ? (pt ? 'Meu ranking de vinhos' : 'My wine ranking') : (pt ? 'As garrafas' : 'The bottles')}<span>{loading ? '' : collection.length}</span></h2></div><button className="flint-button" onClick={() => setAdding('choose')}><Plus size={17} />{journal ? (pt ? 'Registrar vinho' : 'Log a wine') : (pt ? 'Adicionar vinho' : 'Add a wine')}</button></div>
      <div className="collection-toolbar"><label className="collection-search"><Search size={18} /><span className="sr-only">{pt ? 'Buscar na coleção' : 'Search your collection'}</span><input type="search" value={filters.search} onChange={event => setFilter('search', event.target.value)} placeholder={pt ? 'Busque um vinho, uva, região…' : 'Find a wine, grape, region…'} /></label><div className="toolbar-controls">{isOwner && !journal && <button className="filter-toggle" onClick={() => setStorageOpen(true)}><MapPin size={16} />{pt ? 'Adegas' : 'Wine fridges'}</button>}{isOwner && <button className="filter-toggle" onClick={() => setPeopleOpen(true)}><Users size={16} />{pt ? 'Pessoas' : 'People'}</button>}<button className={`filter-toggle ${filtersOpen ? 'active' : ''}`} aria-expanded={filtersOpen} aria-controls="wine-filters" onClick={() => setFiltersOpen(!filtersOpen)}><SlidersHorizontal size={16} />{pt ? 'Filtros' : 'Filters'}{filterCount > 0 && <span>{filterCount}</span>}</button>{view === 'grid' && <label className="sort-select"><span className="sr-only">{pt ? 'Ordenar vinhos' : 'Sort wines'}</span><select value={`${sort.key}:${sort.direction}`} onChange={event => { const [key, direction] = event.target.value.split(':'); setSort({ key: key as WineSortKey, direction: direction as 'asc' | 'desc' }); }}>{!['name:asc', 'vintage:desc', 'vintage:asc', 'ready:asc', 'myRating:desc', 'myRating:asc', 'criticRating:desc', 'criticRating:asc'].includes(`${sort.key}:${sort.direction}`) && <option value={`${sort.key}:${sort.direction}`}>{pt ? 'Ordem da tabela' : 'Table column order'}</option>}{journal && <><option value="myRating:desc">{pt ? 'Minha nota: maior primeiro' : 'My score: highest first'}</option><option value="myRating:asc">{pt ? 'Minha nota: menor primeiro' : 'My score: lowest first'}</option></>}{!journal && <><option value="criticRating:desc">{pt ? 'Críticos: maior nota primeiro' : 'Critics: highest first'}</option><option value="criticRating:asc">{pt ? 'Críticos: menor nota primeiro' : 'Critics: lowest first'}</option></>}<option value="name:asc">{pt ? 'Nome: A–Z' : 'Name: A–Z'}</option><option value="vintage:desc">{pt ? 'Safras recentes' : 'Newest vintage'}</option><option value="vintage:asc">{pt ? 'Safras antigas' : 'Oldest vintage'}</option>{!journal && <option value="ready:asc">{pt ? 'Prontos primeiro' : 'Ready first'}</option>}</select></label>}<div className="view-switch" role="group" aria-label={pt ? 'Visualização' : 'Collection layout'}><button className={view === 'grid' ? 'active' : ''} aria-pressed={view === 'grid'} aria-label={pt ? 'Ver cartões' : 'Grid view'} onClick={() => setView('grid')}><LayoutGrid size={16} /></button><button className={view === 'list' ? 'active' : ''} aria-pressed={view === 'list'} aria-label={pt ? 'Ver lista' : 'List view'} onClick={() => setView('list')}><List size={18} /></button></div></div></div>
      {filtersOpen && <div id="wine-filters" className="expanded-filters">{([
        ['style', pt ? 'Tipo de vinho' : 'Wine type', styles], ['country', pt ? 'País' : 'Country', countries], ['region', pt ? 'Região' : 'Region', regions], ['vintage', pt ? 'Safra' : 'Vintage', vintages.map(String)],
      ] as const).map(([key, label, values]) => <label key={key}>{label}<select value={filters[key]} onChange={event => setFilter(key, event.target.value)}><option value="all">{pt ? 'Todos' : 'All'}</option>{values.map(value => <option key={value} value={value}>{value === '0' ? 'NV' : value}</option>)}</select></label>)}<label>Coravin<select value={filters.coravin} onChange={event => setFilter('coravin', event.target.value)}><option value="all">{pt ? 'Todos' : 'All bottles'}</option><option value="yes">{pt ? 'Com Coravin' : 'With Coravin'}</option><option value="no">{pt ? 'Sem Coravin' : 'Without Coravin'}</option></select></label><button className="text-button" onClick={clearFilters}><X size={14} />{pt ? 'Limpar' : 'Reset'}</button></div>}
      <div className="collection-tabs">{journal ? <><div className="style-tabs"><button className={!unratedOnly ? 'active' : ''} onClick={() => setUnratedOnly(false)}>{pt ? 'Vinhos que compartilhei' : 'Wines I shared'}</button><button className={unratedOnly ? 'active' : ''} onClick={() => setUnratedOnly(true)}>{pt ? 'Ainda sem nota' : 'Still to rate'}<span> · {collection.filter(wine => wine.myRating == null).length}</span></button></div><button className="text-button" onClick={() => setSort({ key: 'myRating', direction: 'desc' })}>{pt ? 'Melhores notas primeiro' : 'Highest scores first'}</button></> : <><div className="style-tabs"><button className={filters.style === 'all' && !readyOnly ? 'active' : ''} onClick={() => { setFilter('style', 'all'); setReadyOnly(false); }}>{pt ? 'Todos os vinhos' : 'All wines'}</button>{styles.map(style => <button key={style} className={filters.style === style ? 'active' : ''} onClick={() => setFilter('style', style)}><span className={`style-dot dot-${styleFamily(style)}`} />{displayName(style)}</button>)}</div><button className={`ready-filter ${readyOnly ? 'active' : ''}`} aria-pressed={readyOnly} onClick={() => setReadyOnly(!readyOnly)}><Clock3 size={14} />{pt ? 'Prontos para abrir' : 'Ready to enjoy'}{readyOnly && <X size={12} />}</button></>}</div>
      {journal && <div className="journal-type-filters" role="group" aria-label={pt ? 'Tipo de vinho' : 'Wine type'}><span>{pt ? 'Ranking por tipo' : 'Rank by wine type'}</span><div className="wine-type-buttons"><button className={filters.style === 'all' ? 'active' : ''} aria-pressed={filters.style === 'all'} onClick={() => setFilter('style', 'all')}>{pt ? 'Todos os tipos' : 'All types'}</button>{styles.map(style => <button key={style} className={filters.style === style ? 'active' : ''} aria-pressed={filters.style === style} onClick={() => setFilter('style', style)}><span className={`style-dot dot-${styleFamily(style)}`} />{displayName(style)}</button>)}</div></div>}
      {(filters.search || filterCount > 0) && <div className="filter-summary"><span>{filtered.length} {pt ? 'vinhos encontrados' : 'wines found'}</span><button onClick={clearFilters}>{pt ? 'Limpar filtros' : 'Clear filters'}<X size={12} /></button></div>}
      {(error || (actionError && !drinking)) && <div className="flint-alert" role="alert">{error || actionError}<button onClick={error ? onRetry : () => setActionError('')}>{error ? (pt ? 'Tentar novamente' : 'Try again') : (pt ? 'Fechar' : 'Dismiss')}</button></div>}
      {loading ? <div className="wine-grid" aria-label={pt ? 'Carregando vinhos' : 'Loading wines'} aria-busy="true">{[1, 2, 3, 4, 5, 6].map(id => <div className="wine-skeleton" key={id}><div /><span /><span /></div>)}</div> : filtered.length ? view === 'list' ? <CellarTable wines={filtered} locale={locale} journal={journal} sort={sort} onSort={sortColumn} onView={setSelected} onEdit={editWine} onDrink={beginDrink} onDelete={deleteWine} onReview={beginReview} onParticipants={beginSharing} /> : <div className="wine-grid">
        {filtered.map(wine => <article key={wine.id} className="collection-wine-card">
          <div className="wine-image-wrap"><button className="bottle-view-button" aria-label={`${pt ? 'Ver' : 'View'} ${wine.bottle}`} onClick={() => setSelected(wine)}><BottlePortrait wine={wine} /></button><span className={`wine-style-badge badge-${styleFamily(wine.style)}`}><span />{displayName(wine.style)}</span>{wine.coravin && <span className="coravin-badge">Coravin</span>}<button className="wine-expand" aria-label={`${pt ? 'Detalhes de' : 'Details for'} ${wine.bottle}`} onClick={() => setSelected(wine)}><ArrowUpRight size={17} /></button></div>
          <div className="wine-card-body"><p className="wine-origin">{wine.country}{wine.region && <><span> / </span>{wine.region}</>}</p><h3><button onClick={() => setSelected(wine)}>{wine.bottle}</button></h3><div className="wine-facts"><span>{wine.vintage || 'NV'}</span><span>{wine.quantity} {wine.quantity === 1 ? (pt ? 'garrafa' : 'bottle') : (pt ? 'garrafas' : 'bottles')}</span>{journal ? <button className="personal-score" onClick={() => beginReview(wine)}>{wine.myRating == null ? (pt ? 'Avaliar' : 'Add my score') : <>{wine.myRating}<small>/100</small></>}</button> : <CriticScores wine={wine} locale={locale} />}</div><div className="wine-window">{journal ? <span className={`history-label history-${wine.status}`}><BookOpen size={12} />{statusLabels[locale][wine.status]}{wine.consumedDate && <> · {new Intl.DateTimeFormat(pt ? 'pt-BR' : 'en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(wine.consumedDate))}</>}</span> : <MaturityLabel wine={wine} locale={locale} year={year} />}{wine.location && !journal && <span className="wine-location"><MapPin size={11} />{wine.location}</span>}</div>
          {journal && <><p className="journal-shared-with">{pt ? 'Com' : 'With'} {wine.participants?.map(person => person.name).join(', ')}</p>{wine.myComment && <p className="journal-card-note">“{wine.myComment}”</p>}</>}
          <WineActions wine={wine} locale={locale} onView={() => setSelected(wine)} onEdit={() => editWine(wine)} onDrink={() => beginDrink(wine)} onDelete={() => deleteWine(wine)} onParticipants={wine.status === 'consumed' && (isOwner || wine.inMyJournal) ? () => beginSharing(wine) : undefined} />
          </div></article>)}
      </div> : !error && <div className="collection-empty"><WineIcon size={35} strokeWidth={1} /><h3>{collection.length ? (pt ? 'Ainda não encontramos essa garrafa.' : 'That bottle is playing hide-and-seek.') : (pt ? 'Toda coleção começa com uma história.' : 'Every collection starts with a story.')}</h3><p>{collection.length ? (pt ? 'Tente outra busca ou limpe os filtros.' : 'Try another search or give your filters a fresh start.') : (pt ? 'Adicione seu primeiro vinho e comece a explorar.' : 'Add your first wine and make yourself at home.')}</p><button className="flint-button" onClick={collection.length ? clearFilters : () => setAdding('choose')}>{collection.length ? (pt ? 'Limpar filtros' : 'Clear filters') : (pt ? 'Adicionar vinho' : 'Add a wine')}<Plus size={15} /></button></div>}
      {!loading && filtered.length > 0 && <p className="collection-results">{pt ? `${filtered.length} rótulos · ${filtered.reduce((sum, wine) => sum + wine.quantity, 0)} garrafas` : `${filtered.length} labels · ${filtered.reduce((sum, wine) => sum + wine.quantity, 0)} bottles`}</p>}
    </section>

    {!journal && <aside className="cellar-sommelier-note"><Sparkles size={18} /><p>{pt ? 'Algo especial no menu?' : 'Something good on the menu?'} <span>{pt ? 'Encontre o vinho para acompanhar.' : 'Find the bottle to go with it.'}</span></p><button className="text-button" onClick={() => setSommelierOpen(true)}>{pt ? 'Pergunte ao sommelier' : 'Ask your sommelier'}<ArrowUpRight size={15} /></button></aside>}

    {selected && <CellarDialog title={selected.bottle} onClose={() => setSelected(null)} wide><div className="wine-detail"><BottlePortrait wine={selected} /><div className="wine-detail-content"><p className="eyebrow">{selected.country} / {selected.region}</p><h2>{selected.bottle}</h2><span className="detail-style">{selected.vintage || 'NV'} · {selected.style} · {statusLabels[locale][selected.status]}</span><dl>{[
      [pt ? 'Uvas' : 'Grapes', selected.grapes], [pt ? 'Localização' : 'Location', selected.location], [pt ? 'Garrafas' : 'Bottles', selected.quantity], [pt ? 'Janela de consumo' : 'Drinking window', selected.drinkingWindow], [pt ? 'Apogeu' : 'Peak', selected.peakYear], [pt ? 'Nota anterior da adega' : 'Previous cellar rating', selected.rating != null ? String(selected.rating) : null], [pt ? 'Minha nota' : 'My score', selected.myRating != null ? `${selected.myRating}/100` : null], [pt ? 'Compartilhado com' : 'Shared with', selected.participants?.map(person => person.name).join(', ')], [pt ? 'Preço' : 'Price', selected.price], ['Coravin', selected.coravin ? selected.coravinDate || (pt ? 'Sim' : 'Yes') : null], [pt ? 'Consumido em' : 'Enjoyed on', selected.consumedDate],
    ].filter(([, value]) => value !== null && value !== undefined && value !== '').map(([label, value]) => <div key={String(label)}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><section className="detail-note"><h3>{pt ? 'Avaliações dos críticos' : 'Critic scores'}</h3><CriticScores wine={selected} locale={locale} detailed /></section>{selected.foodPairingNotes && <section className="detail-note"><h3>{pt ? 'À mesa' : 'At the table'}</h3><p>{selected.foodPairingNotes}</p></section>}{selected.mealToHaveWithThisWine && <section className="detail-note"><h3>{pt ? 'Uma ideia para o jantar' : 'A dinner idea'}</h3><p>{selected.mealToHaveWithThisWine}</p></section>}{selected.myComment && <section className="detail-note"><h3>{pt ? 'Meu comentário' : 'My comment'}</h3><p>{selected.myComment}</p></section>}{selected.notes && <section className="detail-note"><h3>{pt ? 'Notas da adega' : 'Cellar notes'}</h3><p>{selected.notes}</p></section>}{selected.technical_sheet && <a href={selected.technical_sheet} target="_blank" rel="noopener noreferrer" className="text-button">{pt ? 'Ficha técnica' : 'Technical sheet'}<ExternalLink size={14} /></a>}<div className="detail-actions">{selected.status === 'consumed' && (isOwner || selected.inMyJournal) && <button className="flint-button secondary" onClick={() => beginSharing(selected)}><Users size={15} />{pt ? 'Adicionar participantes' : 'Add participants'}</button>}{selected.inMyJournal && <button className="flint-button" onClick={() => beginReview(selected)}>{pt ? 'Minha avaliação' : 'My review'}</button>}<button className="flint-button" onClick={() => editWine(selected)}><Edit3 size={15} />{pt ? 'Editar vinho' : 'Edit wine'}</button>{selected.status === 'in_cellar' && selected.quantity > 0 && <button className="flint-button secondary" onClick={() => beginDrink(selected)}><GlassWater size={15} />{pt ? 'Abrir uma garrafa' : 'Open a bottle'}</button>}</div></div></div></CellarDialog>}
    {drinking && <TastingDialog bottle={drinking.bottle} vintage={drinking.vintage} maxQuantity={drinking.quantity} people={people} locale={locale} onSave={async input => { await onConsume(drinking, input); setToast(pt ? 'Consumo registrado nos diários dos participantes.' : 'Saved to the participants’ journals.'); }} onClose={() => setDrinking(null)} />}
    {logging && <TastingDialog bottle={logging.bottle} vintage={logging.vintage} initialComment={logging.notes} people={people} locale={locale} onSave={async input => { await onAdd({ ...logging, ...input, status: 'consumed', fromCellar: false }); setToast(pt ? 'Vinho registrado.' : 'Wine saved to your journal.'); }} onClose={() => setLogging(null)} />}
    {sharing && <AddParticipantsDialog wine={sharing} people={people} locale={locale} onSave={saveParticipants} onClose={() => setSharing(null)} />}
    {reviewing && <PersonalReviewDialog wine={reviewing} locale={locale} onSave={saveReview} onClose={() => setReviewing(null)} />}
    {storageOpen && isOwner && <CellarStorageDialog storage={storage} wines={wines} locale={locale} onSave={onSaveFridge} onDelete={onDeleteFridge} onClose={() => setStorageOpen(false)} />}
    {peopleOpen && isOwner && <CellarPeopleDialog people={people} locale={locale} onAdd={onAddPerson} onClose={() => setPeopleOpen(false)} />}
    {adding === 'choose' && <CellarDialog title={pt ? 'Adicione uma nova história' : 'Add a new story'} onClose={() => setAdding(null)}><p className="eyebrow">{pt ? 'ESPAÇO PARA UMA DESCOBERTA' : 'ROOM FOR A NEW DISCOVERY'}</p><h2>{pt ? 'Um vinho para sua coleção.' : 'A bottle for your collection.'}</h2><p className="dialog-description">{journal ? (pt ? 'Registre um vinho que você apreciou fora da adega.' : 'Remember a wine you enjoyed beyond your cellar.') : (pt ? 'Como você gostaria de adicionar seu vinho?' : 'How would you like to add your wine?')}</p><div className="add-options"><button onClick={() => setAdding('scan')}><Camera size={25} /><strong>{pt ? 'Fotografe o rótulo' : 'Scan a label'}</strong><span>{pt ? 'Deixe a IA preencher os detalhes.' : 'Let AI take care of the details.'}</span><ArrowUpRight size={17} /></button><button onClick={() => setAdding('manual')}><Edit3 size={24} /><strong>{pt ? 'Adicione à mão' : 'Add it yourself'}</strong><span>{pt ? 'Preencha os detalhes do seu vinho.' : 'Enter the details of your bottle.'}</span><ArrowUpRight size={17} /></button></div></CellarDialog>}
    {editing && <WineModal storage={storage} onManageStorage={isOwner ? () => setStorageOpen(true) : undefined} wine={editing} isOpen onClose={() => setEditing(null)} onSave={saveWine} mode="edit" locale={locale} />}
    {!journal && adding === 'scan' && <AIWineModal storage={storage} onManageStorage={isOwner ? () => setStorageOpen(true) : undefined} isOpen onClose={() => setAdding(null)} onAddWine={addWine} locale={locale} />}
    {journal && adding === 'scan' && <AIExternalWineModal isOpen onClose={() => setAdding(null)} onAddWine={addWine} locale={locale} />}
    {!journal && adding === 'manual' && <AddWineModal storage={storage} onManageStorage={isOwner ? () => setStorageOpen(true) : undefined} isOpen onClose={() => setAdding(null)} onAddWine={addWine} />}
    {journal && adding === 'manual' && <AddExternalWineModal isOpen onClose={() => setAdding(null)} onAddWine={addWine} />}
    <SommelierWidget isOpen={sommelierOpen} onClose={() => setSommelierOpen(false)} wines={wines.filter(wine => wine.status === 'in_cellar')} locale={locale} />
    {toast && <div className="flint-toast" role="status"><Check size={17} />{toast}<button onClick={() => setToast('')} aria-label="Dismiss notification"><X size={15} /></button></div>}
  </main>;
}
