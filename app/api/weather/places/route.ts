import { requireCellar } from '@/lib/auth/session';
import { createWeatherPlacesHandler } from '@/lib/ai/reserve-endpoint';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = createWeatherPlacesHandler(async cellarId => {
  const { cellar, user } = await requireCellar(cellarId);
  return { cellar, userId: user.id, load: async () => { throw new Error('City search does not read inventory.'); } };
});
