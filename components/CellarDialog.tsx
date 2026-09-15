'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function CellarDialog({ title, children, onClose, pending = false, wide = false }: { title: string; children: React.ReactNode; onClose: () => void; pending?: boolean; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    return () => { dialog?.close(); document.body.style.overflow = previousOverflow; };
  }, []);
  return <dialog ref={ref} aria-label={title} className={`flint-dialog ${wide ? 'dialog-wide' : ''}`} onCancel={event => { event.preventDefault(); if (!pending) onClose(); }}>
    <button className="dialog-close icon-button" type="button" onClick={onClose} disabled={pending} aria-label="Close"><X size={20} /></button>
    {children}
  </dialog>;
}
