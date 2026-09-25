'use client';

import { useEffect, useRef, useState } from 'react';
import { getNewJournalBadgeAwards, type JournalBadgeAward } from '@/lib/journal-badges';
import type { Wine } from '@/types/wine';

/** Only celebrate changes to a loaded personal journal, never its initial load. */
export function useJournalBadgeCelebration(wines: Wine[], scopeKey: string, loading: boolean, error: boolean) {
  const previous = useRef<{ scopeKey: string; wines: Wine[] } | null>(null);
  const [notice, setNotice] = useState<{ scopeKey: string; awards: JournalBadgeAward[] } | null>(null);

  useEffect(() => {
    if (loading || error) {
      previous.current = null;
      setNotice(null);
      return;
    }
    const before = previous.current;
    previous.current = { scopeKey, wines };
    if (!before || before.scopeKey !== scopeKey) {
      setNotice(null);
      return;
    }
    const unlocked = getNewJournalBadgeAwards(before.wines, wines);
    if (unlocked.length) {
      setNotice(current => {
        const awards = new Map((current?.scopeKey === scopeKey ? current.awards : []).map(award => [award.badge.id, award]));
        unlocked.forEach(award => awards.set(award.badge.id, award));
        return { scopeKey, awards: Array.from(awards.values()) };
      });
    }
  }, [wines, scopeKey, loading, error]);

  return { awards: !loading && !error && notice?.scopeKey === scopeKey ? notice.awards : [], dismiss: () => setNotice(null) };
}
