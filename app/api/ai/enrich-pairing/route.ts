import { NextRequest, NextResponse } from 'next/server';
import { AI_MODEL, CHAT_REASONING_EFFORT } from '@/lib/ai/models';

export const runtime = 'nodejs';
export const maxDuration = 30;

export const POST = async (request: NextRequest) => {
  try {
    const { wine, currentPairing, currentMeal, mode = 'both', locale } = await request.json();

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
      ? `Você é um sommelier mestre. Dadas informações do vinho, gere:\n- Notas de harmonização (clareza, perfil do vinho e combinações típicas), incluindo uma sugestão de decantação. Não inclua notas de críticos ou alegações de pesquisa; os dados fornecidos não incluem avaliações verificadas.\n- UMA sugestão de prato específico (proteína + método + acompanhamentos/molho) que harmonize muito bem.\nSeja conciso e prático.`
      : `You are a master sommelier. Given wine info, produce:\n- Food pairing notes (clarity, wine profile, typical matches) that also include suggested decanting guidance. Do not include critic scores or claim research; the supplied data has no verified ratings.\n- ONE specific main dish (protein + method + sides/sauce) that pairs exceptionally well.\nBe concise and practical.`;

    const user = [
      lang === 'pt-BR' ? 'Informações do vinho:' : 'Wine info:',
      summary,
      constraints,
      lang === 'pt-BR'
        ? `Incorpore a recomendação de decantação dentro de \"foodPairingNotes\". Retorne APENAS JSON estrito neste formato:\n{\n  "foodPairingNotes": string,\n  "mealToHaveWithThisWine": string\n}`
        : `Embed the decanting recommendation inside \"foodPairingNotes\". Return ONLY strict JSON in this format:\n{\n  "foodPairingNotes": string,\n  "mealToHaveWithThisWine": string\n}`,
      mode === 'meal'
        ? (lang === 'pt-BR' ? 'Escolha um prato diferente do atual, evitando repetição.' : 'Choose a different main dish than the current one; avoid repetition.')
        : '',
    ].filter(Boolean).join('\n\n');

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(22000)]),
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        reasoning_effort: CHAT_REASONING_EFFORT,
        max_completion_tokens: 1200,
        store: false,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.5,
        response_format: { type: 'json_object' },
      }),
    });

    if (!openaiRes.ok) {
      return NextResponse.json({ error: 'Pairing suggestions are unavailable. Please try again shortly.' }, { status: 502 });
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

    const out = {
      foodPairingNotes: String(parsed.foodPairingNotes || '').trim(),
      mealToHaveWithThisWine: String(parsed.mealToHaveWithThisWine || '').trim(),
    };

    return NextResponse.json(out);
  } catch (error) {
    if (error instanceof Error && ['AbortError', 'TimeoutError'].includes(error.name)) {
      return NextResponse.json({ error: 'Pairing suggestions timed out. Please try again.' }, { status: 504 });
    }
    console.error('AI enrich error:', error);
    return NextResponse.json({ error: 'Failed to enrich pairing or meal' }, { status: 500 });
  }
};
