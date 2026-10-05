'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Download, Image as ImageIcon, Loader2, RefreshCw, Share2, Wine as WineIcon } from 'lucide-react';
import type { Wine } from '@/types/wine';
import {
  POSTCARD_HEIGHT,
  POSTCARD_NOTE_LIMIT,
  POSTCARD_WIDTH,
  buildTastingPostcardSvg,
  countPostcardNote,
  loadPostcardPhoto,
  postcardFileName,
  postcardTastingDate,
  renderPostcardPng,
  truncatePostcardNote,
} from '@/utils/tasting-postcard';
import CellarDialog from './CellarDialog';
import './tasting-postcard.css';

type PreparedPostcard = { key: string; url: string; blob: Blob; file: File };
type Photo = { key: string; data: string | null };

function initialNote(wine: Wine) {
  return truncatePostcardNote((wine.myComment || '').trim());
}

export default function TastingPostcardDialog({ wine, locale, onClose }: {
  wine: Wine; locale: 'en' | 'pt'; onClose: () => void;
}) {
  const pt = locale === 'pt';
  const id = useId();
  const hasScore = typeof wine.myRating === 'number' && Number.isFinite(wine.myRating) && wine.myRating >= 0 && wine.myRating <= 100;
  const dateLabel = postcardTastingDate(wine.consumedDate, locale);
  const hasDate = dateLabel !== null;
  const [note, setNote] = useState(() => initialNote(wine));
  const [showScore, setShowScore] = useState(hasScore);
  const [showDate, setShowDate] = useState(hasDate);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [preview, setPreview] = useState<PreparedPostcard | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [canShareImage, setCanShareImage] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState(false);
  const [downloadKey, setDownloadKey] = useState<string | null>(null);
  const mounted = useRef(false);
  const photoKey = JSON.stringify([wine.id, wine.bottle_image || '']);
  const photoReady = photo?.key === photoKey;
  const photoData = photoReady ? photo.data : null;
  const requestKey = JSON.stringify([wine, locale, note, showScore, showDate, photoKey, photoReady, attempt]);
  const currentRequest = useRef(requestKey);
  currentRequest.current = requestKey;
  const ready = photoReady && preview?.key === requestKey;
  const generating = !ready && generationError !== requestKey;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    setNote(initialNote(wine));
    setShowScore(typeof wine.myRating === 'number' && Number.isFinite(wine.myRating) && wine.myRating >= 0 && wine.myRating <= 100);
    setShowDate(postcardTastingDate(wine.consumedDate, locale) !== null);
    // Review changes belong to the journal; this editor keeps its own draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wine.id]);

  useEffect(() => {
    let cancelled = false;
    loadPostcardPhoto(wine.bottle_image).then(data => {
      if (!cancelled) setPhoto({ key: photoKey, data });
    }).catch(() => {
      if (!cancelled) setPhoto({ key: photoKey, data: null });
    });
    return () => { cancelled = true; };
  }, [photoKey, wine.bottle_image]);

  useEffect(() => {
    setShareError(false);
    if (!photoReady) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const svg = buildTastingPostcardSvg(wine, { locale, note, showScore, showDate }, photoData);
        const blob = await renderPostcardPng(svg);
        if (cancelled || currentRequest.current !== requestKey) return;
        const url = URL.createObjectURL(blob);
        setPreview({ key: requestKey, url, blob, file: new File([blob], postcardFileName(wine), { type: 'image/png' }) });
      } catch {
        if (!cancelled && currentRequest.current === requestKey) setGenerationError(requestKey);
      }
    }, 180);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [requestKey, photoReady, photoData, wine, locale, note, showScore, showDate]);

  useEffect(() => {
    if (!preview) return;
    return () => { URL.revokeObjectURL(preview.url); };
  }, [preview]);

  useEffect(() => {
    let supported = false;
    if (preview && typeof navigator.share === 'function' && typeof navigator.canShare === 'function') {
      try { supported = navigator.canShare({ files: [preview.file] }); } catch { /* File sharing is optional. */ }
    }
    setCanShareImage(supported);
  }, [preview]);

  function saveImage() {
    if (!ready || !preview || sharing) return;
    const url = URL.createObjectURL(preview.blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = preview.file.name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    // Keep the URL alive while the browser begins its download.
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    setDownloadKey(requestKey);
  }

  async function shareImage() {
    if (!ready || !preview || sharing || !canShareImage) return;
    setShareError(false);
    setSharing(true);
    try {
      // The file is already prepared so this call retains user activation.
      await navigator.share({ files: [preview.file], title: wine.bottle });
    } catch (error) {
      if (mounted.current && !(error instanceof Error && error.name === 'AbortError')) setShareError(true);
    } finally {
      if (mounted.current) setSharing(false);
    }
  }

  const status = generationError === requestKey
    ? (pt ? 'Não foi possível criar o cartão.' : 'The postcard could not be created.')
    : sharing
      ? (pt ? 'Escolha onde compartilhar seu cartão.' : 'Choose where to share your postcard.')
      : generating
        ? (pt ? 'Preparando seu cartão…' : 'Preparing your postcard…')
        : downloadKey === requestKey
          ? (pt ? 'O download da imagem foi iniciado.' : 'Your image download has started.')
          : (pt ? 'Seu cartão está pronto.' : 'Your postcard is ready.');

  return <CellarDialog title={pt ? 'Cartão de degustação' : 'Tasting postcard'} closeLabel={pt ? 'Fechar' : 'Close'} wide pending={sharing} onClose={onClose}>
    <section className="tasting-postcard-dialog">
      <header className="postcard-dialog-heading">
        <p className="eyebrow">{pt ? 'CARTÃO DE DEGUSTAÇÃO' : 'TASTING POSTCARD'}</p>
        <h2>{pt ? 'Uma garrafa para compartilhar.' : 'A bottle worth sharing.'}</h2>
        <p className="dialog-description">{pt ? 'Guarde uma boa taça em um pequeno cartão.' : 'Turn a good glass into a little keepsake.'}</p>
      </header>

      <div className="postcard-dialog-layout">
        <div className="postcard-preview-column">
          <div className={`postcard-preview-stage ${generating ? 'is-updating' : ''}`} aria-busy={generating}>
            <div className="postcard-preview-paper">
              {preview ? <img src={preview.url} width={POSTCARD_WIDTH} height={POSTCARD_HEIGHT} alt={pt ? `Cartão de degustação de ${wine.bottle}` : `Tasting postcard for ${wine.bottle}`} draggable={false} />
                : <div className="postcard-preview-placeholder" aria-hidden="true"><WineIcon size={54} strokeWidth={1} /><span>{pt ? 'Uma taça para lembrar' : 'A glass to remember'}</span></div>}
            </div>
            {generating && <div className="postcard-preview-loading" aria-hidden="true"><Loader2 size={18} className="animate-spin" /><span>{pt ? 'Criando seu cartão' : 'Creating your postcard'}</span></div>}
          </div>
          <p className="postcard-format"><ImageIcon size={13} aria-hidden="true" /> PNG <span aria-hidden="true">·</span> {POSTCARD_WIDTH} × {POSTCARD_HEIGHT}</p>
        </div>

        <div className="postcard-controls">
          <div className="postcard-bottle-caption"><span>{pt ? 'A GARRAFA' : 'THE BOTTLE'}</span><strong>{wine.bottle}</strong><p>{[wine.vintage || (pt ? 'Sem safra' : 'NV'), wine.region, wine.country].filter(Boolean).join(' · ')}</p></div>
          <div className="postcard-note-field">
            <label htmlFor={`${id}-note`}>{pt ? 'Sua nota no cartão' : 'Your postcard note'}</label>
            <textarea id={`${id}-note`} value={note} onChange={event => setNote(truncatePostcardNote(event.target.value))} rows={5} disabled={sharing} placeholder={pt ? 'O sabor, a ocasião, uma boa lembrança…' : 'The flavor, the occasion, a lovely memory…'} aria-describedby={`${id}-note-help ${id}-note-count`} />
            <div className="postcard-note-meta"><small id={`${id}-note-help`}>{pt ? 'Edite apenas este cartão. Seu comentário no diário continua igual.' : 'Edit this card only. Your journal comment stays as it is.'}</small><small id={`${id}-note-count`}>{countPostcardNote(note)}/{POSTCARD_NOTE_LIMIT}</small></div>
          </div>
          {(hasScore || hasDate) && <fieldset className="postcard-details" disabled={sharing}>
            <legend>{pt ? 'NO CARTÃO' : 'ON THE CARD'}</legend>
            {hasScore && <label><input type="checkbox" checked={showScore} onChange={event => setShowScore(event.target.checked)} /><span>{pt ? 'Minha nota' : 'My score'}<small>{wine.myRating} / 100</small></span></label>}
            {hasDate && <label><input type="checkbox" checked={showDate} onChange={event => setShowDate(event.target.checked)} /><span>{pt ? 'Data da degustação' : 'Tasting date'}</span></label>}
          </fieldset>}
          {Boolean(wine.bottle_image) && photoReady && !photoData && <p className="postcard-photo-helper">{pt ? 'A foto desta garrafa não está disponível. Uma ilustração dá o toque final ao seu cartão.' : 'This bottle photo is unavailable. An illustration adds the finishing touch to your postcard.'}</p>}
          <div className="postcard-export">
            <p className="postcard-status" role="status" aria-live="polite">{status}</p>
            {generationError === requestKey && <div className="postcard-error" role="alert"><p>{pt ? 'Tente novamente para preparar a imagem.' : 'Try again to prepare your image.'}</p><button type="button" className="text-button" onClick={() => setAttempt(value => value + 1)}><RefreshCw size={14} aria-hidden="true" />{pt ? 'Tentar novamente' : 'Try again'}</button></div>}
            {shareError && <p className="postcard-error" role="alert">{pt ? 'Não foi possível compartilhar. Salve a imagem e envie pelas suas fotos ou arquivos.' : 'Sharing was unavailable. Save the image and send it from your photos or files.'}</p>}
            <div className="postcard-export-actions">
              <button type="button" className="flint-button" onClick={saveImage} disabled={!ready || sharing}><Download size={16} aria-hidden="true" />{pt ? 'Salvar imagem' : 'Save image'}</button>
              {canShareImage && <button type="button" className="flint-button secondary" onClick={shareImage} disabled={!ready || sharing}>{sharing ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Share2 size={16} aria-hidden="true" />}{pt ? 'Compartilhar imagem' : 'Share image'}</button>}
            </div>
            <p className="postcard-export-help">{pt ? 'Salve para guardar ou enviar a quem dividiu a taça.' : 'Save it for yourself or send it to someone who shared the glass.'}</p>
          </div>
        </div>
      </div>
    </section>
  </CellarDialog>;
}
