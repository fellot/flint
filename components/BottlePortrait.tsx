'use client';

import { useEffect, useId, useState } from 'react';
import type { Wine } from '@/types/wine';
import { styleFamily } from '@/utils/cellar';

export default function BottlePortrait({ wine }: { wine: Wine }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [wine.bottle_image]);
  const gradient = useId().replace(/:/g, '');
  const family = styleFamily(wine.style);
  return <div className={`bottle-portrait bottle-${family}`}>
    {wine.bottle_image && !failed ? <img src={wine.bottle_image} alt={wine.bottle} loading="lazy" onError={() => setFailed(true)} /> :
      <svg viewBox="0 0 100 220" role="img" aria-label={`${wine.bottle} — bottle illustration`}>
        <defs><linearGradient id={gradient}><stop stopColor="var(--bottle-dark)" /><stop offset=".34" stopColor="var(--bottle-light)" /><stop offset=".68" stopColor="var(--bottle-dark)" /><stop offset="1" stopColor="#192820" /></linearGradient></defs>
        <ellipse cx="50" cy="211" rx="30" ry="4" fill="#3c352b" opacity=".13" />
        <path d="M39 10h22v49c0 14 17 19 19 36v107q0 8-8 8H28q-8 0-8-8V95c2-17 19-22 19-36V10Z" fill={`url(#${gradient})`} />
        <path d="M40 7h20v40H40Z" fill="var(--foil)" /><path d="M44 51v13c0 15-17 23-17 39v95" fill="none" stroke="#fff" strokeWidth="3" opacity=".12" />
        <rect x="22" y="111" width="56" height="63" rx="1" fill="#f6f1e5" />
        <path d="m50 120-7 8 3 10 4 2 4-2 3-10-7-8Z" stroke="#a08a68" strokeWidth=".8" fill="none" />
        <path d="M34 148h32m-28 4h24" stroke="#aca28f" strokeWidth=".65" />
        <text x="50" y="163" textAnchor="middle" fontFamily="Georgia, serif" fontSize="9" fill="#635541">{wine.vintage || 'NV'}</text>
      </svg>}
  </div>;
}
