import { NextRequest, NextResponse } from 'next/server';
import { requireCellar } from '@/lib/auth/session';
import { apiError, ApiError, checkOrigin } from '@/lib/api-error';
import { rowToWine, wineInput } from '@/lib/wine-data';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    checkOrigin(request);
    const body = await request.json();
    const { supabase, cellar } = await requireCellar(request.nextUrl.searchParams.get('dataSource') ?? body?.dataSource);
    const values = wineInput(body, true);
    if (!values.quantity || !values.consumed_date) throw new ApiError(400, 'Specify a positive quantity and consumption date.');
    const { data, error } = await supabase.rpc('consume_wine', {
      p_cellar_id: cellar.id, p_wine_id: params.id, p_quantity: values.quantity,
      p_consumed_date: values.consumed_date, p_notes: values.notes, p_location: values.location,
    });
    if (error?.code === 'P0002') throw new ApiError(404, 'Wine not found.');
    if (error?.code === '22023') throw new ApiError(409, 'The wine quantity or status has changed. Refresh and try again.');
    if (error) throw error;
    return NextResponse.json(data.map(rowToWine));
  } catch (error) { return apiError(error); }
}
