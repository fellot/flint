import { ApiError } from '@/lib/api-error';
import type { ShoppingBrief, ShoppingConversationSummary } from '@/types/shopping';

export const BUYER_HISTORY_MIGRATION = '20261009000000_buyer_conversations.sql';
export const HISTORY_PAGE_SIZE = 20;
export const isUuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export type BuyerConversationRow = {
  id: string; cellar_id: string; user_id: string; title: string; brief: ShoppingBrief;
  revision: number; created_at: string; updated_at: string;
};
export type BuyerTurnRow = {
  id: string; conversation_id: string; ordinal: number; user_message: string;
  attachment_name: string | null; reply: unknown; error_text: string | null;
  status: 'pending' | 'completed' | 'failed'; created_at: string;
};
export function conversationSummary(row: BuyerConversationRow): ShoppingConversationSummary {
  return { id: row.id, title: row.title, revision: row.revision, createdAt: row.created_at, updatedAt: row.updated_at };
}
export function historyInput(body: Record<string, unknown>) {
  if (body.conversationId === undefined) return null;
  if (!isUuid(body.conversationId) || !isUuid(body.turnId) || !Number.isInteger(body.revision) || Number(body.revision) < 0) {
    throw new ApiError(400, 'Choose a valid conversation or start a new one.');
  }
  return { conversationId: body.conversationId, turnId: body.turnId, revision: Number(body.revision) };
}
export function historyOffset(value: string | null) {
  if (value === null) return 0;
  if (!/^\d{1,6}$/.test(value)) throw new ApiError(400, 'Invalid history page.');
  return Number(value);
}
export function checkHistoryStorage(error: { code?: string; message?: string } | null) {
  if (!error) return;
  if (['42P01', '42703', '42883', 'PGRST202', 'PGRST204', 'PGRST205'].includes(error.code || '')) {
    throw new ApiError(503, `Saved conversations need a database update. Run ${BUYER_HISTORY_MIGRATION} in Supabase SQL Editor.`);
  }
  if (['P0002', '42501'].includes(error.code || '')) throw new ApiError(404, 'Conversation not found.');
  if (['40001', '23505'].includes(error.code || '')) throw new ApiError(409, 'This conversation changed or a reply is still being prepared. Reopen it from Previous conversations.');
  if (['22023', '23514'].includes(error.code || '')) throw new ApiError(400, 'The conversation could not be saved. Please start a new conversation.');
  throw new ApiError(503, 'Saved conversations are unavailable. Please try again.');
}
