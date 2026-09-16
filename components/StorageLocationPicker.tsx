'use client';

import type { CellarStorage } from '@/types/database';
import { Settings2 } from 'lucide-react';
import { useEffect, useRef } from 'react';

export default function StorageLocationPicker({ storage, value, onChange, onManage, disabled = false, locale = 'en' }: {
  storage: CellarStorage; value: string; onChange: (value: string) => void; onManage?: () => void; disabled?: boolean; locale?: 'en' | 'pt';
}) {
  const pt = locale === 'pt';
  const previousStorage = useRef(storage);
  useEffect(() => {
    const previous = previousStorage.current.locations.find(location => location.label === value && location.fridge_id);
    if (previousStorage.current !== storage && previous) {
      const renamed = storage.locations.find(location => location.fridge_id === previous.fridge_id && location.level === previous.level);
      if (renamed && renamed.label !== value) onChange(renamed.label);
    }
    previousStorage.current = storage;
  }, [storage, value, onChange]);
  const legacy = storage.locations.filter(location => !location.fridge_id && location.label);
  const unknown = Boolean(value && !storage.locations.some(location => location.label === value));
  return <div className="storage-picker">
    <select id="location" name="location" className="select-field" aria-label={pt ? 'Local de armazenamento' : 'Storage location'} value={value} disabled={disabled} onChange={event => onChange(event.target.value)}>
      <option value="">{pt ? 'Sem local definido' : 'Not assigned yet'}</option>
      {storage.fridges.map(fridge => <optgroup key={fridge.id} label={fridge.name}>{storage.locations.filter(location => location.fridge_id === fridge.id).sort((a, b) => a.level! - b.level!).map(location => <option key={location.label} value={location.label}>{location.label}</option>)}</optgroup>)}
      {legacy.length > 0 && <optgroup label={pt ? 'Outros locais existentes' : 'Other existing locations'}>{legacy.map(location => <option key={location.label} value={location.label}>{location.label}</option>)}</optgroup>}
      {unknown && <option value={value} disabled>{value} — {pt ? 'selecione um local atual' : 'choose a current location'}</option>}
    </select>
    {onManage && !disabled && <button type="button" className="storage-manage-link" onClick={onManage}><Settings2 size={13} />{pt ? 'Gerenciar adegas' : 'Manage wine fridges'}</button>}
    {!storage.fridges.length && !disabled && <p className="storage-picker-hint">{pt ? 'O dono pode criar uma adega e seus níveis para organizar as garrafas.' : 'The owner can add a wine fridge and its levels to organize your bottles.'}</p>}
  </div>;
}
