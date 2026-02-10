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

      // Handle follow-up answer flow
      if (out?.type === 'answer' && out?.answer) {
        setMessages(prev => [...prev, { role: 'assistant', content: String(out.answer) }]);
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

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pending]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[92vw] max-w-md animate-[slideUp_0.3s_ease-out]">
      <div className="rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.2)] flex flex-col h-[70vh] overflow-hidden border border-white/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#722F37] to-[#4a1c22] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/20">
              <WineIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">AI Sommelier</h3>
              <p className="text-[10px] text-white/60">{isPT ? 'Seu assistente pessoal de vinhos' : 'Your personal wine assistant'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4 text-white/80" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-stone-50 to-white">
          {messages.map((m, i) => (
            <div key={i} className={`flex items-end gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="flex-shrink-0 h-7 w-7 rounded-full bg-gradient-to-br from-[#722F37] to-[#4a1c22] flex items-center justify-center shadow-sm">
                  <WineIcon className="h-3.5 w-3.5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[78%] whitespace-pre-wrap text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-gradient-to-br from-[#722F37] to-[#5a252c] text-white rounded-2xl rounded-br-md px-4 py-2.5 shadow-sm'
                    : 'bg-white text-gray-800 rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm border border-gray-100'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {pending && (
            <div className="flex items-end gap-2 justify-start">
              <div className="flex-shrink-0 h-7 w-7 rounded-full bg-gradient-to-br from-[#722F37] to-[#4a1c22] flex items-center justify-center shadow-sm">
                <WineIcon className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="bg-white text-gray-800 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100 inline-flex items-center">
                <div className="flex space-x-1.5">
                  <div className="h-2 w-2 rounded-full bg-[#722F37]/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="h-2 w-2 rounded-full bg-[#722F37]/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="h-2 w-2 rounded-full bg-[#722F37]/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-100 px-3 py-3">
          <div className="flex items-center space-x-2 bg-gray-50 rounded-xl px-3 py-1 border border-gray-200 focus-within:border-[#722F37]/40 focus-within:ring-2 focus-within:ring-[#722F37]/10 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
              className="flex-1 bg-transparent text-sm py-2 outline-none placeholder:text-gray-400"
              placeholder={isPT ? 'O que vai comer/ocasião/humor/clima?' : 'What are you eating/occasion/mood/weather?'}
              disabled={pending}
            />
            <button
              onClick={submit}
              disabled={pending || !input.trim()}
              className="h-8 w-8 flex-shrink-0 rounded-lg bg-gradient-to-r from-[#722F37] to-[#5a252c] text-white flex items-center justify-center hover:from-[#5a252c] hover:to-[#4a1c22] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
              title={isPT ? 'Enviar' : 'Send'}
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
