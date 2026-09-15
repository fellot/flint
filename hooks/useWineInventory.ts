'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Wine, WineFormData } from '@/types/wine';
import { readResponse } from '@/lib/client-api';
import { sanitizeWinePayload } from '@/utils/sanitizeWine';

export function useWineInventory(dataSource: string) {
  const [wines, setWines] = useState<Wine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let disposed = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    setLoading(true);
    setError('');
    fetch(`/api/wines?dataSource=${encodeURIComponent(dataSource)}`, { signal: controller.signal, cache: 'no-store' })
      .then(response => readResponse<Wine[]>(response)).then(data => { if (!disposed) setWines(data); })
      .catch(error => { if (!controller.signal.aborted) setError(error.message || 'Unable to load your wines.'); else if (!disposed) setError('Loading took too long. Please try again.'); })
      .finally(() => { clearTimeout(timeout); if (!disposed) setLoading(false); });
    return () => { disposed = true; clearTimeout(timeout); controller.abort(); };
  }, [dataSource, revision]);
  const endpoint = useCallback((id: string, suffix = '') => `/api/wines/${encodeURIComponent(id)}${suffix}?dataSource=${encodeURIComponent(dataSource)}`, [dataSource]);
  const onAdd = async (wine: WineFormData) => {
    const response = await fetch('/api/wines', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...sanitizeWinePayload(wine), dataSource }) });
    const saved = await readResponse<Wine>(response);
    setWines(previous => [saved, ...previous]);
  };
  const onUpdate = async (wine: Wine) => {
    const response = await fetch(endpoint(wine.id), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...sanitizeWinePayload(wine), bottle_image: wine.bottle_image || null }) });
    const saved = await readResponse<Wine>(response);
    setWines(previous => previous.map(item => item.id === saved.id ? saved : item));
  };
  const onDelete = async (id: string) => {
    await readResponse(await fetch(endpoint(id), { method: 'DELETE' }));
    setWines(previous => previous.filter(item => item.id !== id));
  };
  const onConsume = async (wine: Wine, quantity: number, notes: string, location: string) => {
    const response = await fetch(endpoint(wine.id, '/consume'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quantity, notes, location, consumedDate: new Date().toISOString().slice(0, 10) }) });
    const changed = await readResponse<Wine[]>(response);
    setWines(previous => {
      const byId = new Map(previous.map(item => [item.id, item]));
      changed.forEach(item => byId.set(item.id, item));
      return Array.from(byId.values());
    });
  };
  return { wines, loading, error, onRetry: () => setRevision(value => value + 1), onAdd, onUpdate, onDelete, onConsume };
}
