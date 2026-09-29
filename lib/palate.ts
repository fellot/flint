import type { Wine } from '@/types/wine';
import type { PalateEvidence, PalatePreferences, PalateProfile } from '@/types/palate';
import { CELLAR_ESSENTIALS } from '@/data/cellar-essentials';
import { getEssentialJournalMatches, getEssentialMatches } from './cellar-essentials';
import { WineValidationError } from './wine-data';

export const DEFAULT_PALATE: PalatePreferences = {
  discovery: 'balanced', avoid_semi_sweet: false, preferences: '',
  journal_enabled: true, dismissed_patterns: [],
};

export function palateInput(raw: unknown): PalatePreferences {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new WineValidationError('Expected your palate preferences.');
  const p = raw as Record<string, unknown>;
  if (!['familiar', 'balanced', 'adventurous'].includes(String(p.discovery))
    || typeof p.avoid_semi_sweet !== 'boolean' || typeof p.journal_enabled !== 'boolean'
    || typeof p.preferences !== 'string' || p.preferences.length > 2000
    || !Array.isArray(p.dismissed_patterns) || p.dismissed_patterns.length > CELLAR_ESSENTIALS.length
    || p.dismissed_patterns.some(id => !CELLAR_ESSENTIALS.some(e => e.id === id))) {
    throw new WineValidationError('Choose valid preferences and keep your notes under 2,000 characters.');
  }
  return {
    discovery: p.discovery as PalatePreferences['discovery'], avoid_semi_sweet: p.avoid_semi_sweet,
    journal_enabled: p.journal_enabled, preferences: p.preferences.trim(),
    dismissed_patterns: Array.from(new Set(p.dismissed_patterns as string[])),
  };
}

export const tastingNotes = [
  { id: 'again', en: 'Would buy again.', pt: 'Compraria novamente.' },
  { id: 'sweet', en: 'Too sweet.', pt: 'Doce demais.' },
  { id: 'oak', en: 'Too oaky.', pt: 'Madeira demais.' },
  { id: 'young', en: 'Too young to judge.', pt: 'Jovem demais para avaliar.' },
  { id: 'faulty', en: 'Bottle seemed faulty.', pt: 'A garrafa parecia ter defeito.' },
] as const;

export function toggleTastingNote(comment: string, note: string) {
  const lines = comment.split('\n');
  return (lines.includes(note) ? lines.filter(line => line !== note).join('\n') : `${comment.trim()}\n${note}`).trim();
}

// These explicit tasting-note lines are reversible in the review editor. Avoid
// guessing whether arbitrary prose (including negations) describes a fault.
export function excludedTasting(wine: Wine) {
  const lines = (wine.myComment || '').split('\n').map(line => line.trim());
  return tastingNotes.filter(n => n.id === 'young' || n.id === 'faulty').some(n => lines.includes(n.en) || lines.includes(n.pt));
}

export function personalJournal(wines: Wine[]) {
  return wines.filter(w => w.status === 'consumed' && w.inMyJournal === true);
}
export function learningJournal(wines: Wine[], preferences: PalatePreferences) {
  if (!preferences.journal_enabled) return [];
  const own = personalJournal(wines).filter(w => !excludedTasting(w));
  const dismissed = new Set(preferences.dismissed_patterns.flatMap(id => getEssentialJournalMatches(id, own).map(w => w.id)));
  return own.filter(w => !dismissed.has(w.id));
}
const hasScore = (w: Wine): w is Wine & { myRating: number } => typeof w.myRating === 'number' && Number.isInteger(w.myRating) && w.myRating >= 0 && w.myRating <= 100;
const mean = (wines: (Wine & { myRating: number })[]) => wines.reduce((sum, w) => sum + w.myRating, 0) / wines.length;
const rounded = (n: number) => Math.round(n * 10) / 10;
export const evidenceFor = (w: Wine): PalateEvidence => ({
  id: w.id, bottle: w.bottle, vintage: w.vintage, score: hasScore(w) ? w.myRating : null,
  comment: (w.myComment || '').slice(0, 1200), style: w.style, grapes: w.grapes,
  region: w.region, country: w.country,
});
const identity = (w: Wine) => `${w.bottle}|${w.vintage}|${w.country}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9|]/g, '');
function distinctScores(wines: Wine[]) {
  // One vote per label/vintage; repeated bottles don't inflate confidence.
  const groups = new Map<string, (Wine & { myRating: number })[]>();
  wines.filter(hasScore).forEach(w => groups.set(identity(w), [...(groups.get(identity(w)) || []), w]));
  return Array.from(groups.values()).map(group => ({ ...group[0], myRating: mean(group) }));
}

export function buildPalate(wines: Wine[], preferences: PalatePreferences): PalateProfile {
  const journal = personalJournal(wines);
  const usable = journal.filter(w => !excludedTasting(w));
  const scored = distinctScores(usable);
  const average = scored.length ? mean(scored) : null;
  const patterns = CELLAR_ESSENTIALS.flatMap(essential => {
    const matches = getEssentialJournalMatches(essential.id, usable).filter(hasScore);
    const distinct = distinctScores(matches);
    if (!distinct.length || average === null || mean(distinct) < average + 1) return [];
    return [{
      id: essential.id, name: essential.name, average: rounded(mean(distinct)), distinctWines: distinct.length,
      confidence: distinct.length >= 5 ? 'established' as const : distinct.length >= 2 ? 'emerging' as const : 'early' as const,
      evidence: matches.map(evidenceFor), dismissed: preferences.dismissed_patterns.includes(essential.id),
    }];
  }).sort((a, b) => b.distinctWines - a.distinctWines || b.average - a.average);
  return { preferences, journalCount: journal.length, scoredCount: journal.filter(hasScore).length,
    excludedCount: journal.length - usable.length, average: average === null ? null : rounded(average), patterns };
}

// Only a recorded sweetness descriptor can exclude stock. Never assume every
// Riesling is semi-sweet, or classify fully sweet dessert wines as semi-sweet.
export function isRecordedSemiSweet(wine: Wine) {
  return /\b(semi[ -]?sweet|off[ -]?dry|demi[ -]?sec|demi[ -]?seco|meio[ -]?seco|semi[ -]?seco|halbtrocken|feinherb|amabile)\b/i
    .test(`${wine.bottle} ${wine.style}`);
}

export function tasteAffinity(wine: Wine, profile: PalateProfile) {
  if (!profile.preferences.journal_enabled) return 0;
  return profile.patterns.filter(p => !p.dismissed && p.distinctWines >= 2 && getEssentialMatches(p.id, [wine]).length)
    .reduce((score, p) => Math.max(score, p.average - (profile.average ?? p.average)), 0);
}
