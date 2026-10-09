import type { GuideCategory, GuideTier, LocalizedText } from '@/data/cellar-essentials';

export type ShoppingBrief = { market: string; retailers: string; budget: string };
export type ShoppingGap = {
  id: string; name: LocalizedText; category: GuideCategory; tier: GuideTier;
  status: 'covered' | 'explore' | 'restock' | 'review'; cellarCount: number; journalCount: number;
};
export type ShoppingMessage = { role: 'user'; content: string };
export type ShoppingAttachment = { name: string; data: string };
export type ShoppingProduct = {
  essentialId: string; name: string; vintage: number | null;
  country: string; region: string; grapes: string; style: string;
  retailer: string; url: string; price: number | null; currency: string | null; size: string;
  availability: 'available' | 'unavailable' | 'unknown'; availabilityNote: string;
  reason: string; drinkingGuidance: string; evidence: string;
};
export type ShoppingReply = {
  cellarId: string; cellarName: string; answer: string; question: string;
  brief: ShoppingBrief; products: ShoppingProduct[];
  sources: { url: string; title: string }[]; searched: boolean; checkedAt: string;
  omitted: number;
  documentPicks?: ShoppingDocumentPick[];
  documentName?: string;
  historyWarning?: string;
};
export type ShoppingDocumentPick = Omit<ShoppingProduct, 'url' | 'availability' | 'availabilityNote'> & { page: number };

export type ShoppingConversationSummary = {
  id: string; title: string; createdAt: string; updatedAt: string; revision: number;
};
export type ShoppingSavedTurn = {
  id: string; user: string; attachmentName?: string; reply?: ShoppingReply;
  error?: string; status: 'pending' | 'completed' | 'failed'; createdAt: string;
};
export type ShoppingConversation = {
  conversation: ShoppingConversationSummary; brief: ShoppingBrief;
  turns: ShoppingSavedTurn[]; hasOlder: boolean; nextOffset: number;
};
