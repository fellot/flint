'use client';

import { Check, Clock3, Plus, Wine } from 'lucide-react';
import type { Person } from '@/types/database';

export function PersonAvatar({ name }: { name: string }) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials = (words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0]?.slice(0, 2) || '?').toLocaleUpperCase();
  const tone = Array.from(name).reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % 4;
  return <span className={`person-avatar person-tone-${tone}`} aria-hidden="true">{initials}</span>;
}

export default function ParticipantPicker({ people, selectedIds, onChange, pt, disabled = false, adding = false }: {
  people: Person[]; selectedIds: string[]; onChange: (ids: string[]) => void;
  pt: boolean; disabled?: boolean; adding?: boolean;
}) {
  const count = selectedIds.length;
  return <fieldset className="participant-picker" disabled={disabled}>
    <legend>{adding ? (pt ? 'Mais gente à mesa' : 'Make room for friends') : (pt ? 'Quem estava à mesa?' : 'Your table, your people')}</legend>
    <p className="participant-intro">{pt ? 'Toque em uma pessoa para incluí-la nesta memória.' : 'Tap a person to include them in this memory.'}</p>
    <div className="participant-cards">
      {people.map(person => {
        const selected = selectedIds.includes(person.id);
        return <button key={person.id} type="button" className={`participant-card${selected ? ' is-selected' : ''}`} aria-pressed={selected} aria-label={`${person.name}${person.isMe ? (pt ? ', você' : ', you') : ''}${!person.active ? (pt ? ', convite pendente' : ', invitation pending') : ''}`} disabled={!person.active} onClick={() => onChange(selected ? selectedIds.filter(id => id !== person.id) : [...selectedIds, person.id])}>
          <PersonAvatar name={person.name} />
          <span className="participant-card-copy"><strong>{person.name}{person.isMe && <span className="participant-you">{pt ? 'Você' : 'You'}</span>}</strong><small>{!person.active ? (pt ? 'Convite pendente' : 'Invitation pending') : selected ? (pt ? 'À mesa!' : 'At the table!') : (pt ? 'Adicionar à mesa' : 'Join the table')}</small></span>
          <span className="participant-card-mark" aria-hidden="true">{!person.active ? <Clock3 size={15} /> : selected ? <Check size={15} strokeWidth={2.5} /> : <Plus size={15} />}</span>
        </button>;
      })}
    </div>
    <div className="participant-summary" role="status"><Wine size={17} aria-hidden="true" /><span>{count ? (pt ? `${count} ${count === 1 ? 'pessoa selecionada' : 'pessoas selecionadas'}. Saúde!` : `${count} ${count === 1 ? 'person' : 'people'} selected. Cheers!`) : (pt ? 'Boas garrafas. Ótimas companhias.' : 'Good bottles. Great company.')}</span></div>
  </fieldset>;
}
