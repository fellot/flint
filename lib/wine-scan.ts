import type { WineFormData } from '../types/wine';
import { sanitizeBottleImage } from '../utils/sanitizeWine';

export type ScannedWine = Pick<WineFormData, 'bottle' | 'country' | 'region' | 'vintage' | 'style' | 'grapes' | 'drinkingWindow' | 'peakYear' | 'foodPairingNotes' | 'mealToHaveWithThisWine' | 'bottle_image' | 'technical_sheet'>;
export interface WineScanResult {
  extracted: ScannedWine;
  image: { url: string; sourceUrl: string; match: 'exact-vintage' | 'same-wine' } | null;
  sources: { url: string; title: string }[];
  warnings: string[];
}

const string = (value: unknown) => typeof value === 'string' ? value.trim().slice(0, 5000) : '';
const year = (value: unknown) => typeof value === 'number' && Number.isInteger(value) && value >= 1800 && value <= 2200 ? value : 0;

/** AI may fill descriptive fields only, never database IDs, stock, ownership or journal state. */
export function scannedWineFields(value: unknown): ScannedWine {
  const data = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    bottle: string(data.bottle), country: string(data.country), region: string(data.region),
    vintage: year(data.vintage),
    style: ['Red', 'White', 'Rosé', 'Sparkling', 'Sweet', 'Fortified', 'Orange'].includes(string(data.style)) ? string(data.style) : '',
    grapes: string(data.grapes), drinkingWindow: string(data.drinkingWindow), peakYear: year(data.peakYear) || '',
    foodPairingNotes: string(data.foodPairingNotes), mealToHaveWithThisWine: string(data.mealToHaveWithThisWine),
    bottle_image: sanitizeBottleImage(string(data.bottle_image)) || '',
    technical_sheet: sanitizeBottleImage(string(data.technical_sheet)) || '',
  };
}

export function newScanForm(external: boolean): WineFormData {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return {
    ...scannedWineFields({}), location: '', quantity: 1, notes: '',
    fromCellar: !external, status: external ? 'consumed' : 'in_cellar', consumedDate: external ? today : null,
  };
}
