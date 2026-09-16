import type { Wine, WineFilters } from '@/types/wine';

export type Maturity = 'ready' | 'soon' | 'rest' | 'unknown';
export function getMaturity(wine: Wine, year = new Date().getFullYear()): Maturity {
  const note = String(wine.peakYear || '');
  if (/past peak|passou.*pico/i.test(note)) return 'ready';
  const windowYears = (wine.drinkingWindow || '').match(/\b(?:19|20|21)\d{2}\b/g)?.map(Number) || [];
  if (windowYears.length >= 2) {
    if (year >= windowYears[0]) return 'ready';
    return windowYears[0] <= year + 2 ? 'soon' : 'rest';
  }
  const peak = /^\d{4}\+?$/.test(note) ? Number(note.replace('+', '')) : 0;
  if (!peak) return 'unknown';
  if (peak <= year) return 'ready';
  return peak <= year + 2 ? 'soon' : 'rest';
}

export function styleFamily(style: string) {
  const value = style.toLowerCase();
  if (/spark|champagne|prosecco|espumante/.test(value)) return 'sparkling';
  if (/rosé|rose|rosado/.test(value)) return 'rose';
  if (/white|branco/.test(value)) return 'white';
  if (/sweet|dessert|fortified|port|sherry|doce/.test(value)) return 'sweet';
  if (/orange|laranja/.test(value)) return 'orange';
  return 'red';
}

export type WineSortKey = 'name' | 'country' | 'style' | 'vintage' | 'window' | 'peak' | 'quantity' | 'rating' | 'myRating' | 'myComment' | 'participants' | 'location' | 'status' | 'consumed' | 'ready';
export type WineSort = { key: WineSortKey; direction: 'asc' | 'desc' };

function sortValue(wine: Wine, key: WineSortKey, year: number): string | number | null {
  switch (key) {
    case 'name': return wine.bottle;
    case 'vintage': return wine.vintage || null;
    case 'window': return Number(wine.drinkingWindow?.match(/\b(?:19|20|21)\d{2}\b/)?.[0]) || null;
    case 'peak': {
      const value = String(wine.peakYear || '');
      if (/past peak|passou.*pico/i.test(value)) return 0;
      return Number(value.match(/\b(?:19|20|21)\d{2}\b/)?.[0]) || null;
    }
    case 'participants': return wine.participants?.map(person => person.name).join(', ') || null;
    case 'consumed': return wine.consumedDate || null;
    case 'ready': return ['ready', 'soon', 'rest', 'unknown'].indexOf(getMaturity(wine, year));
    default: return wine[key] ?? null;
  }
}

export function selectWines(wines: Wine[], filters: WineFilters, readyOnly: boolean, sort: WineSort, year: number) {
  const query = filters.search.toLocaleLowerCase().trim();
  return wines.filter(wine => {
    if (readyOnly && getMaturity(wine, year) !== 'ready') return false;
    for (const key of ['country', 'region', 'style', 'vintage', 'status'] as const) {
      if (filters[key] !== 'all' && String(wine[key]) !== filters[key]) return false;
    }
    if (filters.coravin === 'yes' && !wine.coravin) return false;
    if (filters.coravin === 'no' && wine.coravin) return false;
    return !query || [wine.bottle, wine.country, wine.region, wine.grapes, wine.foodPairingNotes, wine.mealToHaveWithThisWine, wine.notes, wine.myComment || '', wine.location].some(value => (value || '').toLocaleLowerCase().includes(query));
  }).sort((a, b) => {
    const aValue = sortValue(a, sort.key, year);
    const bValue = sortValue(b, sort.key, year);
    // Keep missing dates, vintages and ratings at the end in either direction.
    if (aValue === null || aValue === '') return bValue === null || bValue === '' ? 0 : 1;
    if (bValue === null || bValue === '') return -1;
    const comparison = typeof aValue === 'number' && typeof bValue === 'number'
      ? aValue - bValue
      : String(aValue).localeCompare(String(bValue), undefined, { numeric: true, sensitivity: 'base' });
    return (sort.direction === 'asc' ? comparison : -comparison) || a.bottle.localeCompare(b.bottle);
  });
}
