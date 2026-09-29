'use client';

import { useEffect, useState } from 'react';
import { useCellar } from '@/components/CellarSession';
import { Wine } from '@/types/wine';
import { formatSommelierReply } from '@/utils/sommelier-chat';
import { Send, Wine as WineIcon, Loader2 } from 'lucide-react';

type Msg = { role: 'user' | 'assistant'; content: string };

export default function SommelierPage() {
  const { dataSource, isPortugueseMode } = useCellar();
  const [wines, setWines] = useState<Wine[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([{
    role: 'assistant',
    content: 'Tell me what you are eating, your mood, occasion or weather, and I will suggest the perfect bottle from your cellar.',
  }]);
  const [pending, setPending] = useState(false);
  const [lastWineId, setLastWineId] = useState<string | undefined>();

  useEffect(() => {
    fetchWines();
  }, [dataSource]);

  const fetchWines = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/wines?dataSource=${dataSource}`);
      if (!res.ok) throw new Error('Unable to load wines.');
      const json = await res.json();
      setWines(json);
    } catch (e) {
      console.error('Failed to load wines', e);
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    const trimmed = input.trim();
    if (!trimmed || pending) return;
    const userMsg: Msg = { role: 'user', content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setPending(true);
    try {
      const res = await fetch('/api/ai/sommelier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cellarId: dataSource, lastWineId,
          messages: [...messages, userMsg].filter(m => m.role === 'user').slice(-12).map(({ role, content }) => ({ role, content: content.slice(0, 4000) })),
          locale: isPortugueseMode ? 'pt' : 'en',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'AI request failed');
      }
      const out = await res.json();

      if (out.type === 'recommendation') setLastWineId(out.wineId);
      setMessages(prev => [...prev, { role: 'assistant', content: formatSommelierReply(out, isPortugueseMode) }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'assistant', content: e instanceof Error ? e.message : (isPortugueseMode ? 'Desculpe, algo deu errado.' : 'Sorry, something went wrong.') }]);
    } finally {
      setPending(false);
    }
  };

  const placeholder = isPortugueseMode ? 'O que você vai comer/ocasião/humor/clima?' : 'What are you eating/occasion/mood/weather?';

  return (
    <div className="flint-subpage">
      <header className="subpage-heading">
        <p className="eyebrow">{isPortugueseMode ? 'SEU SOMMELIER PESSOAL' : 'YOUR SOMMELIER, ON CALL'}</p>
        <h1>{isPortugueseMode ? 'O que vai bem com hoje?' : 'What pairs with today?'}</h1>
        <p>{isPortugueseMode ? 'Conte sobre o prato, a ocasião ou seu humor. Vamos encontrar a garrafa certa na sua adega.' : 'Tell us about the meal, the occasion, or your mood. We’ll find a bottle from your cellar to match.'}</p>
        <a href="/my-palate" className="text-button" style={{ marginTop: 16, color: 'var(--burgundy)' }}>{isPortugueseMode ? 'Meu paladar · preferências e diário' : 'My palate · preferences & journal'}</a>
      </header>

      <main className="max-w-5xl">
        <div className="sommelier-chat">
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
              maxLength={4000}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
              className="flex-1 min-w-0 input-field"
              aria-label={isPortugueseMode ? "Pergunte ao sommelier" : "Ask the sommelier"}
              placeholder={placeholder}
              disabled={loading || pending}
            />
            <button
              onClick={submit}
              disabled={loading || pending || !input.trim()}
              className="flint-button"
              title={isPortugueseMode ? 'Enviar' : 'Send'}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="sommelier-inventory">
          <div className="flex items-center mb-2">
            <WineIcon className="h-5 w-5 text-red-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">{isPortugueseMode ? 'Sua Adega (disponíveis)' : 'Your Cellar (available)'}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {wines.filter(w => w.status === 'in_cellar' && w.quantity > 0).map(w => (
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
