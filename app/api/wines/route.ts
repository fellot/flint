import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

import { Wine, WineFormData } from '@/types/wine';

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
    const file = dataSource === '2' ? 'data/wines2.json' : 'data/wines.json';

    const { wines: allWines } = await getWineData(file);
    let wines = [...allWines];

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
    return NextResponse.json({ error: 'Failed to fetch wines' }, { status: 500 });
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
    const file = dataSource === '2' ? 'data/wines2.json' : 'data/wines.json';
    const { wines, sha } = await getWineData(file);

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
    await commitWineData(file, wines, sha, `Add wine ${newWine.bottle}`);

    return NextResponse.json(newWine, { status: 201 });
  } catch (error) {
    console.error('Error creating wine:', error);
    return NextResponse.json(
      { error: 'Failed to create wine' },
      { status: 500 }
    );
  }
}
