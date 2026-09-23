'use client';

import { createContext, useContext } from 'react';

export type CellarMenuActions = { people: () => void; storage: () => void };
export const CellarMenuActionsContext = createContext<((actions: CellarMenuActions | null) => void) | null>(null);
export function useCellarMenuActions() { return useContext(CellarMenuActionsContext); }
