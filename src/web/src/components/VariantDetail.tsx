import { useState } from 'react';
import type { Variant } from '../../../shared/schema.ts';
import { useI18n } from '../lib/lang.tsx';
import { shareElsewhere, shareToWhatsApp } from '../lib/share.ts';

type Props = {
  variant: Variant;
  index: number;
  total: number;
  personLabel: string;
  onSave: () => void;
  onRegenerate: () => void;
  onBack: () => void;
  note?: string | null;
};

/** Seçilen yalanın tam ekran hâli: WhatsApp konuşması gibi soru-cevap + yuvarlak eylemler. */
export function VariantDetail({ variant, index, total, personLabel, onSave, onRegenerate, onBack, note }: Props) {
  const { t } = useI18n();
  const [copied, setCopied] = useState<string | null>(null);
  const themLabel = personLabel.trim() || t('detail.them');

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(t('detail.copied'));
      setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(t('detail.copyFailed'));
    }
  }

  return (
    <section className="screen detail-screen" data-testid="detail">
      <header className="detail-top">
        <button type="button" className="round" onClick={onBack} aria-label={t('detail.back')}>
          ‹
        </button>
        <span className="detail-title">{personLabel || t('detail.them')}</span>
        <span className="spacer" />
        <span className="small faint">
          {t(`strategy.${variant.strategy}`)} · {index + 1}/{total}
        </span>
      </header>

      <div className="picked">
        <div className="picked-head">
          <span className="kicker">{t('detail.picked')}</span>
          <span className={`risk risk-${variant.riskLevel}`}>
            {t('detail.risk')} {t(`risk.${variant.riskLevel}`)} · {variant.riskScore}
          </span>
        </div>
        <p className="picked-text" data-testid="detail-text">
          {variant.text}
        </p>
      </div>

      <div className="chat" data-testid="chat">
        <div className="chat-head">
          <span className="chat-caption">{t('detail.questions')}</span>
          <span className="chat-caption chat-caption-right">{t('detail.answers')}</span>
        </div>
        {variant.queries.length === 0 && <p className="small muted">—</p>}
        {variant.queries.map((qa, i) => (
          <div key={`${qa.q}-${i}`} className="bubble-row">
            <div className="bubble in">
              <span className="bubble-who">{themLabel}</span>
              {qa.q}
            </div>
            <div className="bubble out">
              <span className="bubble-who">{t('detail.you')}</span>
              {qa.a}
            </div>
          </div>
        ))}
      </div>

      {copied && (
        <p className="toast" role="status">
          {copied}
        </p>
      )}
      {note && (
        <p className="toast" role="status">
          {note}
        </p>
      )}

      <div className="dock" data-testid="dock">
        <button
          type="button"
          className="dock-btn wa"
          aria-label={t('detail.wa')}
          onClick={() => void shareToWhatsApp(variant.text)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.6-.6-2.8-1.2-4.6-4-4.7-4.2-.2-.2-1.1-1.5-1.1-2.8 0-1.3.7-2 .9-2.2.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6c-.1.2-.3.3-.1.6.2.3.7 1.2 1.5 1.9 1 .9 1.7 1.1 2 1.2.2.1.4.1.6-.1l.7-.9c.2-.2.4-.2.6-.1l2 .9c.2.1.4.1.4.3 0 .1 0 .9-.1 1.1Z" />
          </svg>
        </button>

        <button
          type="button"
          className="dock-btn ig"
          aria-label={t('detail.share')}
          onClick={() => void shareElsewhere(variant.text)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" strokeWidth="1.9" />
            <circle cx="12" cy="12" r="4" fill="none" strokeWidth="1.9" />
            <circle cx="17.2" cy="6.8" r="1.15" />
          </svg>
        </button>

        <button type="button" className="dock-btn save" onClick={onSave} aria-label={t('detail.save')} data-testid="dock-save">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 3.5h9.2L19.5 8v12.5H6z" fill="none" strokeWidth="1.9" />
            <path d="M9 3.5v5h6v-5" fill="none" strokeWidth="1.6" />
          </svg>
        </button>

        <button type="button" className="dock-btn refresh" onClick={onRegenerate} aria-label={t('detail.refresh')}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 12a8 8 0 1 1-2.8-6.1" fill="none" strokeWidth="1.9" />
            <path d="M20 4.5V10h-5.2" fill="none" strokeWidth="1.9" />
          </svg>
        </button>

        <button
          type="button"
          className="dock-btn copy"
          aria-label={t('detail.copy')}
          onClick={() => void copyText(variant.text)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="8.5" y="8.5" width="11" height="11" rx="2.5" fill="none" strokeWidth="1.8" />
            <path d="M15.5 6.5v-1a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h1" fill="none" strokeWidth="1.6" />
          </svg>
        </button>
      </div>
    </section>
  );
}
