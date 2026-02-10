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
    const currentYear = new Date().getFullYear();
    const instructions = locale === 'pt'
      ? `Você é um sommelier de classe mundial, caloroso e conversacional.\nO ano atual é ${currentYear}.\n\nRegras de diálogo:\n- SEMPRE tente recomendar um vinho com base nas informações disponíveis. Mesmo que a solicitação seja breve (ex.: "carne", "pizza", "dia quente"), você tem informação suficiente para fazer uma boa recomendação.\n- SOMENTE faça uma pergunta de esclarecimento se a mensagem for completamente impossível de interpretar ou não tiver relação nenhuma com comida, ocasião, humor ou clima.\n- Quando fizer uma pergunta, responda APENAS JSON: {"type":"question","question":string}.\n\nRegras de prioridade de maturidade (MUITO IMPORTANTE):\n- Cada vinho tem um peakYear (ano de pico de maturidade) e uma drinkingWindow (janela de consumo).\n- PRIORIZE FORTEMENTE vinhos que já passaram do pico (peakYear <= ${currentYear}) ou que estão no pico este ano. Esses vinhos devem ser bebidos logo antes que percam qualidade.\n- Em seguida, prefira vinhos próximos do pico (1-2 anos). Vinhos muito jovens e longe do pico devem ser evitados a menos que sejam a única opção.\n- Na justificativa, SEMPRE mencione a maturidade do vinho (ex.: "Este vinho está no pico de maturidade" ou "Já passou do pico, ideal abrir agora").\n\nRegras de recomendação:\n- Recomende EXATAMENTE UM vinho da lista (somente status "in_cellar").\n- Dê justificativa breve e natural; inclua temperatura de serviço e decantação.\n- Se fizer sentido, sugira até 2 alternativas por id.\n- Responda em português (pt-BR).`
      : `You are a warm, conversational, world-class sommelier.\nThe current year is ${currentYear}.\n\nDialogue rules:\n- ALWAYS try to recommend a wine based on the available information. Even if the request is brief (e.g., "steak", "pizza", "hot day"), you have enough to make a good recommendation.\n- ONLY ask a clarifying question if the message is completely impossible to interpret or has no relation to food, occasion, mood, or weather.\n- When asking a question, respond ONLY JSON: {"type":"question","question":string}.\n\nMaturity priority rules (VERY IMPORTANT):\n- Each wine has a peakYear (peak maturity year) and a drinkingWindow (drinking window range).\n- STRONGLY PRIORITIZE wines that are past their peak (peakYear <= ${currentYear}) or at their peak this year. These wines should be drunk soon before they lose quality.\n- Next, prefer wines close to peak (1-2 years away). Wines that are very young and far from peak should be avoided unless they are the only option.\n- In your rationale, ALWAYS mention the wine's maturity status (e.g., "This wine is at peak maturity" or "Past its peak — ideal to open now before it fades").\n\nRecommendation rules:\n- Recommend EXACTLY ONE wine from the list (only status "in_cellar").\n- Provide a brief, natural rationale; include serving temperature and decanting guidance.\n- If appropriate, suggest up to 2 alternatives by id.\n- Respond in English.`;

    // Minify wine list for the model: id + key descriptors + maturity status
    const wineBrief = available.map(w => {
      const peak = Number(w.peakYear) || 0;
      const diff = peak - currentYear;
      let maturityStatus = '';
      if (peak > 0) {
        if (diff < -2) maturityStatus = 'PAST PEAK — drink urgently';
        else if (diff < 0) maturityStatus = 'PAST PEAK — drink soon';
        else if (diff === 0) maturityStatus = 'AT PEAK — ideal to drink now';
        else if (diff <= 2) maturityStatus = 'NEAR PEAK — good to drink';
        else maturityStatus = `${diff} years until peak — consider waiting`;
      }
      return {
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
        maturityStatus,
        notes: w.notes,
      };
    });

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
