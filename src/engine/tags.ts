import type { SituationId } from '../shared/constants.ts';
import { banks, type DetailTag } from './templates/tr.ts';

/** Kaydedilen metnin hangi detayları içerdiğini bankadan geri çıkarır. */
export function extractDetailTags(situation: SituationId, text: string): DetailTag[] {
  const bank = banks[situation];
  if (!bank) return [];
  const tags = new Set<DetailTag>();
  for (const detail of bank.details) {
    if (text.includes(detail.text)) tags.add(detail.tag);
  }
  return [...tags];
}
