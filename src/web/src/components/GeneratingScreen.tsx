import { useEffect, useState } from 'react';

type Props = {
  /** Toplam beklenti (ms) — adımlar buna göre ilerler. */
  estimateMs?: number;
};

const PHRASES = ['durum değerlendiriliyor', 'olasılıklar hesaplanıyor', 'yalan üretiliyor', 'mum tekrar yakıldı'];

/** Üretim beklerken tam ekran yüklenme sahnesi. */
export function GeneratingScreen({ estimateMs = 16000 }: Props) {
  const [step, setStep] = useState(0);
  const last = PHRASES.length - 1;

  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, last)), Math.max(1600, estimateMs / PHRASES.length));
    return () => clearInterval(id);
  }, [estimateMs, last]);

  return (
    <section className="screen gen-screen" data-testid="generating-screen" aria-live="polite" aria-busy="true">
      <div className="gen-stage">
        <div className={`gen-ring ${step === last ? 'is-lit' : ''}`}>
          <span className="gen-stamp">YALAN</span>
        </div>

        <ol className="gen-steps">
          {PHRASES.map((phrase, i) => (
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

        <p className="gen-hint">10-15 saniye sürebilir, kapatma</p>
      </div>
    </section>
  );
}
