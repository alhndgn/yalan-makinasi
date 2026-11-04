import { DEFAULT_FORM, STYLES } from '../../../shared/constants.ts';
import type { StyleId } from '../../../shared/constants.ts';

const KEY = 'ym_defaults';

export type Defaults = { style: StyleId; intensity: number };

export function readDefaults(): Defaults {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Defaults>;
      const style = STYLES.some((s) => s.id === parsed.style) ? (parsed.style as StyleId) : DEFAULT_FORM.style;
      const intensity =
        Number.isFinite(parsed.intensity) && parsed.intensity! >= 1 && parsed.intensity! <= 10
          ? Math.round(parsed.intensity!)
          : DEFAULT_FORM.intensity;
      return { style, intensity };
    }
  } catch {
    /* bozuk kayıt: varsayılana dön */
  }
  return { style: DEFAULT_FORM.style, intensity: DEFAULT_FORM.intensity };
}

export function writeDefaults(next: Defaults): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* yoksay */
  }
}
