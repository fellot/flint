import { GRAPES, grapeName, normalizeGrapeText } from '@/data/grapes';
import type { GrapePreference, GrapeProfile, PalateEvidence, PalatePreferences, PalateProfile } from '@/types/palate';
import { WineValidationError } from './wine-data';

export const GRAPE_PREFERENCE_LIMIT = 40;
export const GRAPE_NOTE_LIMIT = 240;
export const GRAPE_LABELS = {
  love: { en: 'Love', pt: 'Adoro' }, like: { en: 'Like', pt: 'Gosto' },
  neutral: { en: 'Neutral', pt: 'Neutro' }, avoid: { en: 'Avoid', pt: 'Evitar' },
  explore: { en: 'Want to explore', pt: 'Quero explorar' },
} as const;

export function grapePreferencesInput(raw: unknown): GrapePreference[] {
  if (raw === undefined) return []; // Older rows/clients have no grape preferences.
  if (!Array.isArray(raw) || raw.length > GRAPE_PREFERENCE_LIMIT) throw new WineValidationError('Choose up to 40 grape preferences.');
  const seen = new Set<string>();
  return raw.map(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item)
      || !GRAPES.some(g => g.id === item.grapeId) || seen.has(item.grapeId)
      || typeof item.preference !== 'string' || !Object.prototype.hasOwnProperty.call(GRAPE_LABELS, item.preference)
      || typeof item.notes !== 'string' || item.notes.length > GRAPE_NOTE_LIMIT) {
      throw new WineValidationError('Choose a listed grape and a valid preference, with notes up to 240 characters.');
    }
    seen.add(item.grapeId);
    return { grapeId: item.grapeId, preference: item.preference, notes: item.notes.trim() };
  });
}

const aliases = GRAPES.flatMap(g => [g.name, ...('aliases' in g ? g.aliases : [])]
  .map(name => ({ id: g.id, name: normalizeGrapeText(name) })))
  .sort((a, b) => b.name.length - a.name.length);

export function recordedGrapes(text: string) {
  let remaining = normalizeGrapeText(text || '');
  const ids = new Set<string>();
  // Longest name first keeps Grenache Blanc distinct from Grenache. Word
  // boundaries prevent Riesling from matching Welschriesling, for example.
  for (const alias of aliases) {
    const re = new RegExp(`(^|[^a-z0-9])${alias.name}(?=$|[^a-z0-9])`, 'g');
    remaining = remaining.replace(re, (_match, prefix: string) => { ids.add(alias.id); return prefix + ' '; });
  }
  // A sole recorded variety is usable evidence, not a purity certification.
  // "90%", "dominant", "others", unknown names and field-blend descriptors
  // remain incomplete; they never turn into single-variety score evidence.
  const percentages: number[] = [];
  const remainder = remaining.replace(/\b(\d+(?:\.\d+)?)\s*%/g, (_match, value: string) => { percentages.push(Number(value)); return ''; })
    .replace(/\b(and|et|e)\b/g, '').replace(/[\s,;&+/().:]/g, '');
  const percentagesComplete = !percentages.length || (percentages.length === ids.size && Math.abs(percentages.reduce((a, b) => a + b, 0) - 100) < 0.01);
  const complete = ids.size > 0 && !remainder && percentagesComplete;
  return { ids: Array.from(ids), complete, composition: ids.size === 1 && complete ? 'single' as const : 'blend' as const };
}

export const tastingIdentity = (w: Pick<PalateEvidence, 'bottle' | 'vintage' | 'country'>) =>
  `${w.bottle}|${w.vintage}|${w.country}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9|]/g, '');

export function buildGrapeProfile(evidence: PalateEvidence[]): { grapes: GrapeProfile[]; unmappedGrapeWines: number } {
  const byGrape = new Map<string, GrapeProfile['evidence']>();
  const unmapped = new Set<string>();
  for (const tasting of evidence) {
    const composition = recordedGrapes(tasting.grapes);
    if (!composition.complete) unmapped.add(tastingIdentity(tasting));
    for (const id of composition.ids) byGrape.set(id, [...(byGrape.get(id) || []), { ...tasting, composition: composition.composition }]);
  }
  const grapes = Array.from(byGrape, ([grapeId, tastings]) => {
    const groups = new Map<string, typeof tastings>();
    tastings.forEach(t => groups.set(tastingIdentity(t), [...(groups.get(tastingIdentity(t)) || []), t]));
    const singles = Array.from(groups.values()).filter(group => group.every(t => t.composition === 'single'));
    const scores = singles.flatMap(group => {
      const ratings = group.flatMap(t => t.score === null ? [] : [t.score]);
      return ratings.length ? [ratings.reduce((a, b) => a + b, 0) / ratings.length] : [];
    });
    return { grapeId, singleWines: singles.length, blendWines: groups.size - singles.length,
      scoredSingleWines: scores.length, average: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : null,
      styles: Array.from(new Set(tastings.map(t => t.style).filter(Boolean))).sort(), evidence: tastings };
  }).sort((a, b) => b.scoredSingleWines - a.scoredSingleWines || (b.average ?? -1) - (a.average ?? -1) || grapeName(a.grapeId).localeCompare(grapeName(b.grapeId)));
  return { grapes, unmappedGrapeWines: unmapped.size };
}

export function isAvoidedGrape(wine: { grapes: string }, preferences: PalatePreferences) {
  const ids = recordedGrapes(wine.grapes).ids;
  return preferences.grape_preferences.some(p => p.preference === 'avoid' && ids.includes(p.grapeId));
}

// Bounded summaries are evidence about wines, not inferred permanent likes.
// Full journal citations are still separately validated by the AI response parser.
export function grapeContext(profile: PalateProfile) {
  return {
    stated: profile.preferences.grape_preferences.map(p => ({ ...p, grape: grapeName(p.grapeId) })),
    journal: profile.preferences.journal_enabled ? profile.grapes.slice(0, 80).map(g => ({
      grape: grapeName(g.grapeId), singleWines: g.singleWines, blendWines: g.blendWines,
      scoredSingleWines: g.scoredSingleWines, averageSingleWineScore: g.average, styles: g.styles,
    })) : [],
  };
}

export const GRAPE_CONTEXT_RULES = `grapeProfile.stated contains explicit labels and optional notes. Love/like are stated preferences, neutral is neither like nor dislike, explore expresses curiosity rather than prior enjoyment, and avoid excludes known appearances even in blends. Respect these before inferred patterns. If composition is unknown, say so; never promise an avoided grape is absent. grapeProfile.journal averages are scores of wines recorded with a single grape, not scores assigned to the grape itself. Blend appearances do not establish preference for any constituent grape. Counts refer to distinct label/vintage/country combinations, with repeat scores averaged. One scored wine is only an early clue; even repeated wines may differ in style, sweetness, region and age. Never generalize a dessert or sparkling tasting to all wines of that grape or invent sensory preferences.`;
