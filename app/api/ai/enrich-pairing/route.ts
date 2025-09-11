import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

type EnrichRequest = {
  wine: {
    bottle?: string;
    country?: string;
    region?: string;
    vintage?: number;
    style?: string;
    grapes?: string;
  };
  currentPairing?: string;
  currentMeal?: string;
  mode?: 'pairing' | 'meal' | 'both';
  locale?: string;

export async function POST(request: NextRequest) {
  try {
    const { wine, currentPairing, currentMeal, mode = 'both', locale }: EnrichRequest = await request.json();

    if (!wine) {
      return NextResponse.json({ error: 'Missing wine data' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });
    }

    const lang = locale === 'pt' ? 'pt-BR' : 'en';

    const summary = [
      wine.bottle && `Bottle: ${wine.bottle}`,
      wine.country && `Country: ${wine.country}`,
      wine.region && `Region: ${wine.region}`,
      (Number.isFinite(wine.vintage) && wine.vintage) ? `Vintage: ${wine.vintage}` : '',
      wine.style && `Style: ${wine.style}`,
      wine.grapes && `Grapes: ${wine.grapes}`,
    ].filter(Boolean).join('\n');

    const constraints = [
      mode !== 'meal' && currentPairing ? `Refine the existing pairing notes (keep best content, improve clarity, and add 1-2 concrete dish examples). Current pairing notes: ${currentPairing}` : '',
      mode !== 'pairing' && currentMeal ? `Propose a different single main dish than this one: ${currentMeal}` : '',
    ].filter(Boolean).join('\n');

    const system = lang === 'pt-BR'
      ? `Você é um sommelier mestre. Dadas informações do vinho, gere:\n- Notas de harmonização (clareza, perfil do vinho e combinações típicas).\n- UMA sugestão de prato específico (proteína + método + acompanhamentos/molho) que harmonize muito bem.\nSeja conciso e prático.`
      : `You are a master sommelier. Given wine info, produce:\n- Food pairing notes (clarity, wine profile, typical matches).\n- ONE specific main dish (protein + method + sides/sauce) that pairs exceptionally well.\nBe concise and practical.`;

    const user = [
      lang === 'pt-BR' ? 'Informações do vinho:' : 'Wine info:',
      summary,
      constraints,
      lang === 'pt-BR'
        ? `Retorne APENAS JSON estrito neste formato:\n{\n  "foodPairingNotes": string,\n  "mealToHaveWithThisWine": string\n}`
        : `Return ONLY strict JSON in this format:\n{\n  "foodPairingNotes": string,\n  "mealToHaveWithThisWine": string\n}`,
      mode === 'meal'
        ? (lang === 'pt-BR' ? 'Escolha um prato diferente do atual, evitando repetição.' : 'Choose a different main dish than the current one; avoid repetition.')
        : '',
    ].filter(Boolean).join('\n\n');

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.5,
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
      const match = String(content).match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json({ error: 'Failed to parse JSON from OpenAI' }, { status: 502 });
      }
      parsed = JSON.parse(match[0]);
    }

    const out: EnrichResponse = {
      foodPairingNotes: String(parsed.foodPairingNotes || '').trim(),
      mealToHaveWithThisWine: String(parsed.mealToHaveWithThisWine || '').trim(),
    };

    return NextResponse.json(out);
  } catch (error) {
    console.error('AI enrich error:', error);
    return NextResponse.json({ error: 'Failed to enrich pairing or meal' }, { status: 500 });
  }
}

