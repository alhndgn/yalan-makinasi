import { useState } from 'react';
import type { Variant } from '../../../shared/schema.ts';
import { downloadShareCard } from '../lib/shareCard.ts';
import { Typewriter } from './Typewriter.tsx';

type Props = {
  variant: Variant;
  index: number;
  total: number;
  targetLabel: string;
  onSave: () => void;
  onRegenerate: () => void;
  onBack: () => void;
};

const RISK_LABEL: Record<Variant['riskLevel'], string> = { dusuk: 'düşük', orta: 'orta', yuksek: 'yüksek' };
const STRATEGY_LABEL: Record<Variant['strategy'], string> = { sade: 'Sade', detayli: 'Detaylı', duygusal: 'Duygusal' };

/** Seçilen alternatifin tam ekran hâli: metin, risk, sorular ve eylemler. */
export function VariantDetail({ variant, index, total, targetLabel, onSave, onRegenerate, onBack }: Props) {
  const [copied, setCopied] = useState(false);
  const waHref = `https://wa.me/?text=${encodeURIComponent(variant.text)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(variant.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="screen detail-screen" data-testid="detail">
      <header className="detail-top">
        <button type="button" className="round" onClick={onBack} aria-label="Kartlara dön">
          ‹
        </button>
        <span className="detail-title">
          {STRATEGY_LABEL[variant.strategy]} · {index + 1}/{total}
        </span>
        <span className="spacer" />
      </header>

      <p className="detail-text" data-testid="detail-text">
        <Typewriter text={variant.text} />
      </p>

      <div className="detail-risk">
        <div className="risk-track" aria-hidden="true">
          <i style={{ width: `${Math.min(100, Math.max(4, variant.riskScore))}%` }} />
        </div>
        <div className="detail-risk-row">
          <span className="small muted">yakalanma riski</span>
          <span className={`risk risk-${variant.riskLevel}`}>
            {RISK_LABEL[variant.riskLevel]} · {variant.riskScore}/100
          </span>
        </div>
        {variant.riskReasons.length > 0 && (
          <ul className="reasons">
            {variant.riskReasons.slice(0, 3).map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        )}
      </div>

      {variant.queries.length > 0 && (
        <div className="detail-queries">
          <h4>Karşı taraf ne sorar</h4>
          {variant.queries.map((q, i) => (
            <div key={`${q.q}-${i}`} className="qa-block">
              <p className="q">{q.q}</p>
              <p className="a">{q.a}</p>
            </div>
          ))}
        </div>
      )}

      <div className="detail-actions">
        <button type="button" className="act" onClick={copy}>
          ⧉ {copied ? 'Kopyalandı' : 'Kopyala'}
        </button>
        <a className="act" href={waHref} target="_blank" rel="noreferrer">
          ✆ WhatsApp
        </a>
        <button type="button" className="act primary" onClick={onSave}>
          Defter&apos;e kaydet
        </button>
        <button
          type="button"
          className="act ghost"
          onClick={() => void downloadShareCard({ text: variant.text, riskLevel: variant.riskLevel, targetLabel })}
        >
          Kart indir
        </button>
        <button type="button" className="act ghost" onClick={onRegenerate}>
          ↻ Başka üret
        </button>
        <button type="button" className="act ghost" onClick={onBack}>
          ‹ Kartlara dön
        </button>
      </div>
    </section>
  );
}
