'use client';

import { useEffect, useMemo, useState } from 'react';
import { Wine } from '@/types/wine';
import { Send, Wine as WineIcon, Loader2, Globe } from 'lucide-react';

type Msg = { role: 'user' | 'assistant'; content: string };

export default function SommelierPage() {
  const [dataSource, setDataSource] = useState<'1'|'2'>('1');
  const [isPortugueseMode, setIsPortugueseMode] = useState(false);
  const [wines, setWines] = useState<Wine[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([{
    role: 'assistant',
    content: 'Tell me what you are eating, your mood, occasion or weather, and I will suggest the perfect bottle from your cellar.',
  }]);
  const [pending, setPending] = useState(false);
  const [lastRec, setLastRec] = useState<null | {
    wineId: string;
    bottle: string;
    reason: string;
    servingTemperature: string;
    decanting: string;
    alternatives?: string[];
  }>(null);

  useEffect(() => {
    fetchWines();
  }, [dataSource]);

  const fetchWines = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/wines?dataSource=${dataSource}`);
      const json = await res.json();
      setWines(json);
    } catch (e) {
      console.error('Failed to load wines', e);
    } finally {
      setLoading(false);
      setIsPortugueseMode(dataSource === '2');
    }
  };

  const submit = async () => {
    const trimmed = input.trim();
    if (!trimmed || pending) return;
    const userMsg: Msg = { role: 'user', content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setPending(true);
    setLastRec(null);
    try {
      const res = await fetch('/api/ai/sommelier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wines,
          messages: [...messages, userMsg],
          locale: isPortugueseMode ? 'pt' : 'en',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'AI request failed');
      }
      const out = await res.json();
      const recText = isPortugueseMode
        ? `Recomendação: ${out.bottle}\n\nMotivo: ${out.reason}\n\nServiço: ${out.servingTemperature} | Decantação: ${out.decanting}${out.alternatives?.length ? `\n\nAlternativas: ${out.alternatives.join(', ')}` : ''}`
        : `Recommendation: ${out.bottle}\n\nReason: ${out.reason}\n\nService: ${out.servingTemperature} | Decanting: ${out.decanting}${out.alternatives?.length ? `\n\nAlternatives: ${out.alternatives.join(', ')}` : ''}`;
      setMessages(prev => [...prev, { role: 'assistant', content: recText }]);
      setLastRec(out);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'assistant', content: isPortugueseMode ? 'Desculpe, algo deu errado.' : 'Sorry, something went wrong.' }]);
    } finally {
      setPending(false);
    }
  };

  const headerTitle = isPortugueseMode ? 'Sommelier' : 'Sommelier';
  const placeholder = isPortugueseMode ? 'O que você vai comer/ocasião/humor/clima?' : 'What are you eating/occasion/mood/weather?';
  const toggleLabelLeft = '🇨🇦';
  const toggleLabelRight = '🇧🇷';

  return (
    <div className="min-h-screen bg-red-900">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-red-700 to-red-800 bg-clip-text text-transparent">{headerTitle}</h1>
          <div className="flex items-center space-x-3 px-4 py-2 bg-gray-100 rounded-lg">
            <Globe className="h-5 w-5 text-gray-600" />
            <span className={`text-2xl ${dataSource === '1' ? 'opacity-100' : 'opacity-50'}`}>{toggleLabelLeft}</span>
            <button
              onClick={() => setDataSource(prev => prev === '1' ? '2' : '1')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                dataSource === '2' ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${dataSource === '2' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className={`text-2xl ${dataSource === '2' ? 'opacity-100' : 'opacity-50'}`}>{toggleLabelRight}</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow p-4 h-[70vh] flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`${m.role === 'user' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-900'} rounded-lg px-3 py-2 max-w-[80%] whitespace-pre-wrap`}>{m.content}</div>
              </div>
            ))}
            {pending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 rounded-lg px-3 py-2 inline-flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {isPortugueseMode ? 'Pensando...' : 'Thinking...'}
                </div>
              </div>
            )}
          </div>
          <div className="mt-3 border-t pt-3 flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
              className="flex-1 input-field"
              placeholder={placeholder}
              disabled={loading || pending}
            />
            <button
              onClick={submit}
              disabled={loading || pending || !input.trim()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors inline-flex items-center"
              title={isPortugueseMode ? 'Enviar' : 'Send'}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="mt-4 bg-white rounded-lg shadow p-4">
          <div className="flex items-center mb-2">
            <WineIcon className="h-5 w-5 text-red-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">{isPortugueseMode ? 'Sua Adega (disponíveis)' : 'Your Cellar (available)'}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {wines.filter(w => w.status === 'in_cellar').map(w => (
              <div key={w.id} className="border rounded-md p-2">
                <div className="font-medium text-gray-900">{w.bottle}</div>
                <div className="text-gray-600">{w.style} • {w.region} • {w.vintage}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

