import type { Wine } from '@/types/wine';
import { normalizeCountry, normalizePlace, resolveWineOrigin, type WineOrigin } from '@/utils/regionCoordinates';

export type MapScope = 'all' | 'cellar' | 'journal';
export type MapWine = { wine: Wine; origin: WineOrigin | null };
export type MapGroup = { key: string; lat: number; lng: number; entries: MapWine[] };

export function selectMapWines(wines: Wine[], scope: MapScope = 'all', search = '') {
  const query = normalizePlace(search);
  return wines.filter(wine => {
    const stocked = wine.status === 'in_cellar' && wine.quantity > 0;
    const journal = wine.status === 'consumed' && wine.inMyJournal === true;
    return (scope === 'cellar' ? stocked : scope === 'journal' ? journal : stocked || journal)
      && (!query || normalizePlace(`${wine.bottle} ${wine.vintage || ''} ${wine.country} ${normalizeCountry(wine.country)} ${wine.region} ${wine.grapes} ${wine.style}`).includes(query));
  });
}

export function buildWineMap(wines: Wine[]) {
  const entries: MapWine[] = wines.map(wine => ({ wine, origin: resolveWineOrigin(wine.country, wine.region) }));
  const groups = new Map<string, MapGroup>();
  for (const entry of entries) {
    if (!entry.origin) continue;
    const { lat, lng } = entry.origin;
    // Combine co-located origins, especially country fallbacks, so no marker hides another.
    const key = `${lat},${lng}`;
    const group = groups.get(key) || { key, lat, lng, entries: [] };
    group.entries.push(entry); groups.set(key, group);
  }
  return { entries, groups: Array.from(groups.values()),
    unmapped: entries.filter(e => !e.origin),
    approximate: entries.filter(e => e.origin?.precision === 'country').length,
    countries: new Set(wines.map(w => normalizeCountry(w.country)).filter(Boolean)).size,
    bottles: wines.filter(w => w.status === 'in_cellar').reduce((n, w) => n + w.quantity, 0),
    journal: wines.filter(w => w.status === 'consumed').length,
  };
}
