export interface Wine {
  id: string;
  bottle: string;
  country: string;
  region: string;
  vintage: number;
  drinkingWindow: string;
  peakYear: number;
  foodPairingNotes: string;
  mealToHaveWithThisWine: string;
  style: string;
  grapes: string;
  status: 'in_cellar' | 'consumed' | 'sold' | 'gifted';
  consumedDate: string | null;
  notes: string;
  rating: number | null;
  price: number | null;
  location: string;
  quantity: number;
  technical_sheet?: string;
  bottle_image?: string;
  fromCellar?: boolean; // true if wine was originally in cellar, false if consumed from outside
}

export interface WineFilters {
  country: string;
  region: string;
  style: string;
  vintage: string;
  status: string;
  search: string;
}

export interface WineFormData {
  bottle: string;
  country: string;
  region: string;
  vintage: number;
  drinkingWindow: string;
  peakYear: number;
  foodPairingNotes: string;
  mealToHaveWithThisWine: string;
  style: string;
  grapes: string;
  location: string;
  quantity: number;
  price?: number;
  notes?: string;
  technical_sheet?: string;
  bottle_image?: string;
  fromCellar?: boolean;
  status?: 'in_cellar' | 'consumed' | 'sold' | 'gifted';
  consumedDate?: string | null;
  dataSource?: string;
}
