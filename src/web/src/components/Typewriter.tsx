import { useEffect, useState } from 'react';

type Props = { text: string; speedMs?: number };

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function Typewriter({ text, speedMs = 18 }: Props) {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? text : ''));

  useEffect(() => {
    if (prefersReducedMotion()) {
      setShown(text);
      return;
    }
    setShown('');
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(timer);
    }, speedMs);
    return () => clearInterval(timer);
  }, [text, speedMs]);

  return <>{shown}</>;
}
