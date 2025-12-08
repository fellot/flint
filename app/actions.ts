'use server';

import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { FeatureWine } from '@/utils/excel';

export async function addToCellar(wine: FeatureWine) {
    try {
        const filePath = path.join(process.cwd(), 'data', 'wines.json');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const wines = JSON.parse(fileContent);

        // Generate new ID
        const maxId = wines.reduce((max: number, w: any) => Math.max(max, parseInt(w.id) || 0), 0);
        const newId = String(maxId + 1);

        // Map FeatureWine to Cellar Wine
        const newWine = {
            id: newId,
            bottle: wine['Wine Name'],
            country: wine['Country Name'],
            region: wine['Region'],
            vintage: null, // Not available in FeatureWine
            drinkingWindow: null,
            peakYear: null,
            foodPairingNotes: wine['Tasting Notes'], // Using tasting notes as a fallback
            mealToHaveWithThisWine: null,
            style: 'Red', // Defaulting, could try to infer but risky
            grapes: null,
            status: 'in_cellar',
            consumedDate: null,
            notes: `Added from December Features. Score: ${wine['Score'] || 'N/A'}. Price: $${wine['$BTL']}`,
            rating: null,
            price: wine['$BTL'],
            location: 'Unassigned',
            quantity: 1,
            bottle_image: null,
            dataSource: 'december_features'
        };

        wines.push(newWine);

        fs.writeFileSync(filePath, JSON.stringify(wines, null, 2));

        revalidatePath('/');
        return { success: true, message: 'Wine added to cellar' };
    } catch (error) {
        console.error('Error adding to cellar:', error);
        return { success: false, message: 'Failed to add wine to cellar' };
    }
}
