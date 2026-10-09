import type { ShoppingBrief, ShoppingReply, ShoppingDocumentPick } from '@/types/shopping';
import { shoppingUrl } from '@/lib/ai/shopping-advisor';
import { CELLAR_ESSENTIALS } from '@/data/cellar-essentials';

// Saved answers are historical display data, never privileged model context.
// Even an owner writing their own JSON via RPC cannot introduce executable links.
export function savedReply(value: unknown, cellarId: string): ShoppingReply | undefined {
  if (!value || typeof value !== 'object') return;
  const r = value as ShoppingReply;
  if (r.cellarId !== cellarId || typeof r.answer !== 'string' || typeof r.question !== 'string'
    || !Array.isArray(r.products) || !Array.isArray(r.sources) || !r.brief
    || !['market', 'retailers', 'budget'].every(k => typeof r.brief[k as keyof ShoppingBrief] === 'string')
    || !Number.isFinite(Date.parse(r.checkedAt))) return;
  const validProduct = (p: ShoppingReply['products'][number] | ShoppingDocumentPick) => p && typeof p === 'object'
    && CELLAR_ESSENTIALS.some(e => e.id === p.essentialId)
    && ['name', 'country', 'region', 'grapes', 'style', 'retailer', 'size', 'reason', 'evidence', 'drinkingGuidance'].every(k => typeof p[k as keyof typeof p] === 'string')
    && (p.vintage === null || Number.isInteger(p.vintage))
    && (p.price === null || typeof p.price === 'number' && Number.isFinite(p.price))
    && (p.currency === null || typeof p.currency === 'string');
  return { ...r, historyWarning: undefined,
    products: r.products.filter(p => validProduct(p) && shoppingUrl(p.url) && typeof p.availabilityNote === 'string' && ['available','unavailable','unknown'].includes(p.availability)),
    documentPicks: Array.isArray(r.documentPicks) ? r.documentPicks.filter(p => validProduct(p) && Number.isInteger(p.page) && p.page > 0) : [],
    sources: r.sources.filter(s => s && typeof s.title === 'string' && shoppingUrl(s.url)),
    documentName: typeof r.documentName === 'string' ? r.documentName : undefined,
  };
}

