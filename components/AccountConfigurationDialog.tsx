'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { SOMMELIER_AVATARS } from '@/lib/sommelier-avatar';
import { useSommelierAvatar } from './SommelierAvatarContext';
import CellarDialog from './CellarDialog';

export default function AccountConfigurationDialog({ pt, onClose, onSaved }: {
  pt: boolean; onClose: () => void; onSaved: () => void;
}) {
  const { avatar, saveAvatar } = useSommelierAvatar();
  const [selection, setSelection] = useState(avatar.id);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const locale = pt ? 'pt' : 'en';

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending || selection === avatar.id) return;
    setPending(true); setError('');
    try { await saveAvatar(selection); onSaved(); }
    catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      setError(pt ? 'Não foi possível salvar seu avatar. Tente novamente.' : error instanceof Error ? error.message : 'Unable to save your avatar. Please try again.');
    } finally { setPending(false); }
  }

  return <CellarDialog title={pt ? 'Configurações' : 'Configuration'} onClose={onClose} pending={pending}>
    <form className="avatar-configuration" onSubmit={submit} aria-busy={pending}>
      <p className="eyebrow">{pt ? 'CONFIGURAÇÕES / SOMMELIER' : 'CONFIGURATION / SOMMELIER'}</p>
      <h2>{pt ? 'Escolha sua companhia.' : 'Choose your company.'}</h2>
      <p className="avatar-intro">{pt ? 'Um rosto para as boas conversas e as próximas descobertas da sua adega.' : 'A familiar face for good conversations and your next cellar discovery.'}</p>
      <fieldset disabled={pending} className="avatar-choices">
        <legend className="sr-only">{pt ? 'Avatar do sommelier' : 'Sommelier avatar'}</legend>
        {SOMMELIER_AVATARS.map(option => <label key={option.id} className={`avatar-choice ${selection === option.id ? 'is-selected' : ''}`}>
          <input type="radio" name="sommelier-avatar" value={option.id} checked={selection === option.id} onChange={() => { setSelection(option.id); setError(''); }} />
          <span className="avatar-choice-check" aria-hidden="true">{selection === option.id && <Check size={13} />}</span>
          <span className="avatar-choice-art"><img src={option.image} alt="" width={144} height={170} draggable={false} /></span>
          <strong>{option.name[locale]}</strong><span className="avatar-choice-description">{option.description[locale]}</span>
        </label>)}
      </fieldset>
      <p className="avatar-save-note">{pt ? 'Sua escolha aparece na página inicial e acima da conversa. Ela acompanha sua conta em todas as suas adegas.' : 'Your choice appears on the home page and above the chat. It follows your account across your cellars.'}</p>
      {error && <p className="avatar-save-error" role="alert">{error}</p>}
      <div className="avatar-dialog-actions">
        <button type="button" className="text-button" disabled={pending} onClick={onClose}>{pt ? 'Cancelar' : 'Cancel'}</button>
        <button type="submit" className="flint-button" disabled={pending || selection === avatar.id}>{pending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}{pending ? (pt ? 'Salvando…' : 'Saving…') : (pt ? 'Salvar avatar' : 'Save avatar')}</button>
      </div>
    </form>
  </CellarDialog>;
}
