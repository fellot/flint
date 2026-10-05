'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { isSommelierAvatar, sommelierAvatar, type SommelierAvatarId } from '@/lib/sommelier-avatar';

type AvatarContext = {
  avatar: ReturnType<typeof sommelierAvatar>;
  saveAvatar: (id: SommelierAvatarId) => Promise<void>;
};
const Context = createContext<AvatarContext | null>(null);

export function useSommelierAvatar() {
  const context = useContext(Context);
  if (!context) throw new Error('A sommelier avatar provider is required.');
  return context;
}

// Mounted with the authenticated user ID as its key. A different login gets a
// fresh state; switching cellars retains the same personal choice.
export default function SommelierAvatarProvider({ initialAvatar, children }: {
  initialAvatar: SommelierAvatarId; children: React.ReactNode;
}) {
  const [avatarId, setAvatarId] = useState(initialAvatar);
  const saving = useRef<AbortController | null>(null);
  useEffect(() => () => saving.current?.abort(), []);

  async function saveAvatar(id: SommelierAvatarId) {
    if (saving.current) throw new Error('An avatar update is already in progress.');
    const controller = new AbortController();
    saving.current = controller;
    try {
      const response = await fetch('/api/account/preferences', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
        body: JSON.stringify({ sommelierAvatar: id }), signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save your avatar. Please try again.');
      if (!isSommelierAvatar(result.sommelierAvatar) || result.sommelierAvatar !== id) throw new Error('The avatar was not saved. Please try again.');
      controller.signal.throwIfAborted();
      setAvatarId(result.sommelierAvatar);
    } finally { if (saving.current === controller) saving.current = null; }
  }

  return <Context.Provider value={{ avatar: sommelierAvatar(avatarId), saveAvatar }}>{children}</Context.Provider>;
}
