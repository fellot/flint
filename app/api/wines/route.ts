import { NextRequest, NextResponse } from 'next/server';
import { Wine, WineFormData } from '@/types/wine';
import { loadWines, saveWines } from '@/lib/storage';

// GET all wines
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const style = searchParams.get('style');
    const vintage = searchParams.get('vintage');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const dataSource = searchParams.get('dataSource') || '1'; // Default to wines.json

    // Load wines using storage abstraction
    let wines: Wine[] = await loadWines(dataSource);

    // Apply filters
    if (country && country !== 'all') {
      wines = wines.filter(wine => wine.country === country);
    }

    if (style && style !== 'all') {
      wines = wines.filter(wine => wine.style === style);
    }

    if (vintage && vintage !== 'all') {
      wines = wines.filter(wine => wine.vintage.toString() === vintage);
    }

    if (status && status !== 'all') {
      wines = wines.filter(wine => wine.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      wines = wines.filter(wine =>
        wine.bottle.toLowerCase().includes(searchLower) ||
        wine.country.toLowerCase().includes(searchLower) ||
        wine.region.toLowerCase().includes(searchLower) ||
        wine.grapes.toLowerCase().includes(searchLower) ||
        wine.foodPairingNotes.toLowerCase().includes(searchLower) ||
        wine.mealToHaveWithThisWine.toLowerCase().includes(searchLower) ||
        wine.notes.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json(wines);
  } catch (error) {
    console.error('Error reading wines:', error);
    return NextResponse.json(
      { error: `Failed to fetch wines: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// POST new wine
export async function POST(request: NextRequest) {
  try {
    const body: WineFormData = await request.json();
    
    // Validate required fields
    if (!body.bottle || !body.country || !body.vintage || !body.style) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get data source from request body or default to 1
    const dataSource = body.dataSource || '1';
    const wines: Wine[] = await loadWines(dataSource);

    const newWine: Wine = {
      id: Date.now().toString(),
      ...body,
      status: body.status || 'in_cellar',
      consumedDate: body.consumedDate || null,
      notes: body.notes || '',
      rating: null,
      price: body.price || null,
      quantity: body.quantity || 1,
      technical_sheet: body.technical_sheet || undefined,
      bottle_image: body.bottle_image || undefined,
      fromCellar: body.fromCellar !== undefined ? body.fromCellar : true,
    };

    wines.push(newWine);
    await saveWines(wines, dataSource);

    return NextResponse.json(newWine, { status: 201 });
  } catch (error) {
    console.error('Error creating wine:', error);
    return NextResponse.json(
      { error: `Failed to create wine: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
