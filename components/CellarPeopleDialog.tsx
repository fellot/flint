'use client';

import { useState } from 'react';
import CellarDialog from './CellarDialog';
import type { Person } from '@/types/database';

export default function CellarPeopleDialog({ people, locale, onAdd, onClose }: {
  people: Person[]; locale: 'en' | 'pt'; onAdd: (name: string, email: string) => Promise<{ invitationSent: boolean; warning: string }>; onClose: () => void;
}) {
  const pt = locale === 'pt';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function add(personName: string, personEmail: string) {
    if (pending) return;
    setPending(true); setError(''); setMessage('');
    try {
      const result = await onAdd(personName, personEmail);
      if (result.warning) setError(result.warning);
      else { setMessage(result.invitationSent ? (pt ? 'Convite enviado por email.' : 'Account invitation sent by email.') : (pt ? 'Acesso à adega concedido.' : 'Cellar access granted.')); setName(''); setEmail(''); }
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to add this person.'); }
    finally { setPending(false); }
  }
  return <CellarDialog title={pt ? 'Pessoas na adega' : 'Cellar people'} pending={pending} onClose={onClose}>
    <p className="eyebrow">{pt ? 'MELHOR EM BOA COMPANHIA' : 'BETTER IN GOOD COMPANY'}</p><h2>{pt ? 'Sua mesa, sua turma.' : 'Your table, your people.'}</h2>
    <p className="dialog-description">{pt ? 'Adicione alguém à sua adega. Novos usuários recebem um email para criar sua senha.' : 'Give someone access to your cellar. New users receive an email to set their password.'}</p>
    <ul className="cellar-people-list">{people.map(person => <li key={person.id}><div><strong>{person.name}{person.isMe && (pt ? ' (você)' : ' (you)')}</strong><span>{person.email}</span></div><span className={`person-status ${person.active ? 'active' : ''}`}>{person.active ? (pt ? 'Ativo' : 'Active') : (pt ? 'Pendente' : 'Pending')}</span>{!person.active && <button className="text-button" disabled={pending} onClick={() => add(person.name, person.email)}>{pt ? 'Reenviar' : 'Retry invite'}</button>}</li>)}</ul>
    <form className="drink-form" onSubmit={event => { event.preventDefault(); void add(name, email); }}><fieldset disabled={pending}><label>{pt ? 'Nome' : 'Name'}<input required maxLength={120} value={name} onChange={event => setName(event.target.value)} autoComplete="off" /></label><label>Email<input type="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} autoComplete="off" /></label></fieldset>
      {error && <p className="flint-alert" role="alert">{error}</p>}{message && <p role="status" className="people-success">{message}</p>}
      <button className="flint-button" disabled={pending}>{pending ? (pt ? 'Adicionando…' : 'Adding…') : (pt ? 'Adicionar pessoa' : 'Add person')}</button>
    </form>
  </CellarDialog>;
}
