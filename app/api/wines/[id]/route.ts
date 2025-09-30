import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

import { Wine } from '@/types/wine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;
const branch = process.env.GITHUB_BRANCH ?? 'main';
const token = process.env.GITHUB_TOKEN;

const useGitHub = Boolean(owner && repo && token);
const apiBase = useGitHub
  ? `https://api.github.com/repos/${owner}/${repo}/contents`
  : null;

const readLocalWineData = async (file: string) => {
  const filePath = path.join(process.cwd(), file);
  const content = await fs.readFile(filePath, 'utf8');
  const wines: Wine[] = JSON.parse(content);
  return { wines, sha: null as string | null };
};

async function getWineData(file: string) {
  if (!useGitHub || !apiBase) {
    return readLocalWineData(file);
  }

  try {
    const res = await fetch(`${apiBase}/${file}?ref=${branch}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`GitHub fetch failed with status ${res.status}`);
    }

    const json = await res.json();
    const content = Buffer.from(json.content, 'base64').toString('utf8');
    const wines: Wine[] = JSON.parse(content);
    return { wines, sha: json.sha as string | null };
  } catch (error) {
    console.warn(`Falling back to local wine data for ${file}:`, error);
    return readLocalWineData(file);
  }
}

async function commitWineData(
  file: string,
  wines: Wine[],
  sha: string | null,
  message: string
) {
  if (!useGitHub || !apiBase) {
    const filePath = path.join(process.cwd(), file);
    await fs.writeFile(filePath, JSON.stringify(wines, null, 2), 'utf8');
    return { committed: true, via: 'local' };
  }

  if (!sha) {
    throw new Error('Missing file SHA for GitHub commit');
  }

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

    wines[wineIndex] = { ...wines[wineIndex], ...body };
    await commitWineData(file, wines, sha, `Update wine ${wines[wineIndex].bottle}`);

    return NextResponse.json(wines[wineIndex]);
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
