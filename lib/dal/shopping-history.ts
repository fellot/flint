import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { ShoppingBrief, ShoppingConversation, ShoppingReply, ShoppingSavedTurn } from '@/types/shopping';
import { ApiError } from '@/lib/api-error';
import { checkHistoryStorage, conversationSummary, HISTORY_PAGE_SIZE, type BuyerTurnRow } from '@/lib/shopping-history';
import { savedReply } from '@/lib/shopping-saved-reply';

export function buyerHistory(client: SupabaseClient<Database>, cellarId: string, userId: string) {
  const query = () => client.from('buyer_conversations').select('*').eq('cellar_id', cellarId).eq('user_id', userId);
  async function owned(id: string) {
    const { data, error } = await query().eq('id', id).maybeSingle();
    checkHistoryStorage(error);
    if (!data) throw new ApiError(404, 'Conversation not found.');
    return data;
  }
  return {
    async list(offset = 0) {
      const { data, error } = await query().order('updated_at', { ascending: false }).order('id').range(offset, offset + HISTORY_PAGE_SIZE);
      checkHistoryStorage(error);
      return { conversations: (data || []).slice(0, HISTORY_PAGE_SIZE).map(conversationSummary), hasMore: (data || []).length > HISTORY_PAGE_SIZE, nextOffset: offset + HISTORY_PAGE_SIZE };
    },
    async get(id: string, offset = 0): Promise<ShoppingConversation> {
      const c = await owned(id);
      const { data, error } = await client.from('buyer_turns').select('*').eq('conversation_id', c.id)
        .order('ordinal', { ascending: false }).range(offset, offset + HISTORY_PAGE_SIZE);
      checkHistoryStorage(error);
      const turns: ShoppingSavedTurn[] = (data || []).slice(0, HISTORY_PAGE_SIZE).reverse().map(row => {
        const reply = savedReply(row.reply, cellarId);
        const interrupted = row.status === 'pending' && Date.now() - Date.parse(row.created_at) >= 120000;
        return { id: row.id, user: row.user_message, attachmentName: row.attachment_name || undefined, reply,
          status: interrupted ? 'failed' : row.status, createdAt: row.created_at,
          error: interrupted ? 'Research was interrupted. You can ask again.' : row.error_text || (row.status === 'completed' && !reply ? 'This saved answer could not be displayed.' : undefined) };
      });
      return { conversation: conversationSummary(c), brief: c.brief, turns, hasOlder: (data || []).length > HISTORY_PAGE_SIZE, nextOffset: offset + HISTORY_PAGE_SIZE };
    },
    async rename(id: string, title: string) {
      await owned(id);
      const { error } = await client.from('buyer_conversations').update({ title }).eq('id', id).eq('cellar_id', cellarId).eq('user_id', userId);
      checkHistoryStorage(error);
    },
    async begin(input: { conversationId: string; turnId: string; revision: number; message: string; brief: ShoppingBrief; attachmentName?: string }) {
      const { data, error } = await client.rpc('begin_buyer_turn', { p_cellar_id: cellarId, p_conversation_id: input.conversationId,
        p_turn_id: input.turnId, p_revision: input.revision, p_message: input.message, p_brief: input.brief, p_attachment_name: input.attachmentName || null });
      checkHistoryStorage(error);
      const row = Array.isArray(data) ? data[0] : data;
      if (!row || row.id !== input.conversationId || !Number.isInteger(row.revision)) throw new ApiError(503, 'The question could not be saved.');
      return conversationSummary(row);
    },
    async context(id: string) {
      await owned(id);
      const { data, error } = await client.from('buyer_turns').select('*').eq('conversation_id', id).eq('status', 'completed')
        .order('ordinal', { ascending: false }).limit(11);
      checkHistoryStorage(error);
      return ((data || []) as BuyerTurnRow[]).reverse().map(t => ({ user: t.user_message, reply: savedReply(t.reply, cellarId) }));
    },
    async finish(id: string, turnId: string, reply: ShoppingReply | null, error: string | null) {
      const result = await client.rpc('finish_buyer_turn', { p_cellar_id: cellarId, p_conversation_id: id, p_turn_id: turnId, p_reply: reply, p_error: error });
      checkHistoryStorage(result.error);
    },
  };
}
export type BuyerHistory = ReturnType<typeof buyerHistory>;
