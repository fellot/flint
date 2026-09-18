import type { CriticRatings, Wine } from '@/types/wine';

export const critics = [
  { key: 'wine_advocate', abbreviation: 'WA', name: "Robert Parker’s Wine Advocate" },
  { key: 'james_suckling', abbreviation: 'JS', name: 'JamesSuckling.com' },
] as const;

export function parseCriticRatings(input: unknown): CriticRatings {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const result: CriticRatings = {};
  for (const { key } of critics) {
    const raw = (input as Record<string, unknown>)[key];
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const r = raw as Record<string, unknown>;
    if (typeof r.score !== 'number' || !Number.isFinite(r.score) || r.score < 0 || r.score > 100) continue;
    const kind = r.score_kind === 'range' || r.score_kind === 'plus' ? r.score_kind : 'point';
    result[key] = {
      score: r.score,
      display_score: typeof r.display_score === 'string' && r.display_score.trim() ? r.display_score : String(r.score),
      score_kind: kind,
      verification: typeof r.verification === 'string' ? r.verification : '',
      source_urls: Array.isArray(r.source_urls) ? r.source_urls.filter((url): url is string => {
        if (typeof url !== 'string') return false;
        try { return ['http:', 'https:'].includes(new URL(url).protocol); } catch { return false; }
      }) : [],
      researched_on: typeof r.researched_on === 'string' ? r.researched_on : undefined,
    };
  }
  return result;
}

export function highestCriticScore(wine: Pick<Wine, 'criticRating' | 'criticRatings'>): number | null {
  const scores = critics.flatMap(({ key }) => wine.criticRatings?.[key] ? [wine.criticRatings[key]!.score] : []);
  if (scores.length) return Math.max(...scores);
  return typeof wine.criticRating === 'number' && Number.isFinite(wine.criticRating) && wine.criticRating >= 0 && wine.criticRating <= 100 ? wine.criticRating : null;
}
