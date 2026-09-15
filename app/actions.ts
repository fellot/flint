'use server';

import { revalidatePath } from 'next/cache';
import type { FeatureWine } from '@/utils/excel';
import { requireCellar } from '@/lib/auth/session';
import { addWine } from '@/lib/dal/wines';

export async function addToCellar(wine: FeatureWine) {
  try {
    const { supabase, cellar } = await requireCellar();
    await addWine(supabase, cellar.id, {
      bottle: wine['Wine Name'], country: wine['Country Name'], region: wine.Region,
      vintage: 0, peakYear: '', foodPairingNotes: wine['Tasting Notes'], style: 'Red',
      notes: `Added from December Features. Score: ${wine.Score || 'N/A'}. Price: $${wine['$BTL']}`,
      price: wine['$BTL'], location: 'Unassigned', quantity: 1,
    });
    revalidatePath('/');
    return { success: true, message: 'Wine added to cellar' };
  } catch (error) {
    console.error('Error adding to cellar:', error);
    return { success: false, message: 'Failed to add wine to cellar' };
  }
}
