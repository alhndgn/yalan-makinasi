import { useRef, useState } from 'react';
import type { Variant } from '../../../shared/schema.ts';
import { Typewriter } from './Typewriter.tsx';

type Props = {
  variants: Variant[];
  index: number;
  contextLabel: string;
  onIndex: (next: number) => void;
  onUse: () => void;
  onBack: () => void;
};

const RISK_LABEL: Record<Variant['riskLevel'], string> = { dusuk: 'düşük', orta: 'orta', yuksek: 'yüksek' };
const STRATEGY_LABEL: Record<Variant['strategy'], string> = { sade: 'Sade', detayli: 'Detaylı', duygusal: 'Duygusal' };

/** Üç alternatifi tek tek gezdirir: oklar, noktalar ve parmakla kaydırma. */
export function VariantDeck({ variants, index, contextLabel, onIndex, onUse, onBack }: Props) {
  const [dx, setDx] = useState(0);
  const startX = useRef<number | null>(null);
  const variant = variants[index];
  if (!variant) return null;

  const go = (delta: number) => onIndex(Math.min(variants.length - 1, Math.max(0, index + delta)));

  function touchStart(e: React.TouchEvent) {
    startX.current = e.touches[0]?.clientX ?? null;
  }
  function touchMove(e: React.TouchEvent) {
    if (startX.current === null) return;
    const current = e.touches[0]?.clientX ?? startX.current;
    setDx(Math.max(-90, Math.min(90, current - startX.current)));
  }
  function touchEnd() {
    if (dx < -50) go(1);
    else if (dx > 50) go(-1);
    setDx(0);
    startX.current = null;
  }

  return (
    <section className="screen deck-screen" data-testid="deck">
      <div className="deck-top">
        <span className="kicker">3 alternatif</span>
        <span className="deck-context">{contextLabel}</span>
      </div>

      <div className="deck-dots" aria-hidden="true">
        {variants.map((v, i) => (
          <i key={v.text.slice(0, 12) + i} className={i === index ? 'on' : ''} />
        ))}
      </div>

      <article
        className="deck-card"
        data-testid="deck-card"
        style={{ transform: `translateX(${dx * 0.35}px) rotate(${dx * 0.01}deg)` }}
        onTouchStart={touchStart}
        onTouchMove={touchMove}
        onTouchEnd={touchEnd}
      >
        <div className="deck-meta">
          <span className="tag">{STRATEGY_LABEL[variant.strategy]}</span>
          <span className={`risk risk-${variant.riskLevel}`}>
            {RISK_LABEL[variant.riskLevel]} · {variant.riskScore}
          </span>
        </div>

        <p className="deck-text" data-testid="deck-text">
          <Typewriter text={variant.text} />
        </p>

        <div className="deck-foot">
          <span className="small muted">
            {variant.queries.length > 0 ? `karşı taraf ${variant.queries.length} soru sorabilir` : 'soru provası yok'}
          </span>
          <span className="mono small faint">
            {index + 1}/{variants.length}
          </span>
        </div>
      </article>

      <div className="deck-nav">
        <button type="button" className="round" onClick={() => go(-1)} disabled={index === 0} aria-label="Önceki alternatif">
          ‹
        </button>
        <button type="button" className="cta deck-use" onClick={onUse}>
          Bunu kullan
        </button>
        <button
          type="button"
          className="round"
          onClick={() => go(1)}
          disabled={index === variants.length - 1}
          aria-label="Sonraki alternatif"
        >
          ›
        </button>
      </div>

      <button type="button" className="ghost deck-back" onClick={onBack}>
        ‹ Formu değiştir
      </button>
    </section>
  );
}
