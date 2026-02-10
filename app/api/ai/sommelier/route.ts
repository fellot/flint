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
      ? `Você é um sommelier de classe mundial, caloroso e conversacional.\nO ano atual é ${currentYear}.\n\nModos de resposta:\n1. RECOMENDAÇÃO: Quando o usuário pede uma sugestão de vinho (comida, ocasião, humor, clima), recomende um vinho.\n2. PERGUNTA: SOMENTE se a mensagem for completamente impossível de interpretar.\n3. CONVERSA: Para perguntas de acompanhamento sobre um vinho já recomendado (ex.: "qual é o ano de pico?", "conte mais", "quais uvas?"), responda com informações da lista de vinhos. Use o campo maturityStatus para dados de maturidade — NUNCA invente informações.\n\nRegras de prioridade de maturidade (CRÍTICO):\n- Cada vinho possui: peakYear, drinkingWindow, e maturityStatus (pré-calculado).\n- O campo maturityStatus contém a verdade sobre a maturidade do vinho. NUNCA contradiga esse campo.\n- Se maturityStatus diz "X anos até o pico", o vinho NÃO passou do pico.\n- PRIORIZE vinhos com maturityStatus "PAST PEAK" ou "AT PEAK" — devem ser bebidos logo.\n- Em seguida, prefira "NEAR PEAK". Evite vinhos com muitos anos até o pico, a menos que sejam a única opção.\n- Na justificativa, cite o maturityStatus exato do vinho recomendado.\n\nRegras de recomendação:\n- Recomende EXATAMENTE UM vinho da lista.\n- Dê justificativa breve e natural; inclua temperatura de serviço e decantação.\n- Se fizer sentido, sugira até 2 alternativas por id.\n- Responda em português (pt-BR).`
      : `You are a warm, conversational, world-class sommelier.\nThe current year is ${currentYear}.\n\nResponse modes:\n1. RECOMMENDATION: When the user asks for a wine suggestion (food, occasion, mood, weather), recommend a wine.\n2. QUESTION: ONLY if the message is completely impossible to interpret.\n3. CONVERSATION: For follow-up questions about a previously recommended wine (e.g., "what is its peak year?", "tell me more", "what grapes?"), answer using data from the wine list. Use the maturityStatus field for maturity data — NEVER make up information.\n\nMaturity priority rules (CRITICAL):\n- Each wine has: peakYear, drinkingWindow, and maturityStatus (pre-computed).\n- The maturityStatus field is the source of truth about the wine's maturity. NEVER contradict this field.\n- If maturityStatus says "X years until peak", the wine is NOT past its peak.\n- PRIORITIZE wines with maturityStatus "PAST PEAK" or "AT PEAK" — these should be drunk soon.\n- Next, prefer "NEAR PEAK". Avoid wines many years from peak unless they are the only option.\n- In your rationale, quote the exact maturityStatus of the recommended wine.\n\nRecommendation rules:\n- Recommend EXACTLY ONE wine from the list.\n- Provide a brief, natural rationale; include serving temperature and decanting guidance.\n- If appropriate, suggest up to 2 alternatives by id.\n- Respond in English.`;

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
      ? `Retorne SOMENTE JSON. Use um dos 3 formatos:\n\n1. Esclarecimento: {"type":"question","question":string}\n2. Recomendação: {\n  "type": "recommendation",\n  "wineId": string,\n  "bottle": string,\n  "reason": string,\n  "servingTemperature": string,\n  "decanting": string,\n  "alternatives": string[]\n}\n3. Resposta de acompanhamento (para perguntas sobre um vinho já recomendado): {\n  "type": "answer",\n  "answer": string\n}`
      : `Return ONLY JSON. Use one of 3 formats:\n\n1. Clarification: {"type":"question","question":string}\n2. Recommendation: {\n  "type": "recommendation",\n  "wineId": string,\n  "bottle": string,\n  "reason": string,\n  "servingTemperature": string,\n  "decanting": string,\n  "alternatives": string[]\n}\n3. Follow-up answer (for questions about a previously recommended wine): {\n  "type": "answer",\n  "answer": string\n}`;

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
