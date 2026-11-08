import type { ReactNode } from 'react';

type Props = {
  step: number;
  title: string;
  summary?: string;
  open: boolean;
  onOpen: () => void;
  children: ReactNode;
};

/** Üç adımlı akışın tek kartı: kapalıyken seçimi tek satırda özetler. */
export function StepCard({ step, title, summary, open, onOpen, children }: Props) {
  return (
    <section className={`step${open ? ' is-open' : ''}`}>
      <button type="button" className="step-head" onClick={onOpen} aria-expanded={open}>
        <span className="step-num" aria-hidden="true">
          {step}
        </span>
        <span className="step-title">
          {step}. {title}
        </span>
        {!open && summary ? <span className="step-summary">{summary}</span> : null}
        {!open ? <span className="step-change">değiştir</span> : null}
      </button>
      {open ? <div className="step-body">{children}</div> : null}
    </section>
  );
}
