import { NextRequest, NextResponse } from 'next/server';
const owner = process.env.GITHUB_OWNER!;
const repo = process.env.GITHUB_REPO!;
const branch = process.env.GITHUB_BRANCH ?? 'main';
const token = process.env.GITHUB_TOKEN!;

import { Wine } from '@/types/wine';
import { sanitizeBottleImage } from '@/utils/sanitizeWine';

const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents`;

async function getWineData(file: string) {
  const res = await fetch(`${apiBase}/${file}?ref=${branch}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch wines');
  }

  const json = await res.json();
  const content = Buffer.from(json.content, 'base64').toString('utf8');
  const wines: Wine[] = JSON.parse(content);
  return { wines, sha: json.sha };
}

async function commitWineData(
  file: string,
  wines: Wine[],
  sha: string,
  message: string
) {
  const content = Buffer.from(JSON.stringify(wines, null, 2)).toString('base64');
  const res = await fetch(`${apiBase}/${file}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github.v3+json',
    },
    body: JSON.stringify({
      message,
      content,
      sha,
      branch,
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to commit wines');
  }

  return res.json();
}

// GET single wine
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const dataSource = searchParams.get('dataSource') || '1';
    const file = dataSource === '2' ? 'data/wines2.json' : 'data/wines.json';
    const { wines } = await getWineData(file);
    
    const wine = wines.find(w => w.id === params.id);
    
    if (!wine) {
      return NextResponse.json({ error: 'Wine not found' }, { status: 404 });
    }

    return NextResponse.json(wine);
  } catch (error) {
    console.error('Error reading wine:', error);
    return NextResponse.json({ error: 'Failed to fetch wine' }, { status: 500 });
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
    const file = dataSource === '2' ? 'data/wines2.json' : 'data/wines.json';
    const { wines, sha } = await getWineData(file);
    
    const wineIndex = wines.findIndex(w => w.id === params.id);
    
    if (wineIndex === -1) {
      return NextResponse.json({ error: 'Wine not found' }, { status: 404 });
    }

    const updatedWine: Wine = { ...wines[wineIndex], ...body };
    const safeBottleImage = sanitizeBottleImage(updatedWine.bottle_image);

    if (safeBottleImage) {
      updatedWine.bottle_image = safeBottleImage;
    } else {
      delete updatedWine.bottle_image;
    }

    wines[wineIndex] = updatedWine;
    await commitWineData(file, wines, sha, `Update wine ${updatedWine.bottle}`);

    return NextResponse.json(updatedWine);
  } catch (error) {
    console.error('Error updating wine:', error);
    return NextResponse.json({ error: 'Failed to update wine' }, { status: 500 });
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
    const file = dataSource === '2' ? 'data/wines2.json' : 'data/wines.json';
    const { wines, sha } = await getWineData(file);
    
    const wineIndex = wines.findIndex(w => w.id === params.id);
    
    if (wineIndex === -1) {
      return NextResponse.json({ error: 'Wine not found' }, { status: 404 });
    }

    const [removed] = wines.splice(wineIndex, 1);
    await commitWineData(file, wines, sha, `Delete wine ${removed.bottle}`);

    return NextResponse.json({ message: 'Wine deleted successfully' });
  } catch (error) {
    console.error('Error deleting wine:', error);
    return NextResponse.json({ error: 'Failed to delete wine' }, { status: 500 });
  }
}
