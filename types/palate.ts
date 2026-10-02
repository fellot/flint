export type GrapePreference = {
  grapeId: string;
  preference: 'love' | 'like' | 'neutral' | 'avoid' | 'explore';
  notes: string;
};

export type PalatePreferences = {
  discovery: 'familiar' | 'balanced' | 'adventurous';
  avoid_semi_sweet: boolean;
  preferences: string;
  journal_enabled: boolean;
  dismissed_patterns: string[];
  grape_preferences: GrapePreference[];
};

export type PalateEvidence = {
  id: string; bottle: string; vintage: number; score: number | null;
  comment: string; style: string; grapes: string; region: string; country: string;
};

export type PalatePattern = {
  id: string; name: { en: string; pt: string }; average: number;
  distinctWines: number; confidence: 'early' | 'emerging' | 'established';
  evidence: PalateEvidence[]; dismissed: boolean;
};

export type PalateProfile = {
  preferences: PalatePreferences; journalCount: number; scoredCount: number;
  excludedCount: number; average: number | null; patterns: PalatePattern[];
  grapes: GrapeProfile[];
  unmappedGrapeWines: number;
};

export type GrapeProfile = {
  grapeId: string;
  singleWines: number;
  blendWines: number;
  scoredSingleWines: number;
  average: number | null;
  styles: string[];
  evidence: (PalateEvidence & { composition: 'single' | 'blend' })[];
};
