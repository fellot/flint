'use client';

import { useEffect, useState } from 'react';
import { useCellar } from '@/components/CellarSession';
import CellarEssentials from '@/components/CellarEssentials';
import { readResponse } from '@/lib/client-api';
import type { Wine } from '@/types/wine';

export default function CellarEssentialsPage() {
  const { cellar } = useCellar();
  const [inventory, setInventory] = useState<{ cellarId: string; wines: Wine[]; error: boolean } | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    setInventory(null);
    const timeout = setTimeout(() => controller.abort(), 15000);
    fetch(`/api/wines?dataSource=${encodeURIComponent(cellar.id)}`, { cache: 'no-store', signal: controller.signal })
      .then(response => readResponse<Wine[]>(response))
      .then(wines => {
        if (!Array.isArray(wines)) throw new Error('Invalid inventory');
        if (!disposed) setInventory({ cellarId: cellar.id, wines, error: false });
      })
      .catch(() => { if (!disposed) setInventory({ cellarId: cellar.id, wines: [], error: true }); })
      .finally(() => clearTimeout(timeout));
    return () => { disposed = true; clearTimeout(timeout); controller.abort(); };
  }, [cellar.id, revision]);

  const current = inventory?.cellarId === cellar.id ? inventory : null;
  return <CellarEssentials wines={current?.wines || []} locale={cellar.locale} loading={!current}
    error={current?.error} onRetry={() => setRevision(value => value + 1)} />;
}
