import { useEffect, useState } from 'react';
import { useI18n } from '../lib/lang.tsx';

type Props = {
  /** Toplam beklenti (ms) — adımlar buna göre ilerler. */
  estimateMs?: number;
};

/** Üretim beklerken tam ekran yüklenme sahnesi. */
export function GeneratingScreen({ estimateMs = 16000 }: Props) {
  const { t } = useI18n();
  const phrases = [t('load.1'), t('load.2'), t('load.3'), t('load.4')];
  const last = phrases.length - 1;
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, last)), Math.max(1600, estimateMs / phrases.length));
    return () => clearInterval(id);
  }, [estimateMs, last, phrases.length]);

  return (
    <section className="screen gen-screen" data-testid="generating-screen" aria-live="polite" aria-busy="true">
      <div className="gen-stage">
        <div className={`gen-ring ${step === last ? 'is-lit' : ''}`}>
          <span className="gen-stamp">YALAN</span>
        </div>

        <ol className="gen-steps">
          {phrases.map((phrase, i) => (
            <li
              key={phrase}
              className={i < step ? 'done' : i === step ? 'on' : 'off'}
              data-testid={i === step ? 'gen-active' : undefined}
            >
              {phrase}
              {i === step && i < last ? '…' : ''}
            </li>
          ))}
        </ol>

        <div className="gen-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100}>
          <i style={{ animationDuration: `${Math.max(3000, estimateMs)}ms` }} />
        </div>

        <p className="gen-hint">{t('load.hint')}</p>
      </div>
    </section>
  );
}
