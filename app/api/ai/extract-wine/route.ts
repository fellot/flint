import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

type ExtractRequest = {
  image: string; // data URL or https URL
  locale?: string;
};

type ExtractedWine = {
  bottle: string;
  country: string;
  region: string;
  vintage: number;
  style: string;
  grapes: string;
  drinkingWindow: string;
  peakYear: number;
  foodPairingNotes: string;
  mealToHaveWithThisWine: string;
  notes: string;
  price?: number;
  bottle_image?: string;
};

function normalizeStyle(input: string): string {
  const s = (input || '').toLowerCase();
  if (s.includes('spark')) return 'Sparkling';
  if (s.includes('rosé') || s.includes('rose')) return 'Rosé';
  if (s.includes('sweet') || s.includes('dessert')) return 'Sweet';
  if (s.includes('fortified') || s.includes('port') || s.includes('sherry')) return 'Fortified';
  if (s.includes('white')) return 'White';
  if (s.includes('red')) return 'Red';
  return input || '';
}

function coerceNumber(n: any, fallback: number | null = null): number | null {
  const x = typeof n === 'string' ? parseInt(n, 10) : typeof n === 'number' ? n : NaN;
  return Number.isFinite(x) ? x : fallback;
}

export async function POST(request: NextRequest) {
  try {
    const { image, locale }: ExtractRequest = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'Missing image' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });
    }

    const systemPrompt = `You are a sommelier assistant that reads wine bottle labels and returns structured data as pure JSON with no extra text. Fill unknown fields conservatively.

Return exactly this JSON schema with keys:
{
  "bottle": string,                 // winery + cuvée + vintage if present
  "country": string,               // country name
  "region": string,                // region/appellation
  "vintage": number,               // 4-digit year; if missing, infer best guess else use current year
  "style": string,                 // One of: Red, White, Rosé, Sparkling, Sweet, Fortified
  "grapes": string,                // comma-separated varieties
  "drinkingWindow": string,        // e.g., "2025-2035"; conservative guess if unknown
  "peakYear": number,              // peak year estimate
  "foodPairingNotes": string,      // short suggestions
  "mealToHaveWithThisWine": string,// one concrete meal idea
  "notes": string,                 // short tasting/label notes
  "price": number,                 // numeric estimate if visible; else omit or null
  "bottle_image": string          // a public https URL to the bottle or label image; prefer official winery/retailer, avoid pinterest
}`;

    const userPrompt = `${locale === 'pt' ? 'Extraia as informações do rótulo do vinho nesta imagem e retorne apenas JSON.' : 'Extract wine label information from this image and return JSON only.'}`;

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              { type: 'image_url', image_url: { url: image } },
            ],
          },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text().catch(() => '');
      return NextResponse.json({ error: 'OpenAI request failed', details: errText }, { status: 502 });
    }

    const json = await openaiRes.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'No content returned from OpenAI' }, { status: 502 });
    }

    let parsed: any;
    try {
      parsed = typeof content === 'string' ? JSON.parse(content) : content;
    } catch {
      // Attempt to extract JSON block
      const match = String(content).match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        return NextResponse.json({ error: 'Failed to parse JSON from OpenAI' }, { status: 502 });
      }
    }

    const extracted: ExtractedWine = {
      bottle: parsed.bottle || '',
      country: parsed.country || '',
      region: parsed.region || '',
      vintage: coerceNumber(parsed.vintage, new Date().getFullYear())!,
      style: normalizeStyle(parsed.style || ''),
      grapes: parsed.grapes || '',
      drinkingWindow: parsed.drinkingWindow || '',
      peakYear: coerceNumber(parsed.peakYear, new Date().getFullYear() + 2)!,
      foodPairingNotes: parsed.foodPairingNotes || '',
      mealToHaveWithThisWine: parsed.mealToHaveWithThisWine || '',
      notes: parsed.notes || '',
      price: parsed.price != null ? Number(parsed.price) : undefined,
      bottle_image: typeof parsed.bottle_image === 'string' ? parsed.bottle_image : undefined,
    };

    // Try to enrich bottle_image with an actual web URL via Bing Image Search if configured
    const bingKey = process.env.BING_IMAGE_SEARCH_KEY || process.env.AZURE_BING_SEARCH_KEY;
    const needsImage = !extracted.bottle_image || !/^https?:\/\//i.test(extracted.bottle_image);
    if (bingKey && needsImage) {
      try {
        const qParts = [extracted.bottle, String(extracted.vintage || ''), extracted.region, 'bottle']
          .filter(Boolean)
          .join(' ');
        const bingUrl = `https://api.bing.microsoft.com/v7.0/images/search?q=${encodeURIComponent(qParts)}&safeSearch=Strict&count=10`; 
        const bingRes = await fetch(bingUrl, {
          headers: { 'Ocp-Apim-Subscription-Key': bingKey },
        });
        if (bingRes.ok) {
          const b = await bingRes.json();
          const blacklist = ['pinterest', 'aliexpress', 'ebay', 'shopee'];
          const pick = (b.value || []).find((item: any) => {
            const url: string = item?.contentUrl || '';
            const host = (() => { try { return new URL(url).hostname; } catch { return ''; } })();
            const okExt = /(\.jpg|\.jpeg|\.png|\.webp)(\?|$)/i.test(url);
            const notBlacklisted = host && !blacklist.some(bad => host.includes(bad));
            return url.startsWith('http') && okExt && notBlacklisted;
          });
          if (pick?.contentUrl) {
            extracted.bottle_image = pick.contentUrl;
          }
        }
      } catch (e) {
        // Ignore search errors; keep whatever we have
        console.warn('Bing image search failed', e);
      }
    }

    return NextResponse.json({ extracted });
  } catch (error: any) {
    console.error('AI extract error:', error);
    return NextResponse.json({ error: 'Failed to extract wine data' }, { status: 500 });
  }
}
