import { JOURNAL_BADGES, type JournalBadgeDefinition } from '../data/journal-badges';
import type { Wine } from '../types/wine';
import { getEssentialJournalMatches } from './cellar-essentials';

export interface JournalBadgeAward {
  badge: JournalBadgeDefinition;
  wineId: string;
  bottle: string;
  vintage: number;
  earnedOn: string | null;
  matchingWineIds: string[];
}

const normalize = (value: string) => (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const has = (value: string, ...phrases: string[]) => phrases.some(phrase => ` ${value} `.includes(` ${normalize(phrase)} `));
const identity = (wine: Wine) => normalize(`${wine.bottle || ''} ${wine.region || ''}`);
const italian = (wine: Wine) => ['italy', 'italia'].includes(normalize(wine.country));
const french = (wine: Wine) => ['france', 'franca', 'francia'].includes(normalize(wine.country));
const red = (wine: Wine) => ['red', 'tinto', 'vinho tinto'].includes(normalize(wine.style));

function superTuscan(wine: Wine): boolean {
  if (!italian(wine) || !red(wine)) return false;
  const name = normalize(wine.bottle);
  const place = normalize(wine.region);
  // A region may legitimately say Chianti Classico for Tignanello's vineyard;
  // a bottle labeled Chianti Classico is a different appellation/wine.
  if (has(name, 'Brunello', 'Rosso di Montalcino', 'Chianti', 'Vino Nobile', 'Rosso di Montepulciano')
    || has(place, 'Brunello', 'Piedmont', 'Piemonte', 'Veneto', 'Umbria', 'Sicily', 'Sicilia', 'Abruzzo', 'Puglia')) return false;
  if (has(identity(wine), 'Super Tuscan', 'Supertuscan', 'Super Tuscans', 'Supertoscano', 'Supertoscanos')) return true;
  // Deliberately short cuvée list: a producer's name or Tuscan location alone
  // is insufficient. Sources checked 2026-09-25:
  // https://www.antinori.it/vino/tignanello-en/ (table wine from 1971)
  // https://www.visittuscany.com/en/deals/antinori-winery-visit-in-chianti-tour-tasting-e-wine-lunch-in-castle/
  // https://www.visittuscany.com/en/itineraries/bolgheri-and-castagneto-carducci-land-of-wine/
  return has(name, 'Sassicaia') || (has(name, 'Tignanello') && wine.vintage >= 1971);
}

const discoveryRules: Record<string, (wine: Wine) => boolean> = {
  'discovery:tuscany': wine => italian(wine) && (has(identity(wine), 'Tuscany', 'Tuscan', 'Toscana', 'Toscane',
    'Montalcino', 'Brunello', 'Chianti', 'Bolgheri', 'Maremma', 'Morellino di Scansano',
    'Vino Nobile di Montepulciano', 'Rosso di Montepulciano', 'Suvereto') || superTuscan(wine)),
  'discovery:bordeaux': wine => french(wine) && has(identity(wine), 'Bordeaux', 'Pauillac', 'Saint Julien',
    'St Julien', 'Margaux', 'Pessac Leognan', 'Saint Estephe', 'St Estephe', 'Medoc', 'Graves',
    'Saint Emilion', 'St Emilion', 'Pomerol', 'Fronsac', 'Sauternes', 'Barsac', 'Entre Deux Mers'),
  'discovery:super-tuscan': superTuscan,
  'discovery:loire': wine => french(wine) && has(identity(wine), 'Loire', 'Muscadet', 'Anjou', 'Saumur',
    'Chinon', 'Bourgueil', 'Touraine', 'Vouvray', 'Savennieres', 'Sancerre', 'Pouilly Fume'),
  'discovery:volcanic': wine => (italian(wine) && has(identity(wine), 'Etna'))
    || (['greece', 'grecia', 'hellas'].includes(normalize(wine.country)) && has(identity(wine), 'Santorini')),
};

function tastingTime(value: string | null): number | null {
  // Reject ambiguous dates and impossible calendar days instead of accepting
  // Date.parse's rollover (e.g. February 30) or inventing an unlock date.
  if (!value || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value)) return null;
  const day = value.slice(0, 10);
  const midnight = Date.parse(`${day}T00:00:00Z`);
  if (!Number.isFinite(midnight) || new Date(midnight).toISOString().slice(0, 10) !== day) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

const compareIds = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
function compareTastings(a: Wine, b: Wine): number {
  const first = tastingTime(a.consumedDate) ?? Infinity;
  const second = tastingTime(b.consumedDate) ?? Infinity;
  return first === second ? compareIds(a.id, b.id) : first < second ? -1 : 1;
}

/** Derive awards from this user's journal, including past and external tastings. */
export function getJournalBadgeAwards(wines: Wine[]): JournalBadgeAward[] {
  const journal = wines.filter(wine => wine.status === 'consumed' && wine.inMyJournal === true);
  return JOURNAL_BADGES.flatMap(badge => {
    const matches = badge.family === 'essential'
      ? getEssentialJournalMatches(badge.id.slice('essential:'.length), journal)
      : journal.filter(discoveryRules[badge.id]);
    if (!matches.length) return [];
    const sorted = [...matches].sort(compareTastings);
    const first = sorted[0];
    return [{
      badge,
      wineId: first.id,
      bottle: first.bottle,
      vintage: first.vintage,
      earnedOn: tastingTime(first.consumedDate) === null ? null : first.consumedDate,
      matchingWineIds: Array.from(new Set(sorted.map(wine => wine.id))),
    }];
  });
}

/** Only newly represented discoveries, never another award for a repeat bottle. */
export function getNewJournalBadgeAwards(before: Wine[], after: Wine[]): JournalBadgeAward[] {
  const earned = new Set(getJournalBadgeAwards(before).map(award => award.badge.id));
  return getJournalBadgeAwards(after).filter(award => !earned.has(award.badge.id));
}
