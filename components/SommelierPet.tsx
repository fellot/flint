'use client';

import { useEffect, useId, useRef, useState } from 'react';

type Position = { x: number; y: number };
const size = { width: 88, height: 104 };
const margin = 12;
const storageKey = 'flint.sommelier-pet.position.v1';

function bounds() {
  return { x: Math.max(margin, document.documentElement.clientWidth - size.width - margin), y: Math.max(margin, document.documentElement.clientHeight - size.height - margin) };
}
function clamp(position: Position): Position {
  const max = bounds();
  return { x: Math.max(margin, Math.min(position.x, max.x)), y: Math.max(margin, Math.min(position.y, max.y)) };
}
function remember(position: Position) {
  const max = bounds();
  try { localStorage.setItem(storageKey, JSON.stringify({ x: (position.x - margin) / Math.max(1, max.x - margin), y: (position.y - margin) / Math.max(1, max.y - margin) })); } catch { /* Placement still works when storage is unavailable. */ }
}

export default function SommelierPet({ open, onOpen, locale = 'en' }: { open: boolean; onOpen: () => void; locale?: 'en' | 'pt' }) {
  const pt = locale === 'pt';
  const hintId = useId();
  const button = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ pointer: number; start: Position; origin: Position; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const wasOpen = useRef(open);

  useEffect(() => {
    const restore = () => {
      const max = bounds();
      let next = { x: max.x - 8, y: max.y - 8 };
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
        if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) next = { x: margin + saved.x * (max.x - margin), y: margin + saved.y * (max.y - margin) };
      } catch { /* Ignore a stale or unavailable preference. */ }
      setPosition(clamp(next));
    };
    restore();
    window.addEventListener('resize', restore);
    return () => window.removeEventListener('resize', restore);
  }, []);

  useEffect(() => {
    if (wasOpen.current && !open) button.current?.focus({ preventScroll: true });
    wasOpen.current = open;
  }, [open]);

  return <>
    <button ref={button} type="button" className={`sommelier-pet ${dragging ? 'is-dragging' : ''}`}
      style={{ ...(position ? { left: position.x, top: position.y, right: 'auto', bottom: 'auto' } : {}), visibility: open ? 'hidden' : 'visible' }}
      aria-label={pt ? 'Conversar com o sommelier' : 'Chat with your sommelier'} aria-describedby={hintId} aria-haspopup="dialog"
      onPointerDown={event => {
        if (!event.isPrimary || event.button !== 0) return;
        const rect = event.currentTarget.getBoundingClientRect();
        drag.current = { pointer: event.pointerId, start: { x: event.clientX, y: event.clientY }, origin: { x: rect.left, y: rect.top }, moved: false };
        suppressClick.current = false;
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={event => {
        const current = drag.current;
        if (!current || current.pointer !== event.pointerId) return;
        const dx = event.clientX - current.start.x, dy = event.clientY - current.start.y;
        if (!current.moved && Math.hypot(dx, dy) < 6) return;
        current.moved = true; suppressClick.current = true; setDragging(true);
        setPosition(clamp({ x: current.origin.x + dx, y: current.origin.y + dy }));
      }}
      onPointerUp={event => {
        const current = drag.current;
        if (!current || current.pointer !== event.pointerId) return;
        if (current.moved) {
          const next = clamp({ x: current.origin.x + event.clientX - current.start.x, y: current.origin.y + event.clientY - current.start.y });
          setPosition(next); remember(next);
        }
        drag.current = null; setDragging(false);
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => { if (drag.current) setPosition(clamp(drag.current.origin)); drag.current = null; suppressClick.current = true; setDragging(false); }}
      onLostPointerCapture={() => { drag.current = null; setDragging(false); }}
      onClick={() => { if (!suppressClick.current) onOpen(); suppressClick.current = false; }}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') suppressClick.current = false;
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        const step = event.shiftKey ? 40 : 16;
        const next = clamp({ x: rect.left + (event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0), y: rect.top + (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0) });
        setPosition(next); remember(next);
      }}>
      <span className="sommelier-pet-bubble" aria-hidden="true">{pt ? 'Uma boa garrafa?' : 'Something good?'}</span>
      <svg className="sommelier-pet-character" viewBox="0 0 88 104" fill="none" aria-hidden="true">
        <ellipse cx="43" cy="96" rx="27" ry="5" fill="#481221" opacity=".13" />
        <path d="M33 84l-3 10h-8m31-10 4 10h8" stroke="#481221" strokeWidth="4" strokeLinecap="round" />
        <path d="M27 59C14 54 15 45 12 43" stroke="#72273d" strokeWidth="4" strokeLinecap="round" />
        <path d="M59 60c12 0 13-8 14-13" stroke="#72273d" strokeWidth="4" strokeLinecap="round" />
        <path d="M30 23h26v13c0 9 10 12 10 23v23c0 5-5 9-10 9H30c-6 0-10-4-10-9V59c0-11 10-14 10-23V23Z" fill="#6d2039" stroke="#481221" strokeWidth="2" />
        <path d="M29 27h28v13c0 7-6 12-14 12s-14-5-14-12V27Z" fill="#f5ddbd" />
        <rect x="28" y="12" width="30" height="20" rx="6" fill="#c79666" stroke="#69432f" strokeWidth="2" />
        <path d="M35 17h5m8 9h4m-16 0h2m11-8h3" stroke="#986b46" strokeWidth="2" strokeLinecap="round" />
        <path d="M35 40q3-4 6 0m6 0q3-4 6 0" stroke="#481221" strokeWidth="2" strokeLinecap="round" />
        <path d="M40 45q4 4 8 0" stroke="#994f48" strokeWidth="1.5" strokeLinecap="round" />
        <path d="m33 55 11 5-11 5V55Zm22 0-11 5 11 5V55Z" fill="#e7bc83" /><circle cx="44" cy="60" r="3" fill="#fff0d3" />
        <path d="M29 71h29v11H29z" fill="#fff0d3" /><text x="43.5" y="79" textAnchor="middle" fontFamily="Georgia, serif" fontSize="8" fill="#72273d">flint.</text>
        <g className="sommelier-pet-glass" stroke="#9c684f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 27h13l-1 10c-1 6-10 6-11 0L6 27Z" fill="#fff6e8" /><path d="m7 33 1 5q5 5 9 0l1-5H7Z" fill="#8b2746" stroke="none" /><path d="M12.5 42v8m-4 0h8" />
        </g>
        <path d="m72 21 1.5 4.5L78 27l-4.5 1.5L72 33l-1.5-4.5L66 27l4.5-1.5L72 21Z" fill="#b68a56" />
      </svg>
      <span className="sommelier-pet-label">{pt ? 'Seu sommelier' : 'Your sommelier'}</span>
    </button>
    <span id={hintId} className="sr-only">{pt ? 'Arraste para mover, ou use as setas quando selecionado. Enter abre a conversa.' : 'Drag to move, or use arrow keys while focused. Press Enter to open the chat.'}</span>
  </>;
}
