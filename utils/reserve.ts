import type { Wine } from '@/types/wine';
import { getMaturity } from './cellar';
import { highestCriticScore } from './critic-ratings';

export type ReserveMode = 'explore' | 'ready' | 'critics';

export function reservePicks(wines: Wine[], mode: ReserveMode, year: number): Wine[] {
  const available = wines.filter(wine => wine.status === 'in_cellar' && wine.quantity > 0);
  if (mode === 'critics') return available.filter(wine => highestCriticScore(wine) !== null)
    .sort((a, b) => highestCriticScore(b)! - highestCriticScore(a)! || a.bottle.localeCompare(b.bottle));
  return available.filter(wine => mode !== 'ready' || getMaturity(wine, year) === 'ready')
    .sort((a, b) => Number(getMaturity(b, year) === 'ready') - Number(getMaturity(a, year) === 'ready')
      || (a.vintage || Infinity) - (b.vintage || Infinity) || a.bottle.localeCompare(b.bottle));
}
