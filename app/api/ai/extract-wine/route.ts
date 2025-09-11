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
  technical_sheet?: string;
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

    const systemPrompt = `You are a master sommelier and wine-knowledge assistant. Read the wine label and infer the wine's identity and typical profile (from region, grapes, producer, and vintage). Then:
 - Determine a realistic drinking window and peak year based on style, structure, and quality cues. Be conservative if uncertain.
 - Provide expert pairing guidance that complements the likely tasting profile (acidity, tannin, body, sweetness, aromatics, oak, bubbles).
 - Create ONE specific, creative meal suggestion that pairs exceptionally well with this wine (protein + method + sides/sauce), ideally coherent with origin or grape traditions.

Return ONLY strict JSON matching this schema (no commentary):
{
  "bottle": string,                // winery + cuvée + vintage if present
  "country": string,               // country name
  "region": string,                // region/appellation
  "vintage": number,               // 4-digit year; if missing, infer best guess else use current year
  "style": string,                 // One of: Red, White, Rosé, Sparkling, Sweet, Fortified
  "grapes": string,                // comma-separated varieties
  "drinkingWindow": string,        // e.g., "2025-2035"; infer from structure/quality; be realistic
  "peakYear": number,              // your best estimate of the maturity peak
  "foodPairingNotes": string,      // Describe wine's characteristics and food pairing suggestions
  "mealToHaveWithThisWine": string,// ONE creative dish (method + key sides/sauce)
  "notes": string,                 // omit
  "price": number,                 // omit
  "bottle_image": string          // omit
  "technical_sheet": string       // omit
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
      technical_sheet: typeof parsed.technical_sheet === 'string' ? parsed.technical_sheet : undefined,
    };

    // Try to enrich bottle_image using Google Images (Programmable Search) first, then Bing as fallback
    const googleKey = process.env.GOOGLE_API_KEY;
    const googleCx = process.env.GOOGLE_CSE_ID;
    const bingKey = process.env.BING_IMAGE_SEARCH_KEY || process.env.AZURE_BING_SEARCH_KEY;
    const needsImage = !extracted.bottle_image || !/^https?:\/\//i.test(extracted.bottle_image);
    const qImage = [extracted.bottle, String(extracted.vintage || ''), extracted.region, 'bottle OR label']
      .filter(Boolean)
      .join(' ');

    if (googleKey && googleCx && needsImage) {
      try {
        const gUrl = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(googleKey)}&cx=${encodeURIComponent(googleCx)}&q=${encodeURIComponent(qImage)}&searchType=image&safe=active&num=10`;
        const gRes = await fetch(gUrl);
        if (gRes.ok) {
          const g = await gRes.json();
          const blacklist = ['pinterest', 'aliexpress', 'ebay', 'shopee'];
          const pick = (g.items || []).find((item: any) => {
            const url: string = item?.link || '';
            const host = (() => { try { return new URL(url).hostname; } catch { return ''; } })();
            const okExt = /(\.jpg|\.jpeg|\.png|\.webp)(\?|$)/i.test(url);
            const notBlacklisted = host && !blacklist.some(bad => host.includes(bad));
            return url.startsWith('http') && (okExt || true) && notBlacklisted;
          });
          if (pick?.link) {
            extracted.bottle_image = pick.link;
          }
        }
      } catch (e) {
        console.warn('Google image search failed', e);
      }
    }

    if (bingKey && needsImage && !extracted.bottle_image) {
      try {
        const bingUrl = `https://api.bing.microsoft.com/v7.0/images/search?q=${encodeURIComponent(qImage)}&safeSearch=Strict&count=10`;
        const bingRes = await fetch(bingUrl, { headers: { 'Ocp-Apim-Subscription-Key': bingKey } });
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
        console.warn('Bing image search failed', e);
      }
    }

    // Try to enrich technical_sheet via Bing Web Search if configured and missing
    const needsTech = !extracted.technical_sheet || !/^https?:\/\//i.test(extracted.technical_sheet);
    if (bingKey && needsTech) {
      try {
        const q = [extracted.bottle, String(extracted.vintage || ''), 'technical sheet OR fact sheet OR "tech sheet" filetype:pdf']
          .filter(Boolean)
          .join(' ');
        const searchUrl = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(q)}&safeSearch=Strict&count=15`;
        const sRes = await fetch(searchUrl, { headers: { 'Ocp-Apim-Subscription-Key': bingKey } });
        if (sRes.ok) {
          const s = await sRes.json();
          const webPages = s?.webPages?.value || [];
          const blacklist = ['pinterest', 'aliexpress', 'ebay', 'shopee'];
          const candidates = webPages.filter((it: any) => {
            const url: string = it?.url || '';
            const host = (() => { try { return new URL(url).hostname; } catch { return ''; } })();
            const notBlacklisted = host && !blacklist.some(bad => host.includes(bad));
            const hasCue = /(technical|tech|fact)\s*sheet/i.test(it?.name || '') || /(technical|tech|fact)\s*sheet/i.test(it?.snippet || '') || /\.pdf(\?|$)/i.test(url);
            return url.startsWith('http') && notBlacklisted && hasCue;
          });
          // Prefer PDFs
          const pdf = candidates.find((it: any) => /\.pdf(\?|$)/i.test(it?.url || ''));
          const pick = pdf || candidates[0];
          if (pick?.url) {
            extracted.technical_sheet = pick.url;
          }
        }
      } catch (e) {
        console.warn('Bing web search failed', e);
      }
    }

    return NextResponse.json({ extracted });
  } catch (error: any) {
    console.error('AI extract error:', error);
    return NextResponse.json({ error: 'Failed to extract wine data' }, { status: 500 });
  }
}
