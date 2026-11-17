import { monthName, type Lang } from './i18n.ts';

/** "18 Kas" / "18 Nov" gibi kısa tarih. */
export function formatWhen(timestamp: number, lang: Lang = 'tr'): string {
  const date = new Date(timestamp);
  const day = date.getDate();
  const month = monthName(lang, date.getMonth());
  return `${day} ${month}`;
}

export function formatDateTime(timestamp: number, lang: Lang = 'tr'): string {
  const date = new Date(timestamp);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${formatWhen(timestamp, lang)} ${hh}:${mm}`;
}
