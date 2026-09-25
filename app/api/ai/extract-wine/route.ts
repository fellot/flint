import { NextRequest, NextResponse } from 'next/server';
import { ApiError, apiError, checkOrigin } from '@/lib/api-error';
import { requireCellar } from '@/lib/auth/session';
import { extractWineFromPhoto, MAX_SCAN_BODY_BYTES, validateScanImage, WineScanError } from '@/lib/ai/wine-extraction';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    await requireCellar();
    if (!process.env.OPENAI_API_KEY) throw new ApiError(503, 'Wine scanning needs an OpenAI API key configured on the server.');
    const reader = request.body?.getReader();
    if (!reader) throw new ApiError(400, 'Upload a wine label photo.');
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_SCAN_BODY_BYTES) { await reader.cancel(); throw new ApiError(413, 'The photo is too large. Try a smaller image.'); }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    validateScanImage(body?.image);
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(110_000)]);
    const result = await extractWineFromPhoto({ image: body.image, locale: body.locale === 'pt' ? 'pt' : 'en',
      apiKey: process.env.OPENAI_API_KEY, model: process.env.OPENAI_WINE_MODEL?.trim() || undefined, signal });
    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (error instanceof WineScanError) return apiError(new ApiError(error.status, error.message));
    if (error instanceof Error && ['AbortError', 'TimeoutError'].includes(error.name)) return apiError(new ApiError(504, 'Wine research timed out. Please try again.'));
    return apiError(error);
  }
}
