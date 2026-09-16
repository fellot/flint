import type { FridgeInput } from '@/types/database';
import { WineValidationError } from '@/lib/wine-data';

export function fridgeInput(body: unknown): FridgeInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new WineValidationError('Expected a wine fridge.');
  const value = body as Record<string, unknown>;
  if (typeof value.name !== 'string' || !value.name.trim() || value.name.trim().length > 80) throw new WineValidationError('Enter a fridge name of 1 to 80 characters.');
  if (typeof value.levelCount !== 'number' || !Number.isInteger(value.levelCount) || value.levelCount < 1 || value.levelCount > 50) throw new WineValidationError('Choose between 1 and 50 levels.');
  if (value.firstLevel !== 0 && value.firstLevel !== 1) throw new WineValidationError('Levels must start at 0 or 1.');
  return { name: value.name.trim(), levelCount: value.levelCount, firstLevel: value.firstLevel, ...(value.id !== undefined ? { id: fridgeId(value.id) } : {}) };
}

export function fridgeId(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw new WineValidationError('Choose a valid wine fridge.');
  return value;
}
