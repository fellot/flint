import type { Wine } from '@/types/wine';
import { critics, highestCriticScore } from '@/utils/critic-ratings';

export default function CriticScores({ wine, locale = 'en', detailed = false }: { wine: Wine; locale?: 'en' | 'pt'; detailed?: boolean }) {
  const pt = locale === 'pt';
  const entries = critics.flatMap(critic => wine.criticRatings?.[critic.key] ? [{ ...critic, rating: wine.criticRatings[critic.key]! }] : []);
  if (!entries.length) {
    const score = highestCriticScore(wine);
    return <span className="critic-scores-empty" title={pt ? 'Sem avaliação de crítico disponível' : 'No critic rating available'}>{score == null ? (detailed ? (pt ? 'Sem avaliação de crítico disponível.' : 'No critic rating available.') : '—') : `${score}/100`}</span>;
  }
  return <div className={detailed ? 'critic-score-details' : 'critic-scores'}>{entries.map(({ key, name, abbreviation, rating }) => {
    const provisional = rating.verification === 'provisional';
    const note = provisional ? (pt ? 'Provisória: informada por um único revendedor.' : 'Provisional: reported by a single retailer.')
      : rating.verification === 'highest_conflicting_score' ? (pt ? 'Maior nota publicada selecionada entre avaliações divergentes.' : 'Highest published score selected where ratings differ.') : '';
    const range = rating.score_kind === 'range' ? (pt ? 'Intervalo de avaliação; o limite superior é usado para ordenar.' : 'Rating range; the upper bound is used for sorting.') : '';
    return <div key={key} className={detailed ? 'critic-score-detail' : 'critic-score-item'}>
      <span className="critic-score-badge" title={[name, `${rating.display_score}/100`, note, range].filter(Boolean).join(' · ')} aria-label={`${name}: ${rating.display_score}/100${provisional ? (pt ? ', provisória' : ', provisional') : ''}`}>
        <small>{abbreviation}</small><strong>{rating.display_score}</strong>{provisional && <sup>*</sup>}
      </span>
      {detailed && <div><strong>{name}</strong>{(note || range) && <p>{[note, range].filter(Boolean).join(' ')}</p>}<div className="critic-score-sources">{rating.source_urls.map((url, i) => <a key={`${url}-${i}`} href={url} target="_blank" rel="noopener noreferrer">{pt ? 'Fonte' : 'Source'} {i + 1} ↗</a>)}</div></div>}
    </div>;
  })}</div>;
}
