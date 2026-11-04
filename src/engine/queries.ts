import type { VariantDraft } from './compose.ts';
import type { Bank } from './templates/tr.ts';

export type PreparedQuery = { q: string; a: string };

/**
 * Sadece metinde geçen detaylara ait soruları üretir; cevaplar aynı detayın
 * olgusunu anlattığı için metinle çelişmez.
 */
export function buildQueries(bank: Bank, draft: Pick<VariantDraft, 'detailTags'>, rng: () => number): PreparedQuery[] {
  const tags = new Set(draft.detailTags);
  if (tags.size === 0) return [];

  const candidates = bank.queries.filter((item) => tags.has(item.tag));
  if (candidates.length === 0) return [];

  // Fisher-Yates (tohumlu): aynı girdi aynı sırayı verir
  const pool = [...candidates];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }

  return pool.slice(0, 3).map((item) => ({ q: item.q, a: item.a }));
}
