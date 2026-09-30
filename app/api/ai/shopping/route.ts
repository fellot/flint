import { requireCellar } from '@/lib/auth/session';
import { loadPalate } from '@/lib/dal/palate';
import { createShoppingHandler } from '@/lib/ai/shopping-endpoint';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export const POST = createShoppingHandler(async requestedId => {
  const { supabase, cellar, user } = await requireCellar(requestedId);
  return { cellar, userId: user.id, load: () => loadPalate(supabase, cellar.id, user.id) };
});
