import { useEffect, useState } from 'react';
import { useI18n } from '../lib/lang.tsx';

type Props = {
  /** Toplam beklenti (ms) — adımlar buna göre ilerler. */
  estimateMs?: number;
  /** Üretimin başladığı an (ms). Sekme değişip geri dönüldüğünde ilerleme buradan hesaplanır. */
  startedAt?: number;
};

/** Üretim beklerken tam ekran yüklenme sahnesi. İlerleme zamana bağlı: geri dönünce kaldığı yerden devam eder. */
export function GeneratingScreen({ estimateMs = 16000, startedAt }: Props) {
  const { t } = useI18n();
  const phrases = [t('load.1'), t('load.2'), t('load.3'), t('load.4')];
  const last = phrases.length - 1;
  const start = startedAt ?? Date.now();
  const stepMs = Math.max(1200, estimateMs / phrases.length);

  const elapsedNow = () => Math.max(0, Date.now() - start);
  const [elapsed, setElapsed] = useState(elapsedNow);

  useEffect(() => {
    setElapsed(Math.max(0, Date.now() - start));
    const id = setInterval(() => setElapsed(Math.max(0, Date.now() - start)), 300);
    return () => clearInterval(id);
  }, [start]);

  const step = Math.min(last, Math.floor(elapsed / stepMs));
  const percent = Math.min(97, Math.round((elapsed / Math.max(3000, estimateMs)) * 100));

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

        <div className="gen-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
          <i style={{ width: `${percent}%`, transition: 'width 320ms linear' }} />
        </div>

        <p className="gen-hint">{t('load.hint')}</p>
      </div>
    </section>
  );
}
