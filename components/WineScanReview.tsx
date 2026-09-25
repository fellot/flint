'use client';

import { useState } from 'react';
import { ExternalLink, Wine } from 'lucide-react';
import type { WineScanResult } from '@/lib/wine-scan';
import { sanitizeBottleImage } from '@/utils/sanitizeWine';

export default function WineScanReview({ result, imageUrl, locale }: {
  result: WineScanResult | null; imageUrl?: string; locale: 'en' | 'pt';
}) {
  const pt = locale === 'pt';
  const safeUrl = sanitizeBottleImage(imageUrl);
  const [failedUrl, setFailedUrl] = useState<string>();
  const image = result?.image && result.image.url === safeUrl ? result.image : null;
  return (
    <section className="rounded-lg border border-red-100 bg-red-50/40 p-4" aria-label={pt ? 'Resultado da pesquisa' : 'Wine research'}>
      <div className="flex items-center gap-5">
        <div className="flex h-36 w-20 shrink-0 items-center justify-center rounded-md bg-white">
          {safeUrl && failedUrl !== safeUrl ? <img src={safeUrl} alt={pt ? 'Imagem da garrafa para salvar' : 'Bottle image to save'} className="h-32 w-16 object-contain" referrerPolicy="no-referrer" onError={() => setFailedUrl(safeUrl)} /> : <Wine className="h-12 w-12 text-red-300" />}
        </div>
        <div className="min-w-0 text-sm text-gray-600 space-y-2">
          <p className="font-semibold text-gray-900">{pt ? 'A imagem da sua garrafa' : 'Your bottle image'}</p>
          <p>{image ? image.match === 'exact-vintage'
            ? (pt ? 'Imagem da mesma safra encontrada na web. Confira o rótulo antes de salvar.' : 'Matching vintage found on the web. Check the label before saving.')
            : (pt ? 'Mesmo vinho; a imagem pode mostrar outra safra.' : 'Same wine; the image may show a different vintage.')
            : safeUrl ? (pt ? 'Link de imagem adicionado por você.' : 'Your manually supplied image link.')
            : (pt ? 'Nenhuma imagem encontrada. Você pode salvar sem imagem ou adicionar um link abaixo.' : 'No image found. Save without an image or add a link below.')}</p>
          {safeUrl && failedUrl === safeUrl && <p role="status">{pt ? 'A imagem não carregou. Remova ou substitua o link abaixo.' : 'The image could not load. Remove or replace its link below.'}</p>}
          {image && <a href={image.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-red-800 underline">{pt ? 'Ver fonte da imagem' : 'View image source'} <ExternalLink className="h-3 w-3" /></a>}
          <p className="text-xs">{pt ? 'Sua foto é usada apenas para identificar o vinho.' : 'Your uploaded photo is used only to identify the wine.'}</p>
        </div>
      </div>
      {!!result?.warnings.length && <ul className="mt-4 list-disc pl-5 space-y-1 text-xs text-gray-600">{result.warnings.map((warning, i) => <li key={i}>{warning}</li>)}</ul>}
      {!!result?.sources.length && <details className="mt-4 text-xs text-gray-600"><summary className="cursor-pointer">{pt ? 'Fontes da pesquisa' : 'Research sources'} ({result.sources.length})</summary><ul className="mt-2 space-y-2">{result.sources.map(source => <li key={source.url}><a className="underline break-words" href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ul></details>}
    </section>
  );
}
