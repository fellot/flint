'use client';

import { useState } from 'react';
import type { Person } from '@/types/database';
import type { Wine } from '@/types/wine';
import CellarDialog from './CellarDialog';
import ParticipantPicker, { PersonAvatar } from './ParticipantPicker';
import { Wine as WineGlass } from 'lucide-react';

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
    <div className="sharing-kicker"><span className="sharing-toast" aria-hidden="true"><WineGlass size={23} /><WineGlass size={23} /></span><p className="eyebrow">{pt ? 'UMA MEMÓRIA COMPARTILHADA' : 'A SHARED MEMORY'}</p></div>
    <h2>{pt ? 'Quem mais estava lá?' : 'Who else was there?'}</h2>
    <p className="dialog-description">{wine.bottle} · {wine.vintage || 'NV'}</p>
    {existing.length > 0 && <div className="existing-participants"><strong>{pt ? 'Já à mesa' : 'Already at the table'}</strong><div className="participant-guests">{existing.map(person => <span className="participant-guest" key={person.id}><PersonAvatar name={person.name} /><span>{person.name}</span></span>)}</div></div>}
    <form className="drink-form" onSubmit={save}>
      <ParticipantPicker people={available} selectedIds={personIds} onChange={setPersonIds} pt={pt} disabled={pending} adding />
      {!available.some(person => person.active) && <p className="sharing-note">{pt ? 'Todas as pessoas ativas já estão incluídas. O dono da adega pode convidar outras pessoas em Pessoas.' : 'Everyone with an active account is already included. The cellar owner can invite others through People.'}</p>}
      <p className="sharing-note">{pt ? 'Uma memória compartilhada, um diário para cada pessoa. As avaliações existentes serão preservadas.' : 'One shared memory, a personal journal for everyone. Existing reviews stay just as they are.'}</p>
      {error && <p className="flint-alert" role="alert">{error}</p>}
      <button className="flint-button" disabled={pending || !available.some(person => person.active)}>{pending ? (pt ? 'Salvando…' : 'Saving…') : (pt ? 'Adicionar ao vinho compartilhado' : 'Add to this tasting')}</button>
    </form>
  </CellarDialog>;
}
