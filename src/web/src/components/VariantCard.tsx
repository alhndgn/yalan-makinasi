import { useState } from 'react';
import type { Variant } from '../../../shared/schema.ts';
import { Typewriter } from './Typewriter.tsx';

type Props = {
  variant: Variant;
  onSave: () => void;
  onRegenerate: () => void;
};

const RISK_LABEL: Record<Variant['riskLevel'], string> = { dusuk: 'DÜŞÜK', orta: 'ORTA', yuksek: 'YÜKSEK' };
const STRATEGY_LABEL: Record<Variant['strategy'], string> = { sade: 'sade', detayli: 'detaylı', duygusal: 'duygusal' };

export function VariantCard({ variant, onSave, onRegenerate }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(variant.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  const waHref = `https://wa.me/?text=${encodeURIComponent(variant.text)}`;

  return (
    <article className="card variant" data-testid="variant-card">
      <div className="variant-head">
        <span className="tag">{STRATEGY_LABEL[variant.strategy]}</span>
        <span className={`risk risk-${variant.riskLevel}`}>
          {RISK_LABEL[variant.riskLevel]} · {variant.riskScore}/100
        </span>
      </div>

      <p className="variant-text" data-testid="variant-text">
        <Typewriter text={variant.text} />
      </p>

      {variant.riskReasons.length > 0 && (
        <ul className="reasons">
          {variant.riskReasons.slice(0, 2).map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}

      {variant.queries.length > 0 && (
        <details className="queries-box" open>
          <summary>Karşı taraf ne sorar ({variant.queries.length})</summary>
          <ul className="queries">
            {variant.queries.map((q) => (
              <li key={q.q}>
                <span className="q">{q.q}</span>
                <span className="a">{q.a}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="variant-actions">
        <button type="button" onClick={copy}>
          Kopyala
        </button>
        <a href={waHref} target="_blank" rel="noreferrer">
          WhatsApp
        </a>
        <button type="button" onClick={onSave}>
          Defter&apos;e kaydet
        </button>
        <button type="button" onClick={onRegenerate} className="ghost">
          ↻ Yeniden
        </button>
      </div>

      {copied && (
        <p className="toast" role="status">
          Kopyalandı
        </p>
      )}
    </article>
  );
}
