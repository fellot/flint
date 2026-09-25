/** Strip metadata and reduce the photo before sending it for identification. */
export async function prepareWinePhoto(file: File, locale: 'en' | 'pt'): Promise<string> {
  const pt = locale === 'pt';
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error(pt ? 'Use uma foto JPG, PNG ou WebP.' : 'Use a JPG, PNG or WebP photo.');
  if (file.size > 10 * 1024 * 1024) throw new Error(pt ? 'A foto deve ter no máximo 10 MB.' : 'The photo must be 10 MB or smaller.');
  let source: ImageBitmap | HTMLImageElement;
  try { source = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch {
    const url = URL.createObjectURL(file);
    try {
      source = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(pt ? 'Não foi possível ler a foto.' : 'The photo could not be read.'));
        img.src = url;
      });
    } finally { URL.revokeObjectURL(url); }
  }
  try {
    const scale = Math.min(1, 1600 / Math.max(source.width, source.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(source.width * scale));
    canvas.height = Math.max(1, Math.round(source.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error(pt ? 'Não foi possível preparar a foto.' : 'The photo could not be prepared.');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    const result = canvas.toDataURL('image/jpeg', 0.82);
    if (result.length > 4 * 1024 * 1024 - 1024) throw new Error(pt ? 'Tente uma foto menor.' : 'Try a smaller photo.');
    return result;
  } finally { if ('close' in source) source.close(); }
}
