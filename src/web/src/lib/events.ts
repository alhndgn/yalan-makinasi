/**
 * Sekmeler arası veri tazeliği: bir sekmede kayıt eklendiğinde diğerleri haberdar olur.
 * (Sekmeler `hidden` div'de açık tutulduğu için kendi kendine yenilenmiyorlardı.)
 */

export const DATA_CHANGED = 'ym:changed';

export function notifyDataChanged(): void {
  try {
    window.dispatchEvent(new Event(DATA_CHANGED));
  } catch {
    /* yoksay */
  }
}

export function onDataChanged(handler: () => void): () => void {
  window.addEventListener(DATA_CHANGED, handler);
  return () => window.removeEventListener(DATA_CHANGED, handler);
}
