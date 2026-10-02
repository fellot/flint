'use client';

import { useId, useState } from 'react';
import { FLAVOUR_AXES, grapeFlavourProfile } from '@/data/grape-flavours';
import { grapeName } from '@/data/grapes';

const LEVELS = {
  en: ['Little / none', 'Subtle', 'Moderate', 'Pronounced', 'Strong'],
  pt: ['Pouco / nenhum', 'Sutil', 'Moderado', 'Pronunciado', 'Intenso'],
};
const STRUCTURE_LEVELS = {
  en: ['Low', 'Medium-low', 'Medium', 'Medium-high', 'High'],
  pt: ['Baixo', 'Médio-baixo', 'Médio', 'Médio-alto', 'Alto'],
};
const BODY_LEVELS = {
  en: ['Light', 'Medium-light', 'Medium', 'Medium-full', 'Full'],
  pt: ['Leve', 'Médio-leve', 'Médio', 'Médio-encorpado', 'Encorpado'],
};
const point = (radius: number, angle: number) => {
  const radians = angle * Math.PI / 180;
  return [170 + radius * Math.sin(radians), 170 - radius * Math.cos(radians)];
};
// Each ring is one step, so length (not area) encodes the 1–5 scale.
function sector(inner: number, outer: number, start: number, end: number) {
  const a = point(inner, start), b = point(outer, start), c = point(outer, end), d = point(inner, end);
  return `M${a} L${b} A${outer},${outer} 0 0 1 ${c} L${d} A${inner},${inner} 0 0 0 ${a} Z`;
}

export default function GrapeFlavourWheel({ grapeId, pt }: { grapeId: string; pt: boolean }) {
  const uid = useId();
  const [selected, setSelected] = useState<number | null>(null);
  const profile = grapeFlavourProfile(grapeId);
  if (!profile) return null;
  const locale = pt ? 'pt' : 'en';
  const axes = FLAVOUR_AXES[profile.wheel];
  const aromaCount = profile.wheel === 'red' ? 7 : 8;
  const selection = selected ?? profile.levels.reduce<number>((best, level, i) => i < aromaCount && level > profile.levels[best] ? i : best, 0);
  const active = axes[selection];
  const intensity = (i: number) => (axes[i].id === 'body' ? BODY_LEVELS : ['acidity', 'tannin'].includes(axes[i].id) ? STRUCTURE_LEVELS : LEVELS)[locale][profile.levels[i] - 1];
  const label = `${grapeName(grapeId)} — ${pt ? 'perfil de sabores' : 'flavour profile'}`;
  const values = axes.map((a, i) => `${a.label[locale]}: ${profile.levels[i]}/5 (${intensity(i)})`).join('; ');

  return <figure className="grape-flavour" aria-label={label}>
    <div className="flavour-heading"><span>{pt ? 'RETRATO DE SABORES' : 'FLAVOUR PORTRAIT'}</span><span>{pt ? 'Guia · 1–5' : 'Guide · 1–5'}</span></div>
    <p className="flavour-style">{profile.style[locale]}</p>
    <svg viewBox="0 0 340 340" className="flavour-wheel" role="img" aria-labelledby={`${uid}-title ${uid}-description`}>
      <title id={`${uid}-title`}>{label}</title>
      <desc id={`${uid}-description`}>{pt ? 'Intensidades ilustrativas, não medidas nem notas pessoais.' : 'Illustrative intensities, not measurements or personal scores.'} {values}</desc>
      <g aria-hidden="true">
        {axes.map((a, i) => {
          const start = i * 36 + 1, end = (i + 1) * 36 - 1, angle = i * 36 + 18;
          const position = point(132, angle);
          return <g key={a.id} className={`flavour-sector ${selection === i ? 'active' : ''}`} onMouseEnter={() => setSelected(i)} onClick={() => setSelected(i)}>
            <path d={sector(27, 112, start, end)} className="flavour-track" />
            {[1, 2, 3, 4, 5].map(level => <path key={level} d={sector(27 + (level - 1) * 17, 27 + level * 17, start, end)}
              fill={level <= profile.levels[i] ? a.colour : 'transparent'} className="flavour-ring" />)}
            <path d={sector(26, 114, start, end)} className="flavour-selection" stroke={a.colour} />
            <text x={position[0]} y={position[1]} textAnchor="middle" dominantBaseline="middle" transform={`rotate(${angle > 90 && angle < 270 ? angle + 180 : angle} ${position.join(' ')})`}>{a.label[locale]}</text>
          </g>;
        })}
        <text x="170" y="171" textAnchor="middle" className="flavour-centre-value">{profile.levels[selection]}<tspan className="flavour-centre-max">/5</tspan></text>
        <text x="170" y="185" textAnchor="middle" className="flavour-centre-label">{pt ? 'GUIA' : 'GUIDE'}</text>
      </g>
    </svg>
    <div className="flavour-selected"><i style={{ background: active.colour }} /><strong>{active.label[locale]}</strong><span>{intensity(selection)} · {profile.levels[selection]}/5</span></div>
    <figcaption className="flavour-aromas">{profile.aromas[locale]}</figcaption>
    <details className="flavour-details">
      <summary>{pt ? 'Ler o perfil e suas nuances' : 'Read the profile & its nuances'}</summary>
      <p>{profile.variation[locale]}</p>
      <div className="flavour-values" role="group" aria-label={pt ? 'Explorar sabores e estrutura' : 'Explore flavours and structure'}>
        {axes.map((a, i) => <button key={a.id} type="button" aria-pressed={selection === i} onClick={() => setSelected(i)} aria-label={`${a.label[locale]}: ${profile.levels[i]}/5, ${intensity(i)}`}>
          <i style={{ background: a.colour }} /><span>{a.label[locale]}</span><strong>{profile.levels[i]}<small>/5</small></strong>
        </button>)}
      </div>
      <p className="flavour-axis-explanation" aria-live="polite"><strong>{active.label[locale]}:</strong> {active.meaning[locale]}</p>
      <p className="flavour-method">{pt ? 'Cada anel é um passo: 1 = pouco, 5 = muito. Corpo vai de leve a encorpado; acidez e taninos, de baixos a altos. Aromas de mel e fruta madura não indicam açúcar.' : 'Each ring is one step: 1 = little, 5 = strong. Body runs from light to full; acidity and tannin from low to high. Honeyed or ripe-fruit aromas do not indicate sugar.'}</p>
    </details>
    <p className="flavour-reference">{pt ? 'Leitura:' : 'Further reading:'} <a href={profile.source!.url} target="_blank" rel="noopener noreferrer" aria-label={`${profile.source!.name} · ${grapeName(grapeId)} (${pt ? 'nova aba' : 'new tab'})`}>{profile.source!.name} <span aria-hidden="true">↗</span></a></p>
  </figure>;
}
