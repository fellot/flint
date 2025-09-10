import { NextRequest, NextResponse } from 'next/server';
import { Wine } from '@/types/wine';
import { loadWines, saveWines } from '@/lib/storage';

// GET single wine
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const dataSource = searchParams.get('dataSource') || '1';
    const wines: Wine[] = await loadWines(dataSource);
    
    const wine = wines.find(w => w.id === params.id);
    
    if (!wine) {
      return NextResponse.json({ error: 'Wine not found' }, { status: 404 });
    }

    return NextResponse.json(wine);
  } catch (error) {
    console.error('Error reading wine:', error);
    return NextResponse.json(
      { error: `Failed to fetch wine: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// PUT update wine
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const dataSource = body.dataSource || '1';
    const wines: Wine[] = await loadWines(dataSource);
    
    const wineIndex = wines.findIndex(w => w.id === params.id);
    
    if (wineIndex === -1) {
      return NextResponse.json({ error: 'Wine not found' }, { status: 404 });
    }

    wines[wineIndex] = { ...wines[wineIndex], ...body };
    await saveWines(wines, dataSource);

    return NextResponse.json(wines[wineIndex]);
  } catch (error) {
    console.error('Error updating wine:', error);
    return NextResponse.json(
      { error: `Failed to update wine: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// DELETE wine
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const dataSource = searchParams.get('dataSource') || '1';
    const wines: Wine[] = await loadWines(dataSource);
    
    const wineIndex = wines.findIndex(w => w.id === params.id);
    
    if (wineIndex === -1) {
      return NextResponse.json({ error: 'Wine not found' }, { status: 404 });
    }

    wines.splice(wineIndex, 1);
    await saveWines(wines, dataSource);

    return NextResponse.json({ message: 'Wine deleted successfully' });
  } catch (error) {
    console.error('Error deleting wine:', error);
    return NextResponse.json(
      { error: `Failed to delete wine: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}