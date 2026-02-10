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
      ? `Você é um sommelier de classe mundial, caloroso e conversacional.\n\nRegras de diálogo:\n- Se as informações do usuário forem insuficientes ou ambíguas, FAÇA 1 PERGUNTA de esclarecimento antes de recomendar.\n- Quando fizer uma pergunta, responda APENAS JSON: {"type":"question","question":string}.\n\nRegras de recomendação:\n- Quando houver informação suficiente, recomende EXATAMENTE UM vinho da lista (somente status "in_cellar").\n- Considere pico de maturidade (peakYear) e janela de consumo ao escolher.\n- Dê justificativa breve e natural; inclua temperatura de serviço e decantação.\n- Se fizer sentido, sugira até 2 alternativas por id.\n- Responda em português (pt-BR).`
      : `You are a warm, conversational, world-class sommelier.\n\nDialogue rules:\n- If the user's info is insufficient or ambiguous, ASK 1 CLARIFYING question before recommending.\n- When asking a question, respond ONLY JSON: {"type":"question","question":string}.\n\nRecommendation rules:\n- When sufficient info, recommend EXACTLY ONE wine from the list (only status "in_cellar").\n- Consider peak maturity (peakYear) and drinking window when choosing.\n- Provide a brief, natural rationale; include serving temperature and decanting guidance.\n- If appropriate, suggest up to 2 alternatives by id.\n- Respond in English.`;

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
      ? `Retorne SOMENTE JSON.\nQuando PRECISAR de esclarecimento: {\n  "type": "question",\n  "question": string\n}\nQuando HOUVER recomendação: {\n  "type": "recommendation",\n  "wineId": string,              // id do vinho escolhido\n  "bottle": string,              // nome do rótulo\n  "reason": string,              // leve em conta peakYear/janela de consumo\n  "servingTemperature": string,  // ex.: "16–18°C" ou "8–10°C"\n  "decanting": string,           // ex.: "Não é necessário" ou "30–60 min"\n  "alternatives": string[]       // até 2 ids alternativos (opcional)\n}`
      : `Return ONLY JSON.\nWhen you NEED clarification: {\n  "type": "question",\n  "question": string\n}\nWhen you HAVE a recommendation: {\n  "type": "recommendation",\n  "wineId": string,              // id of the chosen wine\n  "bottle": string,              // label name\n  "reason": string,              // consider peakYear/drinking window\n  "servingTemperature": string,  // e.g., "16–18°C" or "8–10°C"\n  "decanting": string,           // e.g., "Not necessary" or "30–60 min"\n  "alternatives": string[]       // up to 2 alternative ids (optional)\n}`;

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-nano',
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
