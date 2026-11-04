import { useRef } from 'react';
import { clampIntensity, intensityBand } from '../lib/intensity.ts';

type Props = {
  value: number;
  onChange: (value: number) => void;
};

export function IntensitySlider({ value, onChange }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const band = intensityBand(value);
  const percent = ((value - 1) / 9) * 100;

  function commit(next: number) {
    const clamped = clampIntensity(next);
    if (clamped !== value) {
      onChange(clamped);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(8);
    } else {
      onChange(clamped);
    }
  }

  function handlePointer(clientX: number) {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = rect.width === 0 ? 0 : (clientX - rect.left) / rect.width;
    commit(1 + Math.round(ratio * 9));
  }

  return (
    <div className="intensity">
      <div className="intensity-head">
        <span className="intensity-label">Yalan şiddeti</span>
        <span className="intensity-value" data-testid="intensity-value">
          {value} · {band.label}
        </span>
      </div>

      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="Yalan şiddeti"
        aria-valuemin={1}
        aria-valuemax={10}
        aria-valuenow={value}
        aria-valuetext={band.label}
        className="intensity-track"
        data-value={value}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture?.(e.pointerId);
          handlePointer(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) handlePointer(e.clientX);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            e.preventDefault();
            commit(value + 1);
          } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            e.preventDefault();
            commit(value - 1);
          } else if (e.key === 'Home') {
            e.preventDefault();
            commit(1);
          } else if (e.key === 'End') {
            e.preventDefault();
            commit(10);
          }
        }}
      >
        <div className="intensity-rail" />
        <div className="intensity-fill" style={{ width: `${percent}%` }} />
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="intensity-tick" style={{ left: `${(i / 9) * 100}%` }} />
        ))}
        <div className="intensity-thumb" style={{ left: `${percent}%` }}>
          <span className="intensity-thumb-num">{value}</span>
        </div>
      </div>

      <p className="intensity-hint">{band.hint} Şiddet arttıkça yakalanma riski yükselir.</p>
    </div>
  );
}
