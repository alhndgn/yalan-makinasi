/**
 * Defter içgörüleri: kişi karnesi, mum serisi, takvim ısı haritası, akıbet hatırlatması.
 * AI'sız, deterministik; aynı girdi → aynı çıktı.
 */

import type { LieLike } from './conflict.ts';

const DAY = 86_400_000;

export type Scorecard = {
  total: number;
  held: number;
  failed: number;
  pending: number;
  /** 0-100; değerlendirilmiş kayıt yoksa null. */
  heldRate: number | null;
  /** En sık kullanılan durum kimliği (kişi bazlı). */
  topSituation: string | null;
  topSituationCount: number;
};

export type DayBucket = { key: string; label: string; count: number; ts: number };

function dayStart(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Kişi karnesi: toplam, tuttu/tutmadı, oran, en sık bahane. */
export function scorecard(items: LieLike[]): Scorecard {
  const total = items.length;
  const held = items.filter((item) => item.status === 'tuttu').length;
  const failed = items.filter((item) => item.status === 'tutmadı').length;
  const pending = items.filter((item) => (item.status ?? 'beklemede') === 'beklemede').length;
  const judged = held + failed;

  const counts = new Map<string, number>();
  for (const item of items) {
    if (item.situation === 'ozel') continue;
    counts.set(item.situation, (counts.get(item.situation) ?? 0) + 1);
  }
  let topSituation: string | null = null;
  let topSituationCount = 0;
  for (const [key, value] of counts) {
    if (value > topSituationCount) {
      topSituation = key;
      topSituationCount = value;
    }
  }

  return {
    total,
    held,
    failed,
    pending,
    heldRate: judged === 0 ? null : Math.round((held / judged) * 100),
    topSituation,
    topSituationCount,
  };
}

/**
 * Son N günün ısı haritası: eskiden yeniye, bugün dahil.
 * `label` = gün numarası (takvimde gösterilir), `key` = YYYY-MM-DD.
 */
export function calendar(items: LieLike[], days = 30, now = Date.now()): DayBucket[] {
  const today = dayStart(now);
  const buckets: DayBucket[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const ts = today - offset * DAY;
    buckets.push({ key: dayKey(ts), label: String(new Date(ts).getDate()), count: 0, ts });
  }
  const index = new Map(buckets.map((b) => [b.key, b]));
  for (const item of items) {
    const bucket = index.get(dayKey(item.createdAt));
    if (bucket) bucket.count += 1;
  }
  return buckets;
}

/**
 * Mum serisi: bugün (ya da dün) başlayıp geriye doğru kesintisiz kayıt eklenen gün sayısı.
 * Bugün henüz kayıt yoksa seri dünden sayılır (gün bitmeden sıfırlanmasın).
 */
export function streakDays(items: LieLike[], now = Date.now()): number {
  if (items.length === 0) return 0;
  const days = new Set(items.map((item) => dayKey(item.createdAt)));
  const today = dayStart(now);
  let cursor = days.has(dayKey(today)) ? today : today - DAY;
  if (!days.has(dayKey(cursor))) return 0;

  let count = 0;
  while (days.has(dayKey(cursor))) {
    count += 1;
    cursor -= DAY;
  }
  return count;
}

/** Belirtilen saatten uzun süredir "beklemede" olan kayıtlar (yeniden eskiye). */
export function stalePending(items: LieLike[], hours = 48, now = Date.now()): LieLike[] {
  const limit = hours * 3_600_000;
  return items
    .filter((item) => (item.status ?? 'beklemede') === 'beklemede' && now - item.createdAt >= limit)
    .sort((a, b) => b.createdAt - a.createdAt);
}
