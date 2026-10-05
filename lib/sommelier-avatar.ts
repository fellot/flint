export const SOMMELIER_AVATAR_KEY = 'flint_sommelier_avatar';
export const DEFAULT_SOMMELIER_AVATAR = 'classic-cat';

export const SOMMELIER_AVATARS = [
  {
    id: 'classic-cat', image: '/images/sommelier-cat.png',
    name: { en: 'The original', pt: 'O original' },
    description: { en: 'A discerning cat. A familiar face.', pt: 'Um gato exigente. Um rosto familiar.' },
  },
  {
    id: 'copper', image: '/images/sommelier-copper.png',
    name: { en: 'Copper', pt: 'Copper' },
    description: { en: 'Caramel curls. Excellent company.', pt: 'Cachos de caramelo. Ótima companhia.' },
  },
] as const;

export type SommelierAvatarId = typeof SOMMELIER_AVATARS[number]['id'];

export function isSommelierAvatar(value: unknown): value is SommelierAvatarId {
  return SOMMELIER_AVATARS.some(avatar => avatar.id === value);
}

export function sommelierAvatar(value: unknown) {
  return SOMMELIER_AVATARS.find(avatar => avatar.id === value) || SOMMELIER_AVATARS[0];
}

// User-editable appearance metadata must never be used for authorization.
// Only a bundled, known asset can be selected, never a stored remote URL.
export function avatarFromMetadata(metadata: unknown): SommelierAvatarId {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return DEFAULT_SOMMELIER_AVATAR;
  return sommelierAvatar((metadata as Record<string, unknown>)[SOMMELIER_AVATAR_KEY]).id;
}
