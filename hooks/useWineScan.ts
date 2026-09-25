'use client';

import { useEffect, useRef, useState } from 'react';
import type { WineFormData } from '@/types/wine';
import { newScanForm, scannedWineFields, type WineScanResult } from '@/lib/wine-scan';
import { newWineInput } from '@/lib/wine-data';
import { prepareWinePhoto } from '@/utils/prepareWinePhoto';
import { sanitizeBottleImage } from '@/utils/sanitizeWine';

type Step = 'upload' | 'processing' | 'review' | 'saving';
export function useWineScan({ isOpen, onClose, onAddWine, locale, external = false }: {
  isOpen: boolean; onClose: () => void; onAddWine: (wine: WineFormData) => void | Promise<void>; locale: 'en' | 'pt'; external?: boolean;
}) {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<WineScanResult | null>(null);
  const [formData, setFormData] = useState(() => newScanForm(external));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pending = useRef<AbortController | null>(null);
  const saving = useRef(false);
  const sessionVersion = useRef(0);
  const reset = () => {
    sessionVersion.current += 1;
    pending.current?.abort();
    pending.current = null;
    setCurrentStep('upload'); setUploadedImage(null); setProcessingError(null); setScanResult(null);
    setFormData(newScanForm(external));
  };
  useEffect(() => {
    if (!isOpen) reset();
    return () => { pending.current?.abort(); pending.current = null; };
    // Opening and closing delimit a scan; changing a field must not reset it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // Allow retrying the same file.
    if (!file || saving.current) return;
    reset();
    const controller = new AbortController();
    pending.current = controller;
    setCurrentStep('processing');
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 115_000);
    try {
      const photo = await prepareWinePhoto(file, locale);
      if (controller.signal.aborted) throw new Error('Scan cancelled.');
      setUploadedImage(photo); // Identification preview only. Never part of the saved form.
      const response = await fetch('/api/ai/extract-wine', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: photo, locale }), signal: controller.signal,
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || (locale === 'pt' ? 'Não foi possível pesquisar este vinho.' : 'This wine could not be researched.'));
      if (!result?.extracted?.bottle) throw new Error(locale === 'pt' ? 'O rótulo não foi identificado.' : 'The label could not be identified.');
      if (controller.signal.aborted) throw new Error('Scan cancelled.');
      if (pending.current !== controller) return;
      const extracted = scannedWineFields(result.extracted);
      setFormData({ ...newScanForm(external), ...extracted });
      setScanResult(result);
      setCurrentStep('review');
    } catch (error) {
      if (pending.current !== controller || (controller.signal.aborted && !timedOut)) return;
      setProcessingError(timedOut ? (locale === 'pt' ? 'A pesquisa demorou demais. Tente novamente.' : 'Wine research timed out. Please try again.')
        : error instanceof Error ? error.message : (locale === 'pt' ? 'Não foi possível processar a foto.' : 'The photo could not be processed.'));
      setCurrentStep('upload');
    } finally {
      clearTimeout(timeout);
      if (pending.current === controller) pending.current = null;
    }
  };
  const handleClose = () => { if (!saving.current) { reset(); onClose(); } };
  const handleSave = async () => {
    if (saving.current) return;
    try {
      setProcessingError(null);
      const payload = { ...formData, bottle_image: sanitizeBottleImage(formData.bottle_image) || '' };
      for (const field of ['bottle_image', 'technical_sheet'] as const) {
        if (formData[field]?.trim() && !sanitizeBottleImage(formData[field])) throw new Error(locale === 'pt' ? 'Use um link http ou https válido.' : 'Use a valid http or https link.');
      }
      newWineInput(payload); // Same validation as the server, before starting a save.
      saving.current = true;
      setCurrentStep('saving');
      await onAddWine(payload);
      reset();
      onClose();
    } catch (error) {
      setProcessingError(error instanceof Error ? error.message : (locale === 'pt' ? 'Falha ao salvar o vinho.' : 'Failed to save wine.'));
      setCurrentStep('review');
    } finally { saving.current = false; }
  };
  const handleInputChange = (field: keyof WineFormData, value: string | number | undefined | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  return { currentStep, uploadedImage, processingError, setProcessingError, scanResult, formData, setFormData,
    fileInputRef, handleImageUpload, handleSave, handleClose, handleInputChange, backToUpload: reset, sessionVersion };
}
