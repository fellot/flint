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

export function selectWines(wines: Wine[], filters: WineFilters, readyOnly: boolean, sort: string, year: number) {
  const query = filters.search.toLocaleLowerCase().trim();
  return wines.filter(wine => {
    if (readyOnly && getMaturity(wine, year) !== 'ready') return false;
    for (const key of ['country', 'region', 'style', 'vintage', 'status'] as const) {
      if (filters[key] !== 'all' && String(wine[key]) !== filters[key]) return false;
    }
    if (filters.coravin === 'yes' && !wine.coravin) return false;
    if (filters.coravin === 'no' && wine.coravin) return false;
    return !query || [wine.bottle, wine.country, wine.region, wine.grapes, wine.foodPairingNotes, wine.mealToHaveWithThisWine, wine.notes, wine.location].some(value => (value || '').toLocaleLowerCase().includes(query));
  }).sort((a, b) => {
    if (sort === 'name') return a.bottle.localeCompare(b.bottle);
    if (sort === 'vintage') return b.vintage - a.vintage;
    if (sort === 'oldest') return a.vintage - b.vintage;
    if (sort === 'ready') return ['ready', 'soon', 'rest', 'unknown'].indexOf(getMaturity(a, year)) - ['ready', 'soon', 'rest', 'unknown'].indexOf(getMaturity(b, year));
    return 0;
  });
}
