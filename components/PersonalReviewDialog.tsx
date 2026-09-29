'use client';

import { useState } from 'react';
import CellarDialog from './CellarDialog';
import type { Wine } from '@/types/wine';
import { tastingNotes, toggleTastingNote } from '@/lib/palate';

export function ReviewFields({ rating, comment, onRating, onComment, pt }: {
  rating: string; comment: string; onRating: (value: string) => void; onComment: (value: string) => void; pt: boolean;
}) {
  return <div className="personal-review-fields">
    <label>{pt ? 'Minha nota' : 'My score'}<div className="score-input"><input type="number" min={0} max={100} step={1} value={rating} onChange={event => onRating(event.target.value)} placeholder="—" /><span>/ 100</span></div><small>{pt ? 'Opcional. Sem nota, fica no final do diário.' : 'Optional. Unrated bottles appear at the end of your journal.'}</small></label>
    <label>{pt ? 'Meu comentário' : 'My comment'}<textarea value={comment} onChange={event => onComment(event.target.value)} maxLength={5000} rows={4} placeholder={pt ? 'O sabor, a companhia, a ocasião…' : 'The flavor, the company, the occasion…'} /><small>{pt ? 'Sua nota e seu comentário pertencem apenas ao seu diário.' : 'Your score and comment are personal to your journal.'}</small></label>
    <div className="review-note-chips" aria-label={pt ? 'Notas rápidas' : 'Quick tasting notes'}>{tastingNotes.map(note => {
      const text = pt ? note.pt : note.en;
      return <button key={note.id} type="button" aria-pressed={comment.split('\n').includes(text)} onClick={() => onComment(toggleTastingNote(comment, text).slice(0, 5000))}>{text.replace(/\.$/, '')}</button>;
    })}</div>
    <small>{pt ? 'Estas notas são adicionadas ao comentário. “Jovem demais” e “defeito” excluem esta prova do aprendizado.' : 'These notes are added to your comment. “Too young to judge” and “faulty” exclude this tasting from learning.'}</small>
  </div>;
}

export default function PersonalReviewDialog({ wine, locale, onSave, onClose }: {
  wine: Wine; locale: 'en' | 'pt'; onSave: (id: string, rating: number | null, comment: string) => Promise<void>; onClose: () => void;
}) {
  const pt = locale === 'pt';
  const [rating, setRating] = useState(wine.myRating == null ? '' : String(wine.myRating));
  const [comment, setComment] = useState(wine.myComment || '');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true); setError('');
    try { await onSave(wine.id, rating === '' ? null : Number(rating), comment); onClose(); }
    catch (error) { setError(error instanceof Error ? error.message : 'Unable to save your review.'); }
    finally { setPending(false); }
  }
  return <CellarDialog title={pt ? 'Minha avaliação' : 'My review'} pending={pending} onClose={onClose}>
    <p className="eyebrow">{pt ? 'SEU GOSTO, SUA OPINIÃO' : 'YOUR TASTE, YOUR TAKE'}</p><h2>{pt ? 'Uma taça para lembrar.' : 'A glass to remember.'}</h2>
    <p className="dialog-description">{wine.bottle} · {wine.vintage || 'NV'}</p>
    <form className="drink-form" onSubmit={save}><fieldset disabled={pending}><ReviewFields rating={rating} comment={comment} onRating={setRating} onComment={setComment} pt={pt} /></fieldset>
      {error && <p className="flint-alert" role="alert">{error}</p>}
      <div className="review-actions"><button className="flint-button" disabled={pending}>{pending ? (pt ? 'Salvando…' : 'Saving…') : (pt ? 'Salvar minha avaliação' : 'Save my review')}</button><button type="button" className="text-button" disabled={pending} onClick={() => { setRating(''); setComment(''); }}>{pt ? 'Limpar campos' : 'Clear fields'}</button></div>
    </form>
  </CellarDialog>;
}
