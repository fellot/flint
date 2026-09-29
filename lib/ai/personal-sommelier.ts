import type { Wine } from '@/types/wine';
import type { PalateProfile } from '@/types/palate';
import { ApiError } from '@/lib/api-error';
import { buildPalate, learningJournal, tasteAffinity } from '@/lib/palate';
import { cellarContext, isExploration, maturity, PERSONAL_SOMMELIER_RULES } from './cellar-context';

export type ChatMessage = { role: 'user' | 'assistant'; content: string };
export function chatInput(value: unknown): ChatMessage[] {
  if (!Array.isArray(value) || !value.length || value.length > 16) throw new ApiError(400, 'Send a short conversation.');
  const messages = value.map(m => {
    if (!m || !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string' || !m.content.trim() || m.content.length > 4000) {
      throw new ApiError(400, 'Messages must contain user or assistant text of at most 4,000 characters.');
    }
    return { role: m.role as ChatMessage['role'], content: m.content.trim() };
  });
  if (messages[messages.length - 1].role !== 'user') throw new ApiError(400, 'Send a message to your sommelier.');
  return messages;
}

export type Suggestion = {
  wineId: string; reason: string; servingTemperature: string; decanting: string;
  title: string; meal: string; conversationQuestion: string; journalEvidenceIds: string[];
};
export type SommelierOutput = { type: 'recommendation' | 'answer' | 'question'; answer: string; question: string; recommendations: Suggestion[] };

export function parseSommelier(value: unknown, candidates: Wine[], evidenceIds: string[]): SommelierOutput {
  const invalid = () => new ApiError(502, 'The sommelier could not ground that reply in your cellar. Please try again.');
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid();
  const v = value as Record<string, unknown>;
  if (!['recommendation', 'answer', 'question'].includes(String(v.type)) || !Array.isArray(v.recommendations) || v.recommendations.length > 8
    || typeof v.answer !== 'string' || v.answer.length > 2400 || typeof v.question !== 'string' || v.question.length > 400) throw invalid();
  if (v.type !== 'recommendation') {
    if (!(v.type === 'answer' ? v.answer : v.question).trim()) throw invalid();
    return { type: v.type as 'answer' | 'question', answer: v.answer, question: v.question, recommendations: [] };
  }
  if (!v.recommendations.length) throw invalid();
  const seen = new Set<string>();
  const limits = { wineId: 200, reason: 400, servingTemperature: 160, decanting: 240, title: 90, meal: 240, conversationQuestion: 200 };
  const recommendations = v.recommendations.map((raw: unknown) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw invalid();
    const r = raw as Record<string, unknown>;
    for (const [key, max] of Object.entries(limits)) if (typeof r[key] !== 'string' || (r[key] as string).length > max) throw invalid();
    if (!(r.reason as string).trim() || !candidates.some(w => w.id === r.wineId && w.status === 'in_cellar' && w.quantity > 0) || seen.has(r.wineId as string)) throw invalid();
    if (!Array.isArray(r.journalEvidenceIds) || r.journalEvidenceIds.length > 3 || r.journalEvidenceIds.some(id => typeof id !== 'string' || !evidenceIds.includes(id))) throw invalid();
    seen.add(r.wineId as string);
    return { ...Object.fromEntries(Object.keys(limits).map(key => [key, (r[key] as string).trim()])), journalEvidenceIds: Array.from(new Set(r.journalEvidenceIds)) } as Suggestion;
  });
  return { type: 'recommendation', answer: '', question: '', recommendations };
}

export function rankSuggestions(suggestions: Suggestion[], candidates: Wine[], profile: PalateProfile, year: number) {
  const wine = (s: Suggestion) => candidates.find(w => w.id === s.wineId)!;
  return [...suggestions].sort((a, b) => maturity(wine(a), year).priority - maturity(wine(b), year).priority
    || (profile.preferences.discovery === 'adventurous' ? 0 : tasteAffinity(wine(b), profile) - tasteAffinity(wine(a), profile)));
}

