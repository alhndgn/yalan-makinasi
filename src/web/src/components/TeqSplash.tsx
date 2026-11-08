import { useEffect, useState } from 'react';

type Props = {
  appName: string;
  tagline: string;
  /** Damga mürekkebi / vurgu rengi */
  accent?: string;
  /** Logonun kendisi (her uygulamada değişir) */
  mark?: React.ReactNode;
  durationMs?: number;
  /** Tasarım incelemesi için ekranda tut */
  hold?: boolean;
  onDone?: () => void;
};

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Teq Studio ortak açılış ekranı. Her uygulama kendi adı, vaadi, logosu ve vurgu
 * rengiyle kullanır; imza köşede sabittir.
 */
export function TeqSplash({
  appName,
  tagline,
  accent = '#A83A30',
  mark,
  durationMs = 1200,
  hold = false,
  onDone,
}: Props) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (hold) return;
    const reduced = prefersReducedMotion();
    const leaveAfter = reduced ? 260 : durationMs;
    const doneAfter = reduced ? 300 : durationMs + 420;

    const t1 = setTimeout(() => setLeaving(true), leaveAfter);
    const t2 = setTimeout(() => onDone?.(), doneAfter);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [durationMs, hold, onDone]);

  return (
    <div
      className={`teq-splash${leaving ? ' is-leaving' : ''}`}
      style={{ ['--teq-accent' as string]: accent }}
      role="status"
      aria-label={`${appName} açılıyor`}
      data-testid="teq-splash"
    >
      <div className="teq-splash-body">
        <div className="teq-stamp">
          <div className="teq-kicker">Teq Studio</div>
          {mark && <div className="teq-mark">{mark}</div>}
          <div className="teq-name">{appName}</div>
        </div>
        <p className="teq-tag">{tagline}</p>
      </div>

      <div className="teq-credit">
        <span className="teq-credit-dot">T</span>
        <span>Developed by Teq Studio</span>
      </div>
    </div>
  );
}
