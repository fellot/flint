import type { ShoppingAttachment } from '@/types/shopping';

// Base64 plus the conversation stays below Vercel's request payload ceiling.
export const SHOPPING_PDF_MAX_BYTES = 3 * 1024 * 1024;
export const SHOPPING_PDF_MAX_BASE64 = 4 * Math.ceil(SHOPPING_PDF_MAX_BYTES / 3);
export const SHOPPING_TEXT_MAX_BYTES = 40000;
export const SHOPPING_REQUEST_MAX_BYTES = SHOPPING_PDF_MAX_BASE64 + SHOPPING_TEXT_MAX_BYTES + 2048;

export function pdfFilename(name: string) {
  return name.split(/[\\/]/).pop()!.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 116).replace(/\.pdf$/i, '') + '.pdf';
}

// Shared by the browser and server. This checks transport/signature, not whether
// every PDF object is readable. The model provider handles damaged/encrypted PDFs.
export function validPdfBytes(bytes: Uint8Array) {
  const startsWith = (value: Uint8Array, text: string) => [...text].every((c, i) => value[i] === c.charCodeAt(0));
  if (bytes.length < 16 || !startsWith(bytes, '%PDF-')) return false;
  const tail = bytes.slice(Math.max(0, bytes.length - 1024));
  return Array.from(tail).map(b => String.fromCharCode(b)).join('').includes('%%EOF');
}

export async function readShoppingPdf(file: File): Promise<ShoppingAttachment> {
  if (!/\.pdf$/i.test(file.name) || (file.type && !['application/pdf', 'application/octet-stream'].includes(file.type))) {
    throw new Error('Choose a PDF wine list.');
  }
  if (file.size > SHOPPING_PDF_MAX_BYTES) throw new Error('Choose a PDF up to 3 MB, or export only the pages you want advice on.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!validPdfBytes(bytes)) throw new Error('This file does not appear to be a complete PDF. Try exporting it again.');
  // Chunk to avoid overflowing the JS argument stack for large files.
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...Array.from(bytes.subarray(offset, offset + 8192)));
  return { name: pdfFilename(file.name), data: btoa(binary) };
}
