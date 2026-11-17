import type { LieSource } from '../../../shared/constants.ts';
import type { Lang } from './i18n.ts';
import { translate } from './i18n.ts';

type Translate = (key: string, params?: Record<string, string | number>) => string;

/** Kaydın kaynağını insan diline çevirir. */
export function sourceLabel(source: LieSource | undefined, t: Translate): string {
  return source === 'manual' ? t('ledger.sourceManual') : t('ledger.sourceAi');
}

/**
 * Aynı kişiye yakın zamanda ne söyledin?
 * Aynı durum tekrar ediyorsa güçlü uyarı, sadece geçmiş varsa hafif hatırlatma döner.
 */
export function repeatWarning(
  history: { situation: string; createdAt: number }[],
  situation: string,
  options: { person?: string; days?: number; t: Translate },
): string | null {
  const days = options.days ?? 30;
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const recent = history.filter((item) => item.createdAt >= since);
  if (recent.length === 0) return null;

  const same = recent.filter((item) => item.situation === situation);
  const person = (options.person ?? '').trim();

  if (same.length > 0) {
    return options.t('gen.repeatSame', {
      person,
      days,
      count: same.length,
      situation: situation.replaceAll('_', ' '),
    });
  }

  return options.t('gen.repeatAny', { person, days, count: recent.length });
}

/** Kişi avatarı için baş harf. */
export function initialOf(person: string): string {
  const trimmed = person.trim();
  return trimmed ? trimmed[0]!.toLocaleUpperCase('tr') : '?';
}

/** Testler ve dil dışı çağrılar için: verilen dille çeviri. */
export function warnInLang(lang: Lang, key: string, params: Record<string, string | number>): string {
  return translate(lang, key, params);
}