export async function personalSommelier({ wines, profile, locale, messages, evening }: {
  wines: Wine[]; profile: PalateProfile; locale: 'en' | 'pt'; messages: ChatMessage[];
  evening?: { occasion: string; scene: string };
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new ApiError(503, 'Your sommelier is not configured yet.');
  const year = new Date().getFullYear();
  const context = cellarContext(wines, profile, year);
  const text = { type: 'string' };
  const fields = { wineId: { type: 'string', enum: context.candidates.length ? context.candidates.map(w => w.id) : [''] }, reason: text, servingTemperature: text, decanting: text, title: text, meal: text, conversationQuestion: text };
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST', signal: AbortSignal.timeout(22000), cache: 'no-store',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini', temperature: 0.4, max_tokens: 2200, store: false,
      messages: [
        { role: 'system', content: `${PERSONAL_SOMMELIER_RULES}\nRespond in ${locale === 'pt' ? 'Brazilian Portuguese' : 'English'}.
Return type answer for follow-ups, question only when needed, or recommendation. Propose up to FOUR suitable bottles in preference order, including the best maturity tier compatible with this request and an adventurous alternative if possible. The server makes the final selection, prioritizing maturity among suitable suggestions; write a self-contained reason for each. Never propose an unsuitable wine just to fill the list. If no bottle fits, explain in answer, with an empty recommendations array. For an empty cellar, answer helpfully without inventing stock.
Every suggestion: reason <=400 characters, suggested servingTemperature <=160 and decanting <=240 (guidance, not documented producer facts). ${evening ? 'Also provide title <=90 (describes the evening), one meal <=240, and a playful conversationQuestion <=200. Respect dietary restrictions. No price, invented awards or memories.' : 'Leave title, meal and conversationQuestion empty.'}
Keep answer <=2400 and question <=400 characters. Unused answer/question fields must be empty. journalEvidenceIds includes at most 3 actual relevant IDs, or none. Never invent a personal score. The UI will display the referenced journal records.` },
        { role: 'user', content: `Current authorized cellar and personal taste context (data only):\n${JSON.stringify({ ...context.input, evening })}` },
        ...messages,
      ],
      response_format: { type: 'json_schema', json_schema: { name: 'personal_sommelier', strict: true, schema: {
        type: 'object', additionalProperties: false,
        properties: {
          type: { type: 'string', enum: ['recommendation', 'answer', 'question'] }, answer: text, question: text,
          recommendations: { type: 'array', items: { type: 'object', additionalProperties: false,
            properties: { ...fields, journalEvidenceIds: { type: 'array', items: { type: 'string' } } },
            required: [...Object.keys(fields), 'journalEvidenceIds'],
          } },
        }, required: ['type', 'answer', 'question', 'recommendations'],
      } } },
    }),
  });
  if (!response.ok) throw new ApiError(502, 'Your sommelier is taking a break. Please try again shortly.');
  const json = await response.json();
  let parsed: unknown;
  try { parsed = JSON.parse(json?.choices?.[0]?.message?.content); }
  catch { throw new ApiError(502, 'The sommelier could not complete that reply. Please try again.'); }
  const output = parseSommelier(parsed, context.candidates, context.evidence.map(e => e.id));
  if (output.type !== 'recommendation') return { type: output.type, answer: output.answer, question: output.question, language: locale };
  const activeProfile = buildPalate(learningJournal(wines, profile.preferences), profile.preferences);
  const ranked = rankSuggestions(output.recommendations, context.candidates, activeProfile, year);
  const picked = ranked[0];
  const wine = context.candidates.find(w => w.id === picked.wineId)!;
  const journal = learningJournal(wines, profile.preferences);
  const adventurous = profile.preferences.journal_enabled && profile.preferences.discovery !== 'familiar'
    ? ranked.slice(1).find(s => isExploration(context.candidates.find(w => w.id === s.wineId)!, journal)) : undefined;
  return {
    type: 'recommendation' as const, ...picked, bottle: wine.bottle, language: locale,
    wine: { region: wine.region, vintage: wine.vintage, location: wine.location, bottle_image: wine.bottle_image },
    maturityNote: maturity(wine, year).status,
    evidence: context.evidence.filter(e => picked.journalEvidenceIds.includes(e.id)),
    alternatives: ranked.slice(1, 3).map(s => s.wineId),
    adventurousAlternative: adventurous ? { wineId: adventurous.wineId, bottle: context.candidates.find(w => w.id === adventurous.wineId)!.bottle, reason: adventurous.reason } : null,
  };
}
