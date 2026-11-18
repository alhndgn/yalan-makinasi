import { useEffect, useState } from 'react';
import type { Danger } from '../../../engine/insights.ts';
import { useI18n } from '../lib/lang.tsx';

type Props = { danger: Danger; compact?: boolean };

/**
 * Kişi kartındaki tehlike ibresi.
 * Yay: 180°, ibre -90°…+90° döner. Etiketler yayın altında, okunur boşlukla.
 */
export function DangerGauge({ danger, compact = false }: Props) {
  const { t } = useI18n();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setShown(danger.percent), 90);
    return () => clearTimeout(id);
  }, [danger.percent]);

  const value = Math.min(100, Math.max(0, shown));
  const angle = -90 + (value / 100) * 180;

  return (
    <div className={`gauge-wrap ${compact ? 'is-compact' : ''}`} data-testid="danger-gauge">
      <svg viewBox="0 0 220 132" className="gauge-svg" role="img" aria-label={t('danger.aria', { percent: danger.percent })}>
        <defs>
          <linearGradient id="gaugeTrack" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3FA45B" />
            <stop offset="52%" stopColor="#E8A33D" />
            <stop offset="100%" stopColor="#D0342C" />
          </linearGradient>
        </defs>

        {/* iz */}
        <path d="M24 116 A86 86 0 0 1 196 116" fill="none" stroke="#F1EDE7" strokeWidth="15" strokeLinecap="round" />
        {/* dolu kısım */}
        <path
          d="M24 116 A86 86 0 0 1 196 116"
          fill="none"
          stroke="url(#gaugeTrack)"
          strokeWidth="15"
          strokeLinecap="round"
          strokeDasharray="270"
          strokeDashoffset={270 - (value / 100) * 270}
          style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(.22,.9,.24,1)' }}
        />

        {/* ibre */}
        <g
          style={{
            transform: `rotate(${angle}deg)`,
            transformOrigin: '110px 116px',
            transition: 'transform 900ms cubic-bezier(.22,.9,.24,1)',
          }}
        >
          <line x1="110" y1="116" x2="110" y2="38" stroke="#141312" strokeWidth="4" strokeLinecap="round" />
        </g>
        <circle cx="110" cy="116" r="8" fill="#141312" />
        <circle cx="110" cy="116" r="3" fill="#fff" />

        {/* ölçek uçları */}
        <text x="24" y="130" className="gauge-tick" textAnchor="middle">0</text>
        <text x="110" y="42" className="gauge-tick" textAnchor="middle">50</text>
        <text x="196" y="130" className="gauge-tick" textAnchor="middle">100</text>
      </svg>

      <div className="gauge-readout">
        <strong>{danger.percent}%</strong>
        <em className={`gauge-level is-${danger.level}`}>{t(`danger.level.${danger.level}`)}</em>
      </div>
      {!compact && <p className="gauge-caption">{t('danger.caption')}</p>}
    </div>
  );
}
