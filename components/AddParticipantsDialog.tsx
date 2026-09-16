'use client';

import { useState } from 'react';
import type { Person } from '@/types/database';
import type { Wine } from '@/types/wine';
import CellarDialog from './CellarDialog';

export default function AddParticipantsDialog({ wine, people, locale, onSave, onClose }: {
  wine: Wine; people: Person[]; locale: 'en' | 'pt';
  onSave: (id: string, personIds: string[]) => Promise<void>; onClose: () => void;
}) {
  const pt = locale === 'pt';
  const [personIds, setPersonIds] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const existing = wine.participants || [];
  const available = people.filter(person => !existing.some(participant => participant.id === person.id));

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    if (!personIds.length) { setError(pt ? 'Selecione uma pessoa para adicionar.' : 'Choose someone to add.'); return; }
    setPending(true); setError('');
    try { await onSave(wine.id, personIds); onClose(); }
    catch (error) { setError(error instanceof Error ? error.message : 'Unable to add participants.'); }
    finally { setPending(false); }
  }

  return <CellarDialog title={pt ? 'Adicionar participantes' : 'Add participants'} pending={pending} onClose={onClose}>
    <p className="eyebrow">{pt ? 'UMA MEMÓRIA COMPARTILHADA' : 'A SHARED MEMORY'}</p>
    <h2>{pt ? 'Quem mais estava lá?' : 'Who else was there?'}</h2>
    <p className="dialog-description">{wine.bottle} · {wine.vintage || 'NV'}</p>
    {existing.length > 0 && <div className="existing-participants"><strong>{pt ? 'Já no diário de' : 'Already shared with'}</strong><p>{existing.map(person => person.name).join(', ')}</p></div>}
    <form className="drink-form" onSubmit={save}>
      <fieldset className="participant-picker" disabled={pending}>
        <legend>{pt ? 'Adicionar pessoas' : 'Add people'}</legend>
        {available.map(person => <label key={person.id} className={!person.active ? 'participant-pending' : ''}>
          <input type="checkbox" checked={personIds.includes(person.id)} disabled={!person.active} onChange={event => setPersonIds(previous => event.target.checked ? [...previous, person.id] : previous.filter(id => id !== person.id))} />
          <span>{person.name}{person.isMe && <small>{pt ? 'Você' : 'You'}</small>}{!person.active && <small>{pt ? 'Convite pendente' : 'Invitation pending'}</small>}</span>
        </label>)}
        {!available.some(person => person.active) && <p>{pt ? 'Todas as pessoas ativas já estão incluídas. O dono da adega pode convidar outras pessoas em Pessoas.' : 'Everyone with an active account is already included. The cellar owner can invite others through People.'}</p>}
        <p>{pt ? 'O vinho aparecerá no diário de cada pessoa adicionada, pronta para dar sua própria nota e comentário. As avaliações existentes serão preservadas.' : 'This wine will appear in each added person’s journal, ready for their own score and comment. Existing reviews are preserved.'}</p>
      </fieldset>
      {error && <p className="flint-alert" role="alert">{error}</p>}
      <button className="flint-button" disabled={pending || !available.some(person => person.active)}>{pending ? (pt ? 'Salvando…' : 'Saving…') : (pt ? 'Adicionar ao vinho compartilhado' : 'Add to this tasting')}</button>
    </form>
  </CellarDialog>;
}
