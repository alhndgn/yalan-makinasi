import type { Detail } from './templates/tr.ts';

export type PreparedQuery = { q: string; a: string };

/**
 * Soruları ve cevapları doğrudan **seçilen detaylardan** üretir; cevap her zaman
 * metinde geçen aynı detayın olgusunu anlattığı için çelişki imkânsızdır.
 */
export function buildQueries(details: Detail[], rng: () => number): PreparedQuery[] {
  if (details.length === 0) return [];

  const pool = [...details];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }

  return pool.slice(0, 3).map((detail) => ({ q: detail.q, a: detail.a }));
}
