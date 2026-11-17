import type { SituationId } from '../shared/constants.ts';
import type { GenerateRequest, PersonProfile, Variant } from '../shared/schema.ts';

/** Aynı kişiye söylenmiş son 30 günün kayıtları (çelişki hesabı için). */
export type RecentLie = { situation: SituationId; detailTags: string[] };

/** Aynı kişiye daha önce söylenenler — AI'ya bağlam olarak verilir. */
export type HistoryEntry = { text: string; situation: string; createdAt: number };

export type GenerateContext = {
  deviceId: string;
  salt: string;
  recent: RecentLie[];
  person?: string;
  history?: HistoryEntry[];
  profile?: PersonProfile | null;
  hint?: string;
};

export type ProviderId = 'template' | 'ai' | 'ollama' | 'openrouter';

export type GenerateResult = {
  variants: Variant[];
  /** Gerçekte cevabı üreten sağlayıcı (fallback'te 'template'). */
  provider: ProviderId;
};

export interface LlmProvider {
  id: ProviderId;
  generate(req: GenerateRequest, ctx: GenerateContext): Promise<GenerateResult>;
}

export function countConflicts(recent: RecentLie[], situation: SituationId, detailTags: string[]): number {
  return recent.filter(
    (lie) => lie.situation === situation || lie.detailTags.some((tag) => detailTags.includes(tag)),
  ).length;
}
