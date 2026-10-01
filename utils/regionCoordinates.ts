// Approximate regional anchors for orientation, never winery or vineyard GPS.
// Coordinates are derived from country/region text; they are not stored on wines.

export interface Coordinates {
  lat: number;
  lng: number;
}

// Normalize Portuguese/Spanish country names to English
const COUNTRY_ALIASES: Record<string, string> = {
  'França': 'France',
  'Espanha': 'Spain',
  'Itália': 'Italy',
  'Brasil': 'Brazil',
  'Uruguai': 'Uruguay',
  'Alemanha': 'Germany',
  'Áustria': 'Austria',
  'África do Sul': 'South Africa',
  'Estados Unidos': 'United States',
  'Canadá': 'Canada',
  'Croácia': 'Croatia', 'Hrvatska': 'Croatia', 'Líbano': 'Lebanon',
  'Nova Zelândia': 'New Zealand', 'Grécia': 'Greece', 'Hungria': 'Hungary',
  'USA': 'United States', 'US': 'United States', 'U.S.A.': 'United States',
  'United States of America': 'United States', 'España': 'Spain', 'Italia': 'Italy',
  'Deutschland': 'Germany', 'Österreich': 'Austria',
};

export const normalizePlace = (value: string) => (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function normalizeCountry(country: string): string {
  const key = normalizePlace(country);
  const alias = Object.entries(COUNTRY_ALIASES).find(([name]) => normalizePlace(name) === key);
  return alias?.[1] || [...Object.keys(COUNTRY_CENTROIDS), ...Object.values(COUNTRY_ALIASES)].find(name => normalizePlace(name) === key) || (country || '').trim();
}

// Broad country anchors as explicit fallbacks, not exact geographic centroids.
const COUNTRY_CENTROIDS: Record<string, Coordinates> = {
  'France': { lat: 46.6, lng: 2.2 },
  'Italy': { lat: 42.5, lng: 12.5 },
  'Spain': { lat: 40.0, lng: -3.7 },
  'Portugal': { lat: 39.5, lng: -8.0 },
  'Germany': { lat: 51.2, lng: 10.4 },
  'Austria': { lat: 47.5, lng: 14.5 },
  'Argentina': { lat: -34.6, lng: -58.4 },
  'Chile': { lat: -33.4, lng: -70.6 },
  'United States': { lat: 38.0, lng: -97.0 },
  'Australia': { lat: -25.3, lng: 133.8 },
  'South Africa': { lat: -30.6, lng: 22.9 },
  'Brazil': { lat: -15.8, lng: -47.9 },
  'Uruguay': { lat: -34.9, lng: -56.2 },
  'Canada': { lat: 56.1, lng: -106.3 },
};

// Region-specific coordinates
const REGION_COORDINATES: Record<string, Coordinates> = {
  // France
  // Added anchors: see docs/wine-map.md for geographic sources.
  'France|Bordeaux': { lat: 44.84, lng: -0.58 },
  'France|Beaujolais': { lat: 46.19, lng: 4.73 },
  'France|Chablis': { lat: 47.81, lng: 3.80 },
  'Croatia|Motovun, Istria': { lat: 45.34, lng: 13.83 },
  'Lebanon|Bekaa Valley': { lat: 33.83, lng: 36.00 },
  'France|Champagne': { lat: 49.05, lng: 3.95 },
  'France|Champagne (Dizy)': { lat: 49.07, lng: 3.95 },
  'France|Champagne (Reims)': { lat: 49.25, lng: 3.88 },
  'France|Burgundy (Corton)': { lat: 47.08, lng: 4.86 },
  'France|Northern Rhône': { lat: 45.15, lng: 4.83 },
  'France|Châteauneuf-du-Pape': { lat: 44.06, lng: 4.83 },
  'France|Bordeaux (Haut-Médoc)': { lat: 45.1, lng: -0.75 },
  'France|Bordeaux – Médoc': { lat: 45.2, lng: -0.9 },
  'France|Bordeaux – Haut-Médoc': { lat: 45.1, lng: -0.75 },
  'France|Bordeaux (Entre-Deux-Mers area)': { lat: 44.75, lng: -0.2 },
  'France|Sauternes': { lat: 44.53, lng: -0.34 },
  'France|Vouvray (Loire)': { lat: 47.37, lng: 0.8 },
  'France|Savennières (Loire)': { lat: 47.38, lng: -0.64 },
  'France|Sancerre (Loire)': { lat: 47.33, lng: 2.84 },
  'France|Anjou (Loire)': { lat: 47.47, lng: -0.56 },
  'France|Beaujolais (Moulin-à-Vent, Saône-et-Loire)': { lat: 46.19, lng: 4.73 },

  // Italy
  'Italy|Piedmont': { lat: 44.7, lng: 8.03 },
  'Italy|Piedmont (Nizza DOCG)': { lat: 44.77, lng: 8.36 },
  'Italy|Piedmont (Langhe)': { lat: 44.6, lng: 8.0 },
  'Italy|Tuscany': { lat: 43.35, lng: 11.3 },
  'Italy|Tuscany (Brunello)': { lat: 43.06, lng: 11.49 },
  'Italy|Tuscany (Chianti Classico)': { lat: 43.47, lng: 11.25 },
  'Italy|Tuscany (Toscana IGT)': { lat: 43.35, lng: 11.3 },
  'Italy|Umbria': { lat: 42.71, lng: 12.39 },
  'Italy|Veneto': { lat: 45.44, lng: 11.0 },
  'Italy|Lombardy (Valtellina)': { lat: 46.17, lng: 9.87 },
  'Italy|Alto Adige (Valle Isarco)': { lat: 46.73, lng: 11.35 },
  'Italy|Friuli': { lat: 46.07, lng: 13.23 },
  'Italy|Abruzzo': { lat: 42.35, lng: 13.39 },
  'Italy|Puglia': { lat: 41.13, lng: 16.87 },
  'Italy|Apulia (Puglia) – Salento IGT, Nardò (Lecce)': { lat: 40.18, lng: 18.03 },

  // Spain
  'Spain|Rioja': { lat: 42.46, lng: -2.45 },
  'Spain|Ribera del Duero': { lat: 41.65, lng: -3.7 },
  'Spain|Priorat (Catalonia)': { lat: 41.2, lng: 0.75 },
  'Spain|Alicante': { lat: 38.35, lng: -0.48 },
  'Spain|Jumilla': { lat: 38.47, lng: -1.33 },

  // Portugal
  'Portugal|Douro': { lat: 41.16, lng: -7.79 },
  'Portugal|Douro (Porto)': { lat: 41.14, lng: -8.61 },
  'Portugal|Dão': { lat: 40.52, lng: -7.9 },
  'Portugal|Alentejo': { lat: 38.57, lng: -7.91 },
  'Portugal|Setúbal': { lat: 38.52, lng: -8.89 },
  'Portugal|Lisboa': { lat: 38.72, lng: -9.14 },
  'Portugal|Lisbon region': { lat: 38.72, lng: -9.14 },
  'Portugal|Madeira': { lat: 32.65, lng: -16.91 },

  // Germany
  'Germany|Mosel': { lat: 49.97, lng: 6.6 },

  // Austria
  'Austria|Niederösterreich (Lenzmark)': { lat: 48.3, lng: 15.77 },

  // Argentina
  'Argentina|Mendoza': { lat: -33.0, lng: -68.5 },
  'Argentina|Uco Valley (Mendoza)': { lat: -33.68, lng: -69.25 },
  'Argentina|Agrelo, Luján de Cuyo (Mendoza)': { lat: -33.1, lng: -68.55 },
  'Argentina|Valle de Uco, Mendoza': { lat: -33.68, lng: -69.25 },

  // Chile
  'Chile|Maipo Valley': { lat: -33.7, lng: -70.7 },
  'Chile|Maule Valley': { lat: -35.5, lng: -71.5 },
  'Chile|Colchagua Valley': { lat: -34.6, lng: -71.2 },
  'Chile|Cachapoal Valley': { lat: -34.17, lng: -70.72 },
  'Chile|Alto Totihue, D.O. Cachapoal Valley': { lat: -34.17, lng: -70.72 },
  'Chile|Itata Valley': { lat: -36.63, lng: -72.4 },
  'Chile|Valle de Curicó': { lat: -35.0, lng: -71.24 },
  'Chile|Puente Alto': { lat: -33.6, lng: -70.58 },
  'Chile|Apalta': { lat: -34.62, lng: -71.22 },

  // United States
  'United States|California (Paso Robles)': { lat: 35.63, lng: -120.69 },

  // Australia
  'Australia|Barossa Valley': { lat: -34.56, lng: 138.95 },

  // Brazil
  'Brazil|Serra da Mantiqueira (Sul de Minas Gerais)': { lat: -22.3, lng: -44.9 },
  'Brazil|Minas Gerais': { lat: -19.92, lng: -43.94 },
  'Brazil|Campanha Gaúcha': { lat: -31.33, lng: -54.1 },
  'Brazil|Vale dos Vinhedos': { lat: -29.17, lng: -51.33 },

  // Canada
  'Canada|Ontario (VQA Twenty Mile Bench, Niagara Peninsula)': { lat: 43.15, lng: -79.4 },
  'Canada|Niagara-on-the-Lake': { lat: 43.25, lng: -79.07 },

  // Uruguay
  'Uruguay|Canelones': { lat: -34.52, lng: -56.28 },

  // South Africa
  'South Africa|Franschhoek': { lat: -33.87, lng: 19.12 },
};

// Explicit alternative names; longest whole-phrase match wins within a country.
// No unrestricted substring guesses (e.g. “Bordeaux-style” outside Bordeaux).
const REGION_ALIASES: Record<string, string[]> = {
  'France|Burgundy (Corton)': ['Corton'],
  'France|Northern Rhône': ['Northern Rhone', 'Rhone Nord', 'Crozes Hermitage', 'Hermitage', 'Cornas', 'Cote Rotie'],
  'France|Châteauneuf-du-Pape': ['Chateauneuf du Pape'],
  'France|Bordeaux (Haut-Médoc)': ['Haut Medoc'],
  'France|Bordeaux – Médoc': ['Medoc', 'Pauillac'],
  'France|Beaujolais': ['Beaujolais', 'Morgon'],
  'France|Vouvray (Loire)': ['Vouvray'],
  'France|Savennières (Loire)': ['Savennieres'],
  'France|Sancerre (Loire)': ['Sancerre'],
  'France|Anjou (Loire)': ['Anjou'],
  'France|Beaujolais (Moulin-à-Vent, Saône-et-Loire)': ['Moulin a Vent'],
  'Italy|Piedmont': ['Piemonte', 'Piedmont'],
  'Italy|Piedmont (Langhe)': ['Langhe', 'Barolo', 'Barbaresco'],
  'Italy|Tuscany': ['Tuscany', 'Toscana'],
  'Italy|Tuscany (Brunello)': ['Brunello', 'Montalcino'],
  'Italy|Tuscany (Chianti Classico)': ['Chianti Classico'],
  'Italy|Lombardy (Valtellina)': ['Valtellina'],
  'Italy|Alto Adige (Valle Isarco)': ['Valle Isarco'],
  'Spain|Priorat (Catalonia)': ['Priorat', 'Priorato'],
  'Portugal|Lisboa': ['Lisbon', 'Lisboa'],
  'Argentina|Uco Valley (Mendoza)': ['Uco Valley', 'Valle de Uco'],
  'Argentina|Agrelo, Luján de Cuyo (Mendoza)': ['Agrelo', 'Lujan de Cuyo'],
  'Chile|Maipo Valley': ['Maipo'], 'Chile|Maule Valley': ['Maule'],
  'Chile|Colchagua Valley': ['Colchagua'], 'Chile|Cachapoal Valley': ['Cachapoal'],
  'United States|California (Paso Robles)': ['Paso Robles'],
  'Australia|Barossa Valley': ['Barossa'],
  'Brazil|Serra da Mantiqueira (Sul de Minas Gerais)': ['Serra da Mantiqueira', 'Sul de Minas Gerais'],
  'Canada|Ontario (VQA Twenty Mile Bench, Niagara Peninsula)': ['Twenty Mile Bench', 'Niagara Peninsula'],
  'Canada|Niagara-on-the-Lake': ['Niagara on the Lake'],
  'Croatia|Motovun, Istria': ['Motovun', 'Istria', 'Istra'],
  'Lebanon|Bekaa Valley': ['Bekaa', 'Beqaa', 'Bekaa Valley'],
};

export type WineOrigin = Coordinates & { precision: 'region' | 'country'; country: string; label: string };

export function resolveWineOrigin(country: string, region: string): WineOrigin | null {
  const normalized = normalizeCountry(country), place = normalizePlace(region);
  const entries = Object.entries(REGION_COORDINATES).filter(([key]) => normalizePlace(key.split('|')[0]) === normalizePlace(normalized));
  const result = (entry: [string, Coordinates]): WineOrigin => ({ ...entry[1], precision: 'region', country: entry[0].split('|')[0], label: entry[0].split('|')[1] });
  // Uncertainty or a stylistic comparison is not a geographic origin.
  if (place && !/\b(likely|unknown|uncertain|possibly|style|desconhecid[oa]|provavel)\b/.test(place)) {
    const exact = entries.find(([key]) => normalizePlace(key.split('|')[1]) === place);
    if (exact) return result(exact);
    const matches = entries.flatMap(entry => [entry[0].split('|')[1], ...(REGION_ALIASES[entry[0]] || [])]
      .map(normalizePlace).filter(alias => alias && ` ${place} `.includes(` ${alias} `))
      .map(alias => ({ entry, length: alias.length })));
    matches.sort((a, b) => b.length - a.length);
    if (matches.length) return result(matches[0].entry);
  }
  const fallback = COUNTRY_CENTROIDS[normalized];
  return fallback ? { ...fallback, country: normalized, precision: 'country', label: normalized } : null;
}

export function getCoordinates(country: string, region: string): Coordinates | null {
  const point = resolveWineOrigin(country, region);
  return point ? { lat: point.lat, lng: point.lng } : null;
}
