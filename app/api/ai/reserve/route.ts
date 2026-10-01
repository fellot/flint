import { requireCellar } from '@/lib/auth/session';
import { loadPalate } from '@/lib/dal/palate';
import { createReserveHandler } from '@/lib/ai/reserve-endpoint';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const POST = createReserveHandler(async cellarId => {
  const { supabase, cellar, user } = await requireCellar(cellarId);
  return { cellar, userId: user.id, load: () => loadPalate(supabase, cellar.id, user.id) };
});
