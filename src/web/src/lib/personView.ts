import type { LieSource } from '../../../shared/constants.ts';

/** Kaydın kaynağını insan diline çevirir. */
export function sourceLabel(source: LieSource | undefined): string {
  return source === 'manual' ? 'kendi yazdığın' : 'yapay zekâ önerisi';
}

/**
 * Aynı kişiye yakın zamanda ne söyledin?
 * Aynı durum tekrar ediyorsa güçlü uyarı, sadece geçmiş varsa hafif hatırlatma döner.
 */
export function repeatWarning(
  history: { situation: string; createdAt: number }[],
  situation: string,
  days = 30,
): string | null {
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const recent = history.filter((item) => item.createdAt >= since);
  if (recent.length === 0) return null;

  const same = recent.filter((item) => item.situation === situation);
  const label = situation.replaceAll('_', ' ');

  if (same.length > 0) {
    return `Bu kişiye son ${days} günde ${same.length} kez "${label}" dedin. Aynı bahaneyi tekrar kullanmak riski artırır.`;
  }

  return `Bu kişiye son ${days} günde ${recent.length} kayıt var. Yeni metin eskilerle çelişmesin; ayrıntıları (yer, saat, tanık) tekrar etme.`;
}

/** Kişi avatarı için baş harf. */
export function initialOf(person: string): string {
  const trimmed = person.trim();
  return trimmed ? trimmed[0]!.toLocaleUpperCase('tr') : '?';
}
