'use client';

import { useMemo, useState } from 'react';
import { ArrowUpRight, BookOpen, Check, ChevronDown, ShoppingBag } from 'lucide-react';
import { CELLAR_ESSENTIALS } from '@/data/cellar-essentials';
import { CELLAR_SHOPPING_PICKS, SHOPPING_REVIEWED_AT, US_WINE_RESTRICTION_URL } from '@/data/cellar-shopping';
import { getShoppingCoverage } from '@/lib/cellar-shopping';
import type { Wine } from '@/types/wine';

interface Props {
  wines: Wine[];
  locale: 'en' | 'pt';
  loading: boolean;
  error: boolean;
}

export default function CellarEssentialsShopping({ wines, locale, loading, error }: Props) {
  const pt = locale === 'pt';
  const [scope, setScope] = useState<'all' | 'new' | 'journal'>('all');
  const available = !loading && !error;
  const coverage = useMemo(() => new Map(CELLAR_SHOPPING_PICKS.map(pick => [pick.id, getShoppingCoverage(pick.essentialId, wines, available)])), [wines, available]);
  const picks = CELLAR_SHOPPING_PICKS.filter(pick => !available || scope === 'all' || coverage.get(pick.id)?.status === (scope === 'new' ? 'unmatched' : 'in-journal'));
  const date = new Intl.DateTimeFormat(pt ? 'pt-BR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${SHOPPING_REVIEWED_AT}T12:00:00Z`));
  const money = (value: number) => new Intl.NumberFormat(pt ? 'pt-BR' : 'en-CA', { style: 'currency', currency: 'CAD', currencyDisplay: 'narrowSymbol' }).format(value);

  return <section className="essentials-shopping" aria-labelledby="shopping-heading">
    <header className="shopping-heading">
      <div><p className="eyebrow">{pt ? 'A PRÓXIMA GARRAFA · TINTOS' : 'THE NEXT BOTTLE · RED WINES'}</p><h2 id="shopping-heading">{pt ? 'Abra espaço para uma descoberta.' : 'Make room for a new favourite.'}</h2><p>{pt ? 'Uma seleção da LCBO e Cellar Collection para explorar novos estilos, revisitar favoritos e comparar expressões.' : 'A shortlist from LCBO and the Cellar Collection to explore new styles, revisit favourites, and try a different expression.'}</p></div>
      <div className="shopping-edition"><ShoppingBag size={19} strokeWidth={1.4} /><strong>{CELLAR_SHOPPING_PICKS.length}</strong><span>{pt ? 'escolhas para explorar' : 'picks to explore'}</span></div>
    </header>

    <div className="shopping-toolbar">
      <p>{pt ? 'Pesquisa de' : 'Researched'} <time dateTime={SHOPPING_REVIEWED_AT}>{date}</time><span> · </span>CAD / 750 mL</p>
      <label>{pt ? 'Mostrar' : 'Show'}<select value={available ? scope : 'all'} disabled={!available} onChange={event => setScope(event.target.value as typeof scope)}><option value="all">{pt ? 'Todas as sugestões' : 'All suggestions'}</option><option value="new">{pt ? 'Sem correspondência nos meus vinhos' : 'No match in my wines'}</option><option value="journal">{pt ? 'No diário, fora da adega' : 'Tasted, no longer in cellar'}</option></select></label>
    </div>
    <p className="shopping-stock-note">{pt ? 'Preços e estoque refletem a data da pesquisa. Confirme a safra, o preço e a disponibilidade no link antes de comprar.' : 'Prices and stock reflect the research date. Check the linked listing for the current vintage, price and availability before buying.'}</p>

    <div className="shopping-list" role="list" aria-label={pt ? 'Sugestões de compra de tintos' : 'Red wine shopping suggestions'}>
      {picks.map(pick => {
        const entry = CELLAR_ESSENTIALS.find(item => item.id === pick.essentialId)!;
        const match = coverage.get(pick.id)!;
        const number = CELLAR_SHOPPING_PICKS.indexOf(pick) + 1;
        const retailer = pick.retailer === 'cellar-collection' ? 'Cellar Collection' : 'LCBO';
        return <article key={pick.id} className={`shopping-pick${pick.availability === 'unavailable' ? ' shopping-pending' : ''}`} role="listitem">
          <div className="shopping-style">
            <span className="shopping-number">{String(number).padStart(2, '0')}</span>
            <div><p className="shopping-intent">{pick.intent === 'restock' ? (pt ? 'PARA REVISITAR' : 'TO REVISIT') : pick.intent === 'contrast' ? (pt ? 'UM CONTRASTE OPCIONAL' : 'AN OPTIONAL CONTRAST') : (pt ? 'PARA EXPLORAR' : 'TO EXPLORE')}</p><h3>{entry.name[locale]}</h3>
              <div className="shopping-coverage">
                {match.cellarCount > 0 && <span className="shopping-in-cellar"><Check size={12} />{pt ? 'Na sua adega' : 'In your cellar'}</span>}
                {match.journalCount > 0 && <span className="shopping-in-journal"><BookOpen size={12} />{pt ? 'No seu diário' : 'In your journal'}</span>}
                {match.status === 'unmatched' && <span>{pt ? 'Sem correspondência nos seus vinhos' : 'No match in your wines'}</span>}
                {match.status === 'check-blend' && <span>{pt ? 'Confira a proporção de Malbec nos seus cortes' : 'Check Malbec proportions in your blends'}</span>}
                {match.status === 'unknown' && <span>{loading ? (pt ? 'Consultando seus vinhos…' : 'Checking your wines…') : (pt ? 'Correspondências indisponíveis' : 'Matches unavailable')}</span>}
              </div>
            </div>
          </div>

          <div className="shopping-wine">
            <p className="shopping-wine-meta">{pick.vintage} <span>·</span> {retailer} <span>·</span> #{pick.sku}</p>
            <h4><a href={pick.url} target="_blank" rel="noopener noreferrer">{pick.name}<ArrowUpRight size={14} /><span className="sr-only">{pt ? '(abre em nova aba)' : '(opens in a new tab)'}</span></a></h4>
            <p>{pick.reason[locale]}</p>
            {(pick.note || pick.alternatives?.length) && <details className="shopping-details"><summary>{pick.alternatives?.length ? (pt ? 'Notas e outras opções' : 'Notes & other options') : (pt ? 'Notas da seleção' : 'Selection notes')}<ChevronDown size={13} /></summary>
              <div>{pick.note && <p>{pick.note[locale]}</p>}{pick.availability === 'unavailable' && <a className="shopping-source-link" href={US_WINE_RESTRICTION_URL} target="_blank" rel="noopener noreferrer">{pt ? 'Informações da LCBO sobre produtos dos EUA' : 'LCBO update on U.S. products'}<ArrowUpRight size={12} /></a>}
                {pick.alternatives?.map(alternative => <div className="shopping-alternative" key={alternative.url}><a href={alternative.url} target="_blank" rel="noopener noreferrer">{alternative.name}<ArrowUpRight size={12} /></a><strong>{money(alternative.priceCad)}</strong><p>{alternative.note[locale]}</p></div>)}
              </div>
            </details>}
          </div>

          <div className="shopping-buy">
            <strong className="shopping-price">{money(pick.priceCad)}</strong>
            {pick.availability === 'unavailable' && <small>{pt ? 'Último preço anunciado' : 'Last listed price'}</small>}
            <span className={`shopping-availability availability-${pick.availability}`}>{pick.availability === 'unavailable' ? (pt ? 'Indisponível na pesquisa' : 'Unavailable at review') : pick.availability === 'observed-stock' ? (pt ? `${pick.observedQuantity} observadas em ${date}` : `${pick.observedQuantity} observed ${date}`) : (pt ? 'Estoque não confirmado' : 'Stock unconfirmed')}</span>
            <a className="shopping-retailer-link" href={pick.url} target="_blank" rel="noopener noreferrer">{pick.availability === 'unavailable' ? (pt ? 'Ver anúncio' : 'View listing') : (pt ? `Ver na ${retailer}` : `View at ${retailer}`)}<ArrowUpRight size={14} /><span className="sr-only">{pt ? '(abre em nova aba)' : '(opens in a new tab)'}</span></a>
          </div>
        </article>;
      })}
    </div>
    {!picks.length && <div className="essentials-empty"><ShoppingBag size={25} /><h3>{pt ? 'Explore a seleção completa.' : 'Explore the full shortlist.'}</h3><p>{pt ? 'Nenhuma sugestão corresponde a esse filtro.' : 'No suggestions match this filter.'}</p><button type="button" className="flint-button secondary" onClick={() => setScope('all')}>{pt ? 'Ver todas as sugestões' : 'Show all suggestions'}</button></div>}
    <footer className="shopping-footnote"><p>{pt ? 'As correspondências acompanham seu estoque e seu diário pessoal; a seleção de compras é uma pesquisa datada. Malbec exige uma referência liderada pela uva — cortes de proporção desconhecida pedem conferência.' : 'Matches follow your current stock and personal journal; the shopping shortlist is dated research. Malbec calls for a grape-led reference — blends with unknown proportions need a closer look.'}</p><p>{pt ? 'Nesta edição: apenas tintos. Cadastros incompletos podem não aparecer nas correspondências.' : 'This edition covers red wines. Incomplete bottle records may not appear in matches.'}</p></footer>
  </section>;
}
