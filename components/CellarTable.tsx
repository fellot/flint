'use client';

import { ArrowDown, ArrowUp, ArrowUpDown, BookOpen, Edit3, GlassWater, Trash2, UserPlus } from 'lucide-react';
import type { Wine } from '@/types/wine';
import type { WineSort, WineSortKey } from '@/utils/cellar';
import { styleFamily } from '@/utils/cellar';
import BottlePortrait from './BottlePortrait';
import CriticScores from './CriticScores';

interface Props {
  wines: Wine[];
  locale: 'en' | 'pt';
  journal: boolean;
  sort: WineSort;
  onSort: (key: WineSortKey) => void;
  onView: (wine: Wine) => void;
  onEdit: (wine: Wine) => void;
  onDrink: (wine: Wine) => void;
  onDelete: (wine: Wine) => void;
  onReview: (wine: Wine) => void;
  onParticipants: (wine: Wine) => void;
}

export default function CellarTable({ wines, locale, journal, sort, onSort, onView, onEdit, onDrink, onDelete, onReview, onParticipants }: Props) {
  const pt = locale === 'pt';
  const columns: { key: WineSortKey; label: string }[] = [
    { key: 'name', label: pt ? 'Vinho' : 'Wine' },
    ...(journal ? [{ key: 'myRating' as const, label: pt ? 'Minha nota' : 'My score' }] : []),
    { key: 'country', label: pt ? 'País / região' : 'Country / region' },
    { key: 'style', label: pt ? 'Estilo' : 'Style' },
    { key: 'vintage', label: pt ? 'Safra' : 'Vintage' },
    { key: journal ? 'consumed' : 'window', label: journal ? (pt ? 'Consumido em' : 'Enjoyed on') : (pt ? 'Consumo' : 'Drink window') },
    { key: journal ? 'status' : 'peak', label: journal ? 'Status' : (pt ? 'Apogeu' : 'Peak') },
    { key: 'quantity', label: pt ? 'Qtd.' : 'Qty' },
    ...(!journal ? [{ key: 'criticRating' as const, label: pt ? 'Críticos' : 'Critic scores' }] : []),
    ...(journal ? [
      { key: 'myComment' as const, label: pt ? 'Meu comentário' : 'My comment' },
      { key: 'participants' as const, label: pt ? 'Compartilhado com' : 'Shared with' },
    ] : [{ key: 'location' as const, label: pt ? 'Localização' : 'Location' }]),
  ];
  const statuses = { consumed: pt ? 'Consumido' : 'Consumed', gifted: pt ? 'Presenteado' : 'Gifted', sold: pt ? 'Vendido' : 'Sold', in_cellar: pt ? 'Na adega' : 'In cellar' };
  return <>
    <p className="table-sort-hint">{pt ? 'Clique no título de uma coluna para ordenar. Clique novamente para inverter.' : 'Click a column heading to sort. Click again to reverse.'}<span>{pt ? 'Deslize para ver todas as colunas.' : 'Scroll sideways for all columns.'}</span></p>
    <div className="compact-table-scroll" role="region" aria-label={pt ? 'Tabela de vinhos' : 'Wine table'} tabIndex={0}>
      <table className="compact-wine-table">
        <caption className="sr-only">{pt ? 'Sua coleção de vinhos. Ordene usando os botões nos títulos das colunas.' : 'Your wine collection. Sort with the buttons in each column heading.'}</caption>
        <thead><tr>{columns.map(column => <th key={column.key} scope="col" aria-sort={sort.key === column.key ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
          <button onClick={() => onSort(column.key)}>{column.label}{sort.key === column.key ? (sort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={11} />}</button>
        </th>)}<th scope="col"><span className="sr-only">{pt ? 'Ações' : 'Actions'}</span></th></tr></thead>
        <tbody>{wines.map(wine => <tr key={wine.id}>
          <td className="table-wine-name"><button onClick={() => onView(wine)} aria-label={`${pt ? 'Ver' : 'View'} ${wine.bottle}`}><BottlePortrait wine={wine} /><span><strong>{wine.bottle}</strong>{wine.coravin && <small>Coravin</small>}</span></button></td>
          {journal && <td className="table-number"><button className="personal-score" onClick={() => onReview(wine)} aria-label={`${pt ? 'Avaliar' : 'Review'} ${wine.bottle}`}>{wine.myRating == null ? (pt ? 'Avaliar' : 'Rate') : <>{wine.myRating}<small>/100</small></>}<Edit3 size={11} /></button></td>}
          <td className="table-origin"><span>{wine.country}</span><small title={wine.region}>{wine.region || '—'}</small></td>
          <td><span className="table-wine-style"><i className={`style-dot dot-${styleFamily(wine.style)}`} />{wine.style || '—'}</span></td>
          <td className="table-number">{wine.vintage || 'NV'}</td>
          <td className="table-window">{journal ? (wine.consumedDate ? new Intl.DateTimeFormat(pt ? 'pt-BR' : 'en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(wine.consumedDate)) : '—') : wine.drinkingWindow || '—'}</td>
          <td className="table-peak">{journal ? statuses[wine.status] : wine.peakYear || '—'}</td>
          <td className="table-number">{wine.quantity}</td>
          {!journal && <td className="table-number"><CriticScores wine={wine} locale={locale} /></td>}
          {journal ? <><td className="table-comment"><button onClick={() => onReview(wine)} title={wine.myComment || ''}>{wine.myComment || (pt ? 'Adicionar comentário' : 'Add a comment')}</button></td><td className="table-participants" title={wine.participants?.map(person => person.name).join(', ')}>{wine.participants?.map(person => person.name).join(', ') || '—'}</td></> : <td className="table-location">{wine.location || '—'}</td>}
          <td><div className="table-row-actions">{journal && <button onClick={() => onParticipants(wine)} title={pt ? 'Adicionar participantes' : 'Add participants'} aria-label={`${pt ? 'Adicionar participantes a' : 'Add participants to'} ${wine.bottle}`}><UserPlus size={14} /></button>}<button onClick={() => wine.status === 'in_cellar' ? onDrink(wine) : onView(wine)} disabled={wine.status === 'in_cellar' && wine.quantity < 1} title={pt ? 'Abrir / ver vinho' : 'Open / view wine'} aria-label={`${wine.status === 'in_cellar' ? (pt ? 'Abrir' : 'Open') : (pt ? 'Ver' : 'Revisit')} ${wine.bottle}`}>{wine.status === 'in_cellar' ? <GlassWater size={14} /> : <BookOpen size={14} />}</button><button onClick={() => onEdit(wine)} title={pt ? 'Editar' : 'Edit'} aria-label={`${pt ? 'Editar' : 'Edit'} ${wine.bottle}`}><Edit3 size={14} /></button><button onClick={() => onDelete(wine)} className="table-delete" title={pt ? 'Excluir' : 'Delete'} aria-label={`${pt ? 'Excluir' : 'Delete'} ${wine.bottle}`}><Trash2 size={13} /></button></div></td>
        </tr>)}</tbody>
      </table>
    </div>
  </>;
}
