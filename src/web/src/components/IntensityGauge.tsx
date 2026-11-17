import { useCallback, useId, useRef, useState } from 'react';
import { INTENSITY_MAX, INTENSITY_MIN } from '../../../shared/constants.ts';
import { intensityBand } from '../lib/intensity.ts';

type Props = {
  value: number;
  onChange: (next: number) => void;
};

const W = 260;
const H = 150;
const CX = W / 2;
const CY = 138;
const R = 112;

/** Değeri (1-10) iğne açısına çevirir: -90° (en sol) → +90° (en sağ). */
function angleFor(value: number): number {
  const ratio = (value - INTENSITY_MIN) / (INTENSITY_MAX - INTENSITY_MIN);
  return -90 + ratio * 180;
}

function valueFor(angle: number): number {
  const clamped = Math.max(-90, Math.min(90, angle));
  const ratio = (clamped + 90) / 180;
  return Math.round(INTENSITY_MIN + ratio * (INTENSITY_MAX - INTENSITY_MIN));
}

function polar(angle: number, radius: number): { x: number; y: number } {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

function arcPath(): string {
  const start = polar(-90, R);
  const end = polar(90, R);
  return `M ${start.x} ${start.y} A ${R} ${R} 0 0 1 ${end.x} ${end.y}`;
}

/**
 * İbreli (gösterge) şiddet seçici.
 * İbrenin üstüne basıp sağa sürükleyince artar, sola sürükleyince azalır.
 * Klavye ile de ayarlanabilir (ok tuşları / Home / End).
 */
export function IntensityGauge({ value, onChange }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const band = intensityBand(value);
  const labelId = useId();

  const applyPointer = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * W - CX;
      const y = ((clientY - rect.top) / rect.height) * H - CY;
      const angle = (Math.atan2(x, -y) * 180) / Math.PI;
      onChange(valueFor(angle));
    },
    [onChange],
  );

  const needle = polar(angleFor(value), R - 26);
  const ticks = Array.from({ length: 10 }, (_, i) => {
    const v = INTENSITY_MIN + i;
    const angle = angleFor(v);
    const outer = polar(angle, R - 6);
    const inner = polar(angle, R - (v % 5 === 0 || v === INTENSITY_MAX ? 20 : 14));
    return { v, outer, inner, strong: v <= value };
  });

  return (
    <div className={`gauge ${dragging ? 'is-dragging' : ''}`}>
      <div className="gauge-readout">
        <strong aria-hidden="true">{value}</strong>
        <em id={labelId}>{band.label}</em>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="gauge-svg"
        role="slider"
        tabIndex={0}
        aria-labelledby={labelId}
        aria-valuemin={INTENSITY_MIN}
        aria-valuemax={INTENSITY_MAX}
        aria-valuenow={value}
        aria-valuetext={`${value} · ${band.label}`}
        onPointerDown={(e) => {
          (e.target as Element).setPointerCapture?.(e.pointerId);
          setDragging(true);
          applyPointer(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (!dragging) return;
          applyPointer(e.clientX, e.clientY);
        }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            e.preventDefault();
            onChange(Math.min(INTENSITY_MAX, value + 1));
          } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            e.preventDefault();
            onChange(Math.max(INTENSITY_MIN, value - 1));
          } else if (e.key === 'Home') {
            e.preventDefault();
            onChange(INTENSITY_MIN);
          } else if (e.key === 'End') {
            e.preventDefault();
            onChange(INTENSITY_MAX);
          }
        }}
      >
        <path d={arcPath()} className="gauge-track" />
        <path d={arcPath()} className="gauge-progress" style={{ strokeDasharray: `${(value - 1) * 21.5} 999` }} />

        {ticks.map((tick) => (
          <line
            key={tick.v}
            x1={tick.inner.x}
            y1={tick.inner.y}
            x2={tick.outer.x}
            y2={tick.outer.y}
            className={`gauge-tick ${tick.strong ? 'is-on' : ''}`}
          />
        ))}

        <line x1={CX} y1={CY} x2={needle.x} y2={needle.y} className="gauge-needle" />
        <circle cx={CX} cy={CY} r="9" className="gauge-hub" />
        <circle cx={CX} cy={CY} r="4" className="gauge-hub-dot" />
      </svg>

      <p className="gauge-hint">İbreyi tut, sağa çek — sola çekince düşer</p>
    </div>
  );
}
