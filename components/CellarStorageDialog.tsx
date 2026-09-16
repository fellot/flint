'use client';

import { useState } from 'react';
import { Edit3, Plus, Refrigerator, Trash2 } from 'lucide-react';
import type { CellarFridge, CellarStorage, FridgeInput } from '@/types/database';
import type { Wine } from '@/types/wine';
import CellarDialog from './CellarDialog';

export default function CellarStorageDialog({ storage, wines, locale, onSave, onDelete, onClose }: {
  storage: CellarStorage; wines: Wine[]; locale: 'en' | 'pt'; onSave: (input: FridgeInput) => Promise<void>; onDelete: (id: string) => Promise<void>; onClose: () => void;
}) {
  const pt = locale === 'pt';
  const [editing, setEditing] = useState<FridgeInput | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const newFridge = () => { setEditing({ name: '', levelCount: 6, firstLevel: 1 }); setRemoving(null); setError(''); setNotice(''); };
  const edit = (fridge: CellarFridge) => { setEditing({ id: fridge.id, name: fridge.name, levelCount: fridge.level_count, firstLevel: fridge.first_level }); setRemoving(null); setError(''); setNotice(''); };
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!editing || pending) return;
    setPending(true); setError('');
    try { await onSave(editing); setEditing(null); setNotice(pt ? 'Adega salva. Os locais dos vinhos foram atualizados.' : 'Wine fridge saved. Bottle locations are up to date.'); }
    catch (error) { setError(error instanceof Error ? error.message : 'Unable to save wine fridge.'); }
    finally { setPending(false); }
  }
  async function remove(id: string) {
    if (pending) return;
    setPending(true); setError('');
    try { await onDelete(id); setRemoving(null); setNotice(pt ? 'Adega removida.' : 'Wine fridge removed.'); }
    catch (error) { setError(error instanceof Error ? error.message : 'Unable to remove wine fridge.'); }
    finally { setPending(false); }
  }
  return <CellarDialog title={pt ? 'Gerenciar adegas' : 'Manage wine fridges'} pending={pending} onClose={onClose}>
    <p className="eyebrow">{pt ? 'CADA GARRAFA EM SEU LUGAR' : 'A PLACE FOR EVERY BOTTLE'}</p>
    <h2>{pt ? 'Suas adegas.' : 'Your wine fridges.'}</h2>
    <p className="dialog-description">{pt ? 'Dê um nome à adega e escolha seus níveis. Depois, basta selecionar onde guardar cada vinho.' : 'Name your fridge and set its levels. Every bottle gets a spot you can pick from the list.'}</p>
    {error && <p className="flint-alert" role="alert">{error}</p>}
    {notice && <p className="people-success" role="status">{notice}</p>}
    {editing ? <form className="drink-form fridge-editor" onSubmit={save}><fieldset disabled={pending}>
      <label>{pt ? 'Nome da adega' : 'Fridge name'}<input autoFocus required maxLength={80} value={editing.name} placeholder="Wine Fridge A" onChange={event => setEditing({ ...editing, name: event.target.value })} /></label>
      <div className="tasting-basics"><label>{pt ? 'Número de níveis' : 'Number of levels'}<input type="number" required min={1} max={50} value={editing.levelCount || ''} onChange={event => setEditing({ ...editing, levelCount: Number(event.target.value) })} /></label><label>{pt ? 'Primeiro nível' : 'First level'}<select value={editing.firstLevel} onChange={event => setEditing({ ...editing, firstLevel: Number(event.target.value) })}><option value={1}>L1</option><option value={0}>L0</option></select></label></div>
      <p className="sharing-note">{pt ? 'Níveis' : 'Levels'}: L{editing.firstLevel}–L{editing.firstLevel + Math.max(1, editing.levelCount) - 1}. {pt ? 'Renomear atualiza os locais dos vinhos. Mova os vinhos antes de remover níveis ocupados.' : 'Renaming updates bottle locations. Move wines before removing occupied levels.'}</p>
      <div className="detail-actions"><button type="submit" className="flint-button">{pending ? (pt ? 'Salvando…' : 'Saving…') : (pt ? 'Salvar adega' : 'Save wine fridge')}</button><button type="button" className="text-button" onClick={() => { setEditing(null); setError(''); }}>{pt ? 'Cancelar' : 'Cancel'}</button></div>
    </fieldset></form> : <>
      <div className="fridge-list">{storage.fridges.map(fridge => {
        const levels = storage.locations.filter(location => location.fridge_id === fridge.id).sort((a, b) => a.level! - b.level!);
        const occupied = wines.some(wine => levels.some(level => level.label === wine.location));
        return <section className="fridge-card" key={fridge.id}>
          <header><Refrigerator size={24} strokeWidth={1.4} /><div><h3>{fridge.name}</h3><p>{fridge.level_count} {pt ? 'níveis' : 'levels'} · L{fridge.first_level}–L{fridge.first_level + fridge.level_count - 1}</p></div><button type="button" className="icon-button" disabled={pending} aria-label={`${pt ? 'Editar' : 'Edit'} ${fridge.name}`} onClick={() => edit(fridge)}><Edit3 size={16} /></button></header>
          <div className="fridge-shelves">{levels.map(level => {
            const count = wines.filter(wine => wine.location === level.label && wine.status === 'in_cellar').reduce((sum, wine) => sum + wine.quantity, 0);
            return <div className="fridge-shelf" key={level.label}><strong>L{level.level}</strong><span className="shelf-bottles" aria-hidden="true">{Array.from({ length: Math.min(count, 8) }, (_, i) => <i key={i} />)}</span><span>{count} {pt ? (count === 1 ? 'garrafa' : 'garrafas') : (count === 1 ? 'bottle' : 'bottles')}</span></div>;
          })}</div>
          <footer>{removing === fridge.id ? <><span>{pt ? 'Remover esta adega vazia?' : 'Remove this empty fridge?'}</span><button type="button" disabled={pending} onClick={() => remove(fridge.id)}>{pt ? 'Remover' : 'Remove'}</button><button type="button" disabled={pending} onClick={() => setRemoving(null)}>{pt ? 'Cancelar' : 'Cancel'}</button></> : <button type="button" disabled={pending || occupied} onClick={() => { setRemoving(fridge.id); setNotice(''); }} title={occupied ? (pt ? 'Mova todos os vinhos antes de remover a adega.' : 'Move all wines before removing this fridge.') : undefined}><Trash2 size={12} />{pt ? 'Remover adega vazia' : 'Remove empty fridge'}</button>}</footer>
        </section>;
      })}</div>
      {!storage.fridges.length && <p className="sharing-note">{pt ? 'Comece com sua primeira adega.' : 'Start with your first wine fridge.'}</p>}
      <button type="button" className="flint-button" disabled={pending} onClick={newFridge}><Plus size={15} />{pt ? 'Adicionar adega' : 'Add wine fridge'}</button>
      {storage.locations.some(location => !location.fridge_id && location.label) && <p className="sharing-note storage-legacy-note">{pt ? 'Outros locais existentes foram preservados. Para reorganizar essas garrafas, edite o vinho e escolha um nível.' : 'Other existing locations have been preserved. To reorganize those bottles, edit a wine and choose a level.'}</p>}
    </>}
  </CellarDialog>;
}
