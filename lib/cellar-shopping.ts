import type { Wine } from '../types/wine';
import { getEssentialJournalMatches, getEssentialMatches } from './cellar-essentials';

export type ShoppingCoverage = {
  status: 'unknown' | 'in-cellar' | 'in-journal' | 'unmatched' | 'check-blend';
  cellarCount: number;
  journalCount: number;
};

const normalize = (value: string) => (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const words = (value: string) => normalize(value).replace(/[^a-z0-9]+/g, ' ').trim();

// The shopping goal is a Malbec-led reference, while the general essentials
// guide intentionally accepts any recorded Malbec. Keep that distinction here
// without changing the guide or guessing a blend's proportions from grape order.
function malbecComposition(wine: Wine): 'clear' | 'excluded' | 'uncertain' {
  const identity = ` ${words(`${wine.bottle} ${wine.region}`)} `;
  // The researched 2019 technical sheet specifies 85% Cabernet Franc and 15%
  // Malbec. This verified exception applies only to that wine and vintage.
  if (wine.vintage === 2019 && identity.includes(' gran enemigo ') && identity.includes(' gualtallary ')) return 'excluded';

  const declared = normalize(wine.grapes);
  if (words(declared) === 'malbec') return 'clear';

  // Support explicit percentages before or after the grape. Conflicting or
  // invalid figures stay uncertain; unquantified blends need a label check.
  const percentages = [
    ...Array.from(declared.matchAll(/(?:^|[,(;:])\s*(\d{1,3}(?:[.,]\d+)?)\s*%\s*malbec\b/g)),
    ...Array.from(declared.matchAll(/\bmalbec\s*(?:[:(]\s*)?(\d{1,3}(?:[.,]\d+)?)\s*%/g)),
  ].map(match => Number(match[1].replace(',', '.')));
  if (!percentages.length || percentages.some(value => value < 0 || value > 100 || value !== percentages[0])) return 'uncertain';
  return percentages[0] > 50 ? 'clear' : 'excluded';
}

export function getShoppingCoverage(essentialId: string, wines: Wine[], inventoryAvailable = true): ShoppingCoverage {
  // A failed or pending request cannot establish a gap, even if the caller has
  // stale wines from a previous cellar or an empty placeholder array.
  if (!inventoryAvailable) return { status: 'unknown', cellarCount: 0, journalCount: 0 };

  const cellar = getEssentialMatches(essentialId, wines);
  const journal = getEssentialJournalMatches(essentialId, wines);
  const composition = (wine: Wine) => essentialId === 'mendoza-malbec' ? malbecComposition(wine) : 'clear';
  const cellarCount = cellar.filter(wine => composition(wine) === 'clear').length;
  const journalCount = journal.filter(wine => composition(wine) === 'clear').length;
  const uncertain = [...cellar, ...journal].some(wine => composition(wine) === 'uncertain');

  return {
    status: cellarCount > 0 ? 'in-cellar' : journalCount > 0 ? 'in-journal' : uncertain ? 'check-blend' : 'unmatched',
    cellarCount,
    journalCount,
  };
}
