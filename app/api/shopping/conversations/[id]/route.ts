import { requireCellar } from '@/lib/auth/session';
import { buyerHistory } from '@/lib/dal/shopping-history';
import { createHistoryHandler } from '@/lib/shopping-history-endpoint';

export const dynamic = 'force-dynamic';
const handler = createHistoryHandler(async requestedId => {
  const { supabase, cellar, user } = await requireCellar(requestedId);
  return buyerHistory(supabase, cellar.id, user.id);
});
export const GET = (request: Request, { params }: { params: { id: string } }) => handler(request, params.id);
export const PATCH = GET;
