const MAX_BOTTLE_IMAGE_URL_LENGTH = 2048;

/**
 * Ensures bottle image values are safe to persist.
 * Returns an HTTP(S) URL or undefined when the value should be discarded.
 */
export function sanitizeBottleImage(value?: string | null): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const isHttpUrl = /^https?:\/\//i.test(trimmed);
  if (!isHttpUrl) {
    return undefined;
  }

  if (trimmed.length > MAX_BOTTLE_IMAGE_URL_LENGTH) {
    return undefined;
  }

  try {
    const url = new URL(trimmed);
    if (!url.hostname || url.username || url.password) return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}

/**
 * Creates a shallow clone of the payload with a sanitized bottle_image field.
 */
export function sanitizeWinePayload<T extends { bottle_image?: string | null }>(payload: T): T {
  const sanitizedPayload = { ...payload };
  const safeBottleImage = sanitizeBottleImage(sanitizedPayload.bottle_image ?? undefined);

  if (safeBottleImage) {
    sanitizedPayload.bottle_image = safeBottleImage as T['bottle_image'];
  } else {
    delete sanitizedPayload.bottle_image;
  }

  return sanitizedPayload;
}
