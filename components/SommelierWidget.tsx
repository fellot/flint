'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Wine } from '@/types/wine';
import { X, Send, Loader2, Wine as WineIcon } from 'lucide-react';

type Msg = { role: 'user' | 'assistant'; content: string };

interface SommelierWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  wines: Wine[];
  locale?: 'en' | 'pt';
}

export default function SommelierWidget({ isOpen, onClose, wines, locale = 'en' }: SommelierWidgetProps) {
  const isPT = locale === 'pt';
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{ role: 'assistant', content: isPT ? 'Diga o que vai comer, seu humor, ocasião ou clima e eu sugerirei a garrafa perfeita da sua adega.' : 'Tell me what you are eating, your mood, occasion or weather, and I will suggest the perfect bottle from your cellar.' }]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Only pass data needed by the model; API will also re-filter by status
  const wineList = useMemo(() => wines, [wines]);

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
        body: JSON.stringify({ wines: wineList, messages: [...messages, userMsg], locale }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'AI request failed');
      }
      const out = await res.json();

      // Handle clarifying question flow
      if (out?.type === 'question' && out?.question) {
        setMessages(prev => [...prev, { role: 'assistant', content: String(out.question) }]);
        return;
      }

      // Enhance with location and alternate names on the client
      const picked = wineList.find(w => String(w.id) === String(out.wineId));
      const location = picked?.location ? String(picked.location) : undefined;
      const regionYear = picked ? `${picked.region || ''}${picked.region ? ' • ' : ''}${picked.vintage || ''}` : '';
      const locationLine = location
        ? (isPT ? `\n\nOnde está: ${location}` : `\n\nWhere to find it: ${location}`)
        : '';

      const altNames = Array.isArray(out.alternatives)
        ? out.alternatives
            .map((id: string) => wineList.find(w => String(w.id) === String(id))?.bottle)
            .filter(Boolean)
        : [];

      const reply = isPT
        ? `Eu escolheria: ${out.bottle}${regionYear ? ` (${regionYear})` : ''}.\n\nPor quê: ${out.reason}\n\nPara aproveitar melhor, sirva a ${out.servingTemperature} · Decantação: ${out.decanting}.${locationLine}${altNames.length ? `\n\nAlternativas: ${altNames.join(', ')}` : ''}`
        : `I’d go with: ${out.bottle}${regionYear ? ` (${regionYear})` : ''}.\n\nWhy: ${out.reason}\n\nFor best enjoyment, serve at ${out.servingTemperature} · Decanting: ${out.decanting}.${locationLine}${altNames.length ? `\n\nAlternatives: ${altNames.join(', ')}` : ''}`;
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: isPT ? 'Desculpe, algo deu errado.' : 'Sorry, something went wrong.' }]);
    } finally {
      setPending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[92vw] max-w-md">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col h-[70vh]">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center">
            <WineIcon className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="text-sm font-semibold">{isPT ? 'Sommelier' : 'Sommelier'}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`${m.role === 'user' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-900'} rounded-lg px-3 py-2 max-w-[80%] whitespace-pre-wrap text-sm`}>{m.content}</div>
            </div>
          ))}
          {pending && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 rounded-lg px-3 py-2 inline-flex items-center text-sm">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {isPT ? 'Pensando...' : 'Thinking...'}
              </div>
            </div>
          )}
        </div>
        <div className="p-3 border-t flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
            className="flex-1 input-field text-sm"
            placeholder={isPT ? 'O que vai comer/ocasião/humor/clima?' : 'What are you eating/occasion/mood/weather?'}
            disabled={pending}
          />
          <button
            onClick={submit}
            disabled={pending || !input.trim()}
            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors inline-flex items-center"
            title={isPT ? 'Enviar' : 'Send'}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
