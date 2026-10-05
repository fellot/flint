import { NextRequest, NextResponse } from 'next/server';
import { requireCellar } from '@/lib/auth/session';
import { getWine } from '@/lib/dal/wines';
import { apiError, ApiError } from '@/lib/api-error';
import { fetchPostcardPhoto } from '@/lib/postcard-photo';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
type Context = { params: { id: string } };

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const { supabase, cellar } = await requireCellar(request.nextUrl.searchParams.get('dataSource'));
    const wine = await getWine(supabase, cellar.id, params.id);
    if (!wine.bottle_image) throw new ApiError(404, 'This wine has no bottle photo.');
    const photo = await fetchPostcardPhoto(wine.bottle_image);
    return new NextResponse(new Uint8Array(photo.bytes).buffer, { headers: {
      'Content-Type': photo.contentType,
      'Content-Length': String(photo.bytes.length),
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    } });
  } catch (error) { return apiError(error); }
}
