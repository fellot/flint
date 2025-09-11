import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const wines: any[] = Array.isArray(body?.wines) ? body.wines : [];
    const messages: { role: 'user'|'assistant'|'system'; content: string }[] = Array.isArray(body?.messages) ? body.messages : [];
    const locale: 'en' | 'pt' = body?.locale === 'pt' ? 'pt' : 'en';

    if (!wines.length || !messages.length) {
      return NextResponse.json({ error: 'Missing wines or messages' }, { status: 400 });
    }

    // Only consider available wines
    const available = wines.filter(w => (w.status ?? 'in_cellar') === 'in_cellar');
    if (!available.length) {
      return NextResponse.json({ error: 'No available wines to recommend' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });
    }

    const langHeader = locale === 'pt' ? 'pt-BR' : 'en';
    const instructions = locale === 'pt'
      ? `Você é um sommelier de classe mundial. Com base nas preferências do usuário (comida, humor, ocasião, clima), recomende EXATAMENTE UM vinho da lista fornecida (apenas os disponíveis "in_cellar"). Explique por que ele combina com o pedido. Inclua temperatura de serviço e orientação de decantação. Se fizer sentido, sugira até 2 alternativas por id. Responda em português (pt-BR).`
      : `You are a world-class sommelier. Based on the user's preferences (food, mood, occasion, weather), recommend EXACTLY ONE wine from the provided list (only those available "in_cellar"). Explain why it fits. Include serving temperature and decanting guidance. If appropriate, suggest up to 2 alternatives by id. Respond in English.`;

    // Minify wine list for the model: id + key descriptors
    const wineBrief = available.map(w => ({
      id: String(w.id),
      bottle: w.bottle,
      country: w.country,
      region: w.region,
      vintage: w.vintage,
      style: w.style,
      grapes: w.grapes,
      foodPairingNotes: w.foodPairingNotes,
      mealToHaveWithThisWine: w.mealToHaveWithThisWine,
      drinkingWindow: w.drinkingWindow,
      peakYear: w.peakYear,
      notes: w.notes,
    }));

    const schemaHint = locale === 'pt'
      ? `Retorne SOMENTE JSON:
{
  "wineId": string,              // id do vinho escolhido
  "bottle": string,              // nome do rótulo
  "reason": string,              // justificativa da escolha
  "servingTemperature": string,  // ex.: "16–18°C" ou "8–10°C"
  "decanting": string,           // ex.: "Não é necessário" ou "30–60 min"
  "alternatives": string[]       // até 2 ids alternativos (opcional)
}`
      : `Return ONLY JSON:
{
  "wineId": string,              // id of the chosen wine
  "bottle": string,              // label name
  "reason": string,              // rationale for the choice
  "servingTemperature": string,  // e.g., "16–18°C" or "8–10°C"
  "decanting": string,           // e.g., "Not necessary" or "30–60 min"
  "alternatives": string[]       // up to 2 alternative ids (optional)
}`;

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: instructions },
          { role: 'system', content: `Wine list (JSON):\n${JSON.stringify(wineBrief)}` },
          { role: 'system', content: schemaHint },
          ...messages.map(m => ({ role: m.role, content: m.content })),
        ],
        temperature: 0.4,
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
      if (!match) return NextResponse.json({ error: 'Failed to parse JSON' }, { status: 502 });
      parsed = JSON.parse(match[0]);
    }

    return NextResponse.json({
      ...parsed,
      language: langHeader,
    });
  } catch (error) {
    console.error('Sommelier chat error:', error);
    return NextResponse.json({ error: 'Failed to get recommendation' }, { status: 500 });
  }
};

