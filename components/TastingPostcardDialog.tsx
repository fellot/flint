'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Download, Image as ImageIcon, ImagePlus, Loader2, RefreshCw, Share2, Trash2, Wine as WineIcon } from 'lucide-react';
import type { Wine } from '@/types/wine';
import { prepareWinePhoto } from '@/utils/prepareWinePhoto';
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
type MomentPhoto = { wineId: string; data: string; name: string };

function initialNote(wine: Wine) {
  return truncatePostcardNote((wine.myComment || '').trim());
}

export default function TastingPostcardDialog({ wine, locale, cellarId, onClose }: {
  wine: Wine; locale: 'en' | 'pt'; cellarId?: string; onClose: () => void;
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
  const [momentPhoto, setMomentPhoto] = useState<MomentPhoto | null>(null);
  const [momentPending, setMomentPending] = useState(false);
  const [momentError, setMomentError] = useState<string | null>(null);
  const [momentRevision, setMomentRevision] = useState(0);
  const [fillMomentFrame, setFillMomentFrame] = useState(false);
  const [preview, setPreview] = useState<PreparedPostcard | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [canShareImage, setCanShareImage] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState(false);
  const [downloadKey, setDownloadKey] = useState<string | null>(null);
  const mounted = useRef(false);
  const momentInput = useRef<HTMLInputElement>(null);
  const momentToken = useRef(0);
  const momentProcessing = useRef(false);
  const currentWine = useRef(wine.id);
  currentWine.current = wine.id;
  const activeMoment = momentPhoto?.wineId === wine.id ? momentPhoto : null;
  const momentData = activeMoment?.data || null;
  const photoKey = JSON.stringify([cellarId || '', wine.id, wine.bottle_image || '']);
  const photoReady = photo?.key === photoKey;
  const photoData = photoReady ? photo.data : null;
  const requestKey = JSON.stringify([wine, locale, note, showScore, showDate, photoKey, photoReady, momentRevision, momentPending, Boolean(momentData), fillMomentFrame, attempt]);
  const currentRequest = useRef(requestKey);
  currentRequest.current = requestKey;
  const ready = photoReady && !momentPending && preview?.key === requestKey;
  const generating = !ready && generationError !== requestKey;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; momentToken.current += 1; };
  }, []);

  useEffect(() => {
    setNote(initialNote(wine));
    setShowScore(typeof wine.myRating === 'number' && Number.isFinite(wine.myRating) && wine.myRating >= 0 && wine.myRating <= 100);
    setShowDate(postcardTastingDate(wine.consumedDate, locale) !== null);
    momentToken.current += 1;
    momentProcessing.current = false;
    setMomentRevision(momentToken.current);
    setMomentPhoto(null);
    setMomentPending(false);
    setMomentError(null);
    setFillMomentFrame(false);
    if (momentInput.current) momentInput.current.value = '';
    // Review changes belong to the journal; this editor keeps its own draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wine.id]);

  useEffect(() => {
    let cancelled = false;
    loadPostcardPhoto(wine.bottle_image, { wineId: wine.id, cellarId }).then(data => {
      if (!cancelled) setPhoto({ key: photoKey, data });
    }).catch(() => {
      if (!cancelled) setPhoto({ key: photoKey, data: null });
    });
    return () => { cancelled = true; };
  }, [photoKey, cellarId, wine.id, wine.bottle_image]);

  useEffect(() => {
    setShareError(false);
    if (!photoReady || momentPending) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const svg = buildTastingPostcardSvg(wine, { locale, note, showScore, showDate, momentPhotoFit: fillMomentFrame ? 'cover' : 'contain' }, photoData, momentData);
        const blob = await renderPostcardPng(svg);
        if (cancelled || currentRequest.current !== requestKey) return;
        const url = URL.createObjectURL(blob);
        setPreview({ key: requestKey, url, blob, file: new File([blob], postcardFileName(wine), { type: 'image/png' }) });
      } catch {
        if (!cancelled && currentRequest.current === requestKey) setGenerationError(requestKey);
      }
    }, 180);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [requestKey, photoReady, photoData, momentPending, momentData, fillMomentFrame, wine, locale, note, showScore, showDate]);

  useEffect(() => {
    if (!preview) return;
    return () => { URL.revokeObjectURL(preview.url); };
  }, [preview]);

  async function selectMomentPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file || sharing) return;
    const token = ++momentToken.current;
    const wineId = wine.id;
    currentRequest.current = '';
    momentProcessing.current = true;
    setMomentRevision(token);
    setMomentPending(true);
    setMomentError(null);
    const isLatest = () => mounted.current && momentToken.current === token && currentWine.current === wineId;
    try {
      const data = await prepareWinePhoto(file, locale);
      if (!isLatest()) return;
      setMomentPhoto({ wineId, data, name: file.name });
      setFillMomentFrame(false);
    } catch (error) {
      if (!isLatest()) return;
      const reason = error instanceof Error ? error.message : (pt ? 'Não foi possível preparar a foto.' : 'The photo could not be prepared.');
      setMomentError(`${reason} ${pt ? 'Escolha outra foto e tente novamente.' : 'Choose another photo and try again.'}`);
    } finally {
      if (isLatest()) {
        momentProcessing.current = false;
        setMomentPending(false);
      }
    }
  }

  function removeMomentPhoto() {
    if (sharing) return;
    momentToken.current += 1;
    currentRequest.current = '';
    momentProcessing.current = false;
    setMomentRevision(momentToken.current);
    setMomentPhoto(null);
    setMomentPending(false);
    setMomentError(null);
    setFillMomentFrame(false);
    if (momentInput.current) momentInput.current.value = '';
  }

  function closeDialog() {
    momentToken.current += 1;
    currentRequest.current = '';
    onClose();
  }

  useEffect(() => {
    let supported = false;
    if (preview && typeof navigator.share === 'function' && typeof navigator.canShare === 'function') {
      try { supported = navigator.canShare({ files: [preview.file] }); } catch { /* File sharing is optional. */ }
    }
    setCanShareImage(supported);
  }, [preview]);

  function saveImage() {
    if (!ready || !preview || sharing || momentProcessing.current) return;
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
    if (!ready || !preview || sharing || momentProcessing.current || !canShareImage) return;
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
      : momentPending
        ? (pt ? 'Preparando sua foto…' : 'Preparing your photo…')
        : generating
          ? (pt ? 'Preparando seu cartão…' : 'Preparing your postcard…')
        : downloadKey === requestKey
          ? (pt ? 'O download da imagem foi iniciado.' : 'Your image download has started.')
          : (pt ? 'Seu cartão está pronto.' : 'Your postcard is ready.');

  return <CellarDialog title={pt ? 'Cartão de degustação' : 'Tasting postcard'} closeLabel={pt ? 'Fechar' : 'Close'} wide pending={sharing} onClose={closeDialog}>
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
            {generating && <div className="postcard-preview-loading" aria-hidden="true"><Loader2 size={18} className="animate-spin" /><span>{momentPending ? (pt ? 'Preparando sua foto' : 'Preparing your photo') : (pt ? 'Criando seu cartão' : 'Creating your postcard')}</span></div>}
          </div>
          <p className="postcard-format"><ImageIcon size={13} aria-hidden="true" /> PNG <span aria-hidden="true">·</span> {POSTCARD_WIDTH} × {POSTCARD_HEIGHT}</p>
        </div>

        <div className="postcard-controls">
          <div className="postcard-bottle-caption"><span>{pt ? 'A GARRAFA' : 'THE BOTTLE'}</span><strong>{wine.bottle}</strong><p>{[wine.vintage || (pt ? 'Sem safra' : 'NV'), wine.region, wine.country].filter(Boolean).join(' · ')}</p></div>
          <section className="postcard-moment-photo" aria-labelledby={`${id}-moment-title`}>
            <h3 id={`${id}-moment-title`}>{pt ? 'Foto do momento' : 'Moment photo'}<span>{pt ? 'opcional' : 'optional'}</span></h3>
            <div className={`postcard-moment-selection ${activeMoment ? 'has-photo' : ''}`} aria-busy={momentPending}>
              {activeMoment && <img className="postcard-moment-thumbnail" src={activeMoment.data} alt={pt ? 'Sua foto escolhida para este cartão' : 'Your selected photo for this postcard'} width={76} height={76} />}
              <div className="postcard-moment-actions">
                {activeMoment && <p className="postcard-moment-filename" title={activeMoment.name}>{activeMoment.name}</p>}
                <input ref={momentInput} id={`${id}-moment-file`} type="file" accept="image/jpeg,image/png,image/webp" aria-label={pt ? 'Escolher foto do momento' : 'Choose a moment photo'} aria-describedby={`${id}-moment-help`} disabled={sharing} onChange={selectMomentPhoto} hidden />
                <div className="postcard-moment-buttons">
                  <button type="button" className="postcard-add-photo" aria-controls={`${id}-moment-file`} aria-describedby={`${id}-moment-help`} disabled={sharing} onClick={() => momentInput.current?.click()}><ImagePlus size={16} aria-hidden="true" />{activeMoment || momentPending ? (pt ? 'Trocar foto' : 'Change photo') : (pt ? 'Adicionar foto' : 'Add photo')}</button>
                  {(activeMoment || momentPending) && <button type="button" className="postcard-remove-photo" onClick={removeMomentPhoto} disabled={sharing}><Trash2 size={14} aria-hidden="true" />{pt ? 'Remover foto' : 'Remove photo'}</button>}
                </div>
                {momentPending && <p className="postcard-moment-progress"><Loader2 size={12} className="animate-spin" aria-hidden="true" />{pt ? 'Preparando sua foto…' : 'Preparing your photo…'}</p>}
              </div>
            </div>
            <p id={`${id}-moment-help`} className="postcard-moment-help">{pt ? 'JPG, PNG ou WebP · até 10 MB. Só neste cartão; preparada neste dispositivo.' : 'JPG, PNG or WebP · up to 10 MB. Only in this card; prepared on this device.'}</p>
            {activeMoment && <label className="postcard-moment-fit"><input type="checkbox" checked={fillMomentFrame} onChange={event => setFillMomentFrame(event.target.checked)} disabled={sharing} /><span>{pt ? 'Preencher moldura' : 'Fill photo frame'}</span></label>}
            {momentError && <p className="postcard-error postcard-moment-error" role="alert">{momentError}</p>}
          </section>
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
