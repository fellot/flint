'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { BookOpen, Globe, MapPin, Search, Wine as WineIcon, X } from 'lucide-react';
import type { Wine } from '@/types/wine';
import { buildWineMap, selectMapWines, type MapScope } from '@/lib/wine-map';
import { normalizeCountry } from '@/utils/regionCoordinates';
import './wine-atlas.css';

const WineMapView = dynamic(() => import('./WineMapView'), { ssr: false, loading: () => <div className="atlas-map-loading" role="status">…</div> });
interface Props { wines: Wine[]; cellarName: string; isPT: boolean; loading: boolean; error: boolean; onRetry: () => void }

export default function WineAtlas({ wines, cellarName, isPT: pt, loading, error, onRetry }: Props) {
  const [scope, setScope] = useState<MapScope>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [unmappedOnly, setUnmappedOnly] = useState(false);
  const visible = useMemo(() => selectMapWines(wines, scope, search), [wines, scope, search]);
  const data = useMemo(() => buildWineMap(visible), [visible]);
  const group = data.groups.find(g => g.key === selected);
  const entries = (unmappedOnly ? data.unmapped : group?.entries || data.entries).slice().sort((a, b) => a.wine.bottle.localeCompare(b.wine.bottle));
  const resetSelection = () => { setSelected(null); setUnmappedOnly(false); };
  const selectGroup = (key: string) => { setSelected(key); setUnmappedOnly(false); };
  const groupName = group ? Array.from(new Set(group.entries.map(e => e.origin?.label))).join(' · ') : '';
  const journalDate = (value: string | null) => {
    if (!value) return '—';
    const date = new Date(`${value.slice(0, 10)}T12:00:00Z`);
    return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(pt ? 'pt-BR' : 'en-CA', { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
  };
  return <div className="flint-subpage wine-atlas">
    <header className="subpage-heading"><p className="eyebrow">{pt ? 'O MUNDO, EM UMA TAÇA' : 'THE WORLD, ONE GLASS AT A TIME'} · {cellarName}</p><h1>{pt ? 'Uma coleção sem fronteiras.' : 'A collection without borders.'}</h1><p>{pt ? 'Os lugares que você guarda na adega e os que já conheceu na taça.' : 'The places you keep in your cellar, and those you’ve already met in a glass.'}</p></header>
    <details className="atlas-explainer"><summary>{pt ? 'De onde vêm as localizações?' : 'Where do these locations come from?'}</summary><p>{pt ? 'O mapa usa o país e a região de origem registrados em cada vinho. Os pontos são aproximações regionais, não endereços de vinícolas ou vinhedos. Quando só reconhecemos o país, indicamos isso. A localização na geladeira/prateleira é um campo separado e não é usada aqui.' : 'The map uses the country and region recorded for each wine. Pins are approximate regional points, not winery or vineyard addresses. When only the country is recognized, we label it. Fridge and shelf locations are separate and are not used here.'}</p><p>{pt ? 'Para corrigir uma origem, edite País e Região no vinho da adega ou do diário.' : 'To correct an origin, edit Country and Region on the wine in your cellar or journal.'}</p></details>
    {loading ? <p className="atlas-notice" role="status">{pt ? 'Carregando adega e diário…' : 'Loading cellar and journal…'}</p> : error ? <div className="atlas-notice" role="alert"><p>{pt ? 'Não foi possível carregar os vinhos desta adega.' : 'Could not load this cellar’s wines.'}</p><button className="flint-button" onClick={onRetry}>{pt ? 'Tentar novamente' : 'Try again'}</button></div> : <>
      <div className="atlas-controls"><div className="atlas-tabs" role="group" aria-label={pt ? 'Vinhos no mapa' : 'Wines on the map'}>{([
        ['all', 'Cellar + my journal', 'Adega + meu diário'], ['cellar', 'In cellar', 'Na adega'], ['journal', 'My journal', 'Meu diário'],
      ] as const).map(([id, en, br]) => <button key={id} aria-pressed={scope === id} onClick={() => { setScope(id); resetSelection(); }}>{pt ? br : en}</button>)}</div><label className="atlas-search"><Search size={16} /><span className="sr-only">{pt ? 'Buscar vinhos ou lugares' : 'Search wines or places'}</span><input value={search} onChange={e => { setSearch(e.target.value); resetSelection(); }} placeholder={pt ? 'Um vinho, país ou região…' : 'A wine, country or region…'} />{search && <button onClick={() => { setSearch(''); resetSelection(); }} aria-label={pt ? 'Limpar busca' : 'Clear search'}><X size={14} /></button>}</label></div>
      <div className="atlas-stats" aria-live="polite"><span><WineIcon size={15} /><strong>{data.bottles}</strong>{pt ? 'garrafas na adega' : 'bottles in cellar'}</span><span><BookOpen size={15} /><strong>{data.journal}</strong>{pt ? 'registros no diário' : 'journal entries'}</span><span><Globe size={15} /><strong>{data.countries}</strong>{pt ? 'países' : 'countries'}</span><span><MapPin size={15} /><strong>{data.entries.length - data.unmapped.length} / {data.entries.length}</strong>{pt ? 'registros no mapa' : 'records mapped'}</span></div>
      {visible.length > 0 ? <>
        {data.groups.length > 0 && <><div className="map-frame atlas-map-frame"><WineMapView groups={data.groups} isPT={pt} selected={selected} onSelect={selectGroup} /></div><div className="atlas-legend"><span><i className="atlas-dot atlas-dot-cellar" />{pt ? 'Na adega' : 'In cellar'}</span><span><i className="atlas-dot atlas-dot-journal" />{pt ? 'Meu diário' : 'My journal'}</span><span><i className="atlas-dot atlas-dot-mixed" />{pt ? 'Ambos' : 'Both'}</span><p>{pt ? 'Números = registros de vinho. Clique num ponto para ver os vinhos abaixo.' : 'Numbers = wine records. Click a pin to see its wines below.'}</p></div></>}
        {(data.approximate > 0 || data.unmapped.length > 0) && <div className="atlas-coverage-note"><p>{data.approximate > 0 && (pt ? `${data.approximate} registro(s) localizado(s) apenas pelo país. ` : `${data.approximate} record(s) located at country level only. `)}{data.unmapped.length > 0 && (pt ? `${data.unmapped.length} origem(ns) ainda sem ponto no mapa.` : `${data.unmapped.length} origin(s) have no map point yet.`)}</p>{data.unmapped.length > 0 && <button onClick={() => { setSelected(null); setUnmappedOnly(true); }}>{pt ? 'Ver origens sem ponto' : 'Show unmapped origins'}</button>}</div>}
        <section className="atlas-register" aria-labelledby="atlas-register-title"><header><div><p className="eyebrow">{pt ? 'O ATLAS DA SUA COLEÇÃO' : 'YOUR COLLECTION ATLAS'}</p><h2 id="atlas-register-title">{unmappedOnly ? (pt ? 'Origens a localizar' : 'Origins to locate') : groupName || (pt ? 'Todos os vinhos desta seleção' : 'All wines in this view')} <small>{entries.length}</small></h2></div>{(group || unmappedOnly) && <button onClick={resetSelection}>{pt ? 'Mostrar todos' : 'Show all'}<X size={14} /></button>}</header>
          <table className="atlas-table"><thead><tr><th>{pt ? 'Vinho' : 'Wine'}</th><th>{pt ? 'Origem registrada' : 'Recorded origin'}</th><th>{pt ? 'Localização no mapa' : 'Map placement'}</th><th>{pt ? 'Adega / diário' : 'Cellar / journal'}</th></tr></thead><tbody>{entries.map(({ wine, origin }) => <tr key={wine.id}><td><strong>{wine.bottle}</strong><span>{wine.vintage || 'NV'} · {wine.style}</span></td><td data-label={pt ? 'Origem' : 'Origin'}>{wine.region || (pt ? 'Região não informada' : 'Region not recorded')}<span>{normalizeCountry(wine.country) || (pt ? 'País não informado' : 'Country not recorded')}</span></td><td data-label={pt ? 'Mapa' : 'Map'}>{origin ? <><button className="atlas-origin-link" onClick={() => selectGroup(`${origin.lat},${origin.lng}`)}><MapPin size={13} />{origin.label}</button><span>{origin.precision === 'region' ? (pt ? 'Região aproximada' : 'Approximate region') : (pt ? 'Só o país · região não localizada' : 'Country only · region not located')}</span></> : <span className="atlas-unmapped">{pt ? 'Sem localização reconhecida' : 'No recognized map location'}</span>}</td><td data-label={pt ? 'Status' : 'Status'}>{wine.status === 'in_cellar' ? <><strong className="atlas-status">{pt ? 'Na adega' : 'In cellar'}</strong><span>{wine.quantity} {pt ? 'garrafa(s)' : 'bottle(s)'}</span></> : <><strong className="atlas-status atlas-status-journal">{pt ? 'Consumido · meu diário' : 'Consumed · my journal'}</strong><span>{journalDate(wine.consumedDate)}{wine.myRating != null ? ` · ${wine.myRating}/100` : ''}</span>{wine.fromCellar === false && <span>{pt ? 'Provado fora da adega' : 'Tasted outside the cellar'}</span>}</>}</td></tr>)}</tbody></table>
        </section>
      </> : <p className="atlas-notice">{search ? (pt ? 'Nenhum vinho corresponde à busca.' : 'No wines match this search.') : (pt ? 'Nenhum vinho nesta seleção. Os vinhos da adega e suas participações no diário aparecerão aqui.' : 'No wines in this view. Your cellar wines and personal journal tastings will appear here.')}</p>}
    </>}
  </div>;
}
