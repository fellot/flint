import { ApiError } from '@/lib/api-error';
import { pdfFilename, SHOPPING_PDF_MAX_BASE64, SHOPPING_PDF_MAX_BYTES, validPdfBytes } from '@/lib/shopping-attachment';
import type { ShoppingAttachment } from '@/types/shopping';

export function parseShoppingPdf(value: unknown): ShoppingAttachment | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'object' || Array.isArray(value)) throw new ApiError(400, 'Attach one PDF wine list.');
  const file = value as Record<string, unknown>;
  if (Object.keys(file).some(key => !['name', 'data'].includes(key)) || typeof file.name !== 'string'
    || !file.name.trim() || file.name.length > 120 || !/\.pdf$/i.test(file.name) || typeof file.data !== 'string') {
    throw new ApiError(400, 'Attach a PDF with its filename and contents.');
  }
  if (file.data.length > SHOPPING_PDF_MAX_BASE64) throw new ApiError(413, 'Choose a PDF up to 3 MB, or export only the relevant pages.');
  if (!file.data.length || file.data.length % 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(file.data)) throw new ApiError(400, 'The PDF attachment is invalid. Please attach it again.');
  const bytes = Buffer.from(file.data, 'base64');
  if (bytes.length > SHOPPING_PDF_MAX_BYTES) throw new ApiError(413, 'Choose a PDF up to 3 MB.');
  if (bytes.toString('base64') !== file.data || !validPdfBytes(bytes)) throw new ApiError(400, 'The attachment is not a complete PDF. Try exporting it again.');
  return { name: pdfFilename(file.name), data: file.data };
}
