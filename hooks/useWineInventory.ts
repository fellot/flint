'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Person, TastingInput } from '@/types/database';
import type { Wine, WineFormData } from '@/types/wine';
import { readResponse } from '@/lib/client-api';
import { sanitizeWinePayload } from '@/utils/sanitizeWine';

export function useWineInventory(dataSource: string) {
  const [wines, setWines] = useState<Wine[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let disposed = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    setLoading(true);
    setError('');
    Promise.all([
      fetch(`/api/wines?dataSource=${encodeURIComponent(dataSource)}`, { signal: controller.signal, cache: 'no-store' }).then(response => readResponse<Wine[]>(response)),
      fetch(`/api/cellar/people?dataSource=${encodeURIComponent(dataSource)}`, { signal: controller.signal, cache: 'no-store' }).then(response => readResponse<{ people: Person[]; isOwner: boolean }>(response)),
    ]).then(([data, roster]) => { if (!disposed) { setWines(data); setPeople(roster.people); setIsOwner(roster.isOwner); } })
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
  const onConsume = async (wine: Wine, input: TastingInput) => {
    const response = await fetch(endpoint(wine.id, '/consume'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    const changed = await readResponse<Wine[]>(response);
    setWines(previous => {
      const byId = new Map(previous.map(item => [item.id, item]));
      changed.forEach(item => byId.set(item.id, item));
      return Array.from(byId.values());
    });
  };
  const onReview = async (id: string, rating: number | null, comment: string) => {
    const response = await fetch(endpoint(id, '/review'), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rating, comment }) });
    const saved = await readResponse<{ myRating: number | null; myComment: string }>(response);
    setWines(previous => previous.map(wine => wine.id === id ? { ...wine, ...saved } : wine));
  };
  const onAddPerson = async (name: string, email: string) => {
    const response = await fetch(`/api/cellar/people?dataSource=${encodeURIComponent(dataSource)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email }) });
    const result = await readResponse<{ people: Person[]; isOwner: boolean; invitationSent: boolean; warning: string }>(response);
    setPeople(result.people); setIsOwner(result.isOwner);
    return result;
  };
  return { wines, people, isOwner, onReview, onAddPerson, loading, error, onRetry: () => setRevision(value => value + 1), onAdd, onUpdate, onDelete, onConsume };
}
