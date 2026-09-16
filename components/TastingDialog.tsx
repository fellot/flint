'use client';

import { useState } from 'react';
import CellarDialog from './CellarDialog';
import { ReviewFields } from './PersonalReviewDialog';
import type { Person, TastingInput } from '@/types/database';

export default function TastingDialog({ bottle, vintage, maxQuantity, people, locale, initialComment = '', onSave, onClose }: {
  bottle: string; vintage: number; maxQuantity?: number; people: Person[]; locale: 'en' | 'pt'; initialComment?: string;
  onSave: (input: TastingInput) => Promise<void>; onClose: () => void;
}) {
  const pt = locale === 'pt';
  const own = people.find(person => person.isMe);
  const [personIds, setPersonIds] = useState<string[]>(own ? [own.id] : []);
  const [quantity, setQuantity] = useState(1);
  const [date, setDate] = useState(() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; });
  const [rating, setRating] = useState('');
  const [comment, setComment] = useState(initialComment);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const reviewing = Boolean(own && personIds.includes(own.id));
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    if (!personIds.length) { setError(pt ? 'Selecione quem compartilhou o vinho.' : 'Choose who shared this bottle.'); return; }
    setPending(true); setError('');
    try { await onSave({ quantity, consumedDate: date, personIds, rating: reviewing && rating !== '' ? Number(rating) : null, comment: reviewing ? comment : '' }); onClose(); }
    catch (error) { setError(error instanceof Error ? error.message : 'Unable to record this bottle.'); }
    finally { setPending(false); }
  }
  return <CellarDialog title={pt ? 'Registrar consumo' : 'Record a shared bottle'} pending={pending} onClose={onClose}>
    <p className="eyebrow">{pt ? 'À BOA COMPANHIA' : 'HERE’S TO GOOD COMPANY'}</p><h2>{pt ? 'Quem compartilhou a taça?' : 'Who shared the bottle?'}</h2>
    <p className="dialog-description">{bottle} · {vintage || 'NV'}</p>
    <form onSubmit={save} className="drink-form"><fieldset disabled={pending}>
      <div className="tasting-basics"><label>{pt ? 'Garrafas' : 'Bottles'}<input type="number" required min={1} max={maxQuantity} value={quantity} onChange={event => setQuantity(Number(event.target.value))} /></label><label>{pt ? 'Consumido em' : 'Enjoyed on'}<input type="date" required value={date} onChange={event => setDate(event.target.value)} /></label></div>
      <fieldset className="participant-picker"><legend>{pt ? 'Compartilhado com' : 'Shared with'}</legend>{people.map(person => <label key={person.id} className={!person.active ? 'participant-pending' : ''}><input type="checkbox" checked={personIds.includes(person.id)} disabled={!person.active} onChange={event => setPersonIds(previous => event.target.checked ? [...previous, person.id] : previous.filter(id => id !== person.id))} /><span>{person.name}{person.isMe && <small>{pt ? 'Você' : 'You'}</small>}{!person.active && <small>{pt ? 'Convite pendente' : 'Invitation pending'}</small>}</span></label>)}<p>{pt ? 'O vinho aparecerá no diário de cada participante. Cada um adiciona sua própria avaliação.' : 'This wine will appear in each participant’s journal. Everyone adds their own review.'}</p></fieldset>
      {reviewing && <ReviewFields rating={rating} comment={comment} onRating={setRating} onComment={setComment} pt={pt} />}
    </fieldset>{error && <p className="flint-alert" role="alert">{error}</p>}<button className="flint-button" disabled={pending || !people.some(person => person.active)}>{pending ? (pt ? 'Salvando…' : 'Saving…') : (pt ? 'Marcar como consumido' : 'Mark as consumed')}</button></form>
  </CellarDialog>;
}
