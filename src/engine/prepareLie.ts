import type { ChannelId, SituationId, TargetId } from '../shared/constants.ts';
import { buildQueries, type PreparedQuery } from './queries.ts';
import { mulberry32 } from './random.ts';
import { scoreRisk, type RiskLevel } from './risk.ts';
import { banks, type Detail, type DetailTag } from './templates/tr.ts';
import { countConflicts, type RecentLie } from './types.ts';

const DOCUMENT_WORDS = /(rapor|belge|imza|fatura|ehliyet)/i;

export type LieForm = {
  target: TargetId;
  situation: SituationId;
  channel: ChannelId;
  intensity: number;
};

export type PreparedLie = {
  riskScore: number;
  riskLevel: RiskLevel;
  riskReasons: string[];
  queries: PreparedQuery[];
  detailTags: DetailTag[];
};

/** Metinde geçen detay cümlelerini (soru/cevap dahil) bulur. */
export function matchedDetails(situation: SituationId, text: string): Detail[] {
  const bank = banks[situation];
  if (!bank) return [];
  return bank.details.filter((detail) => text.includes(detail.text));
}

/**
 * Kaydedilecek metnin risk ve sorgularını **metinden** yeniden üretir.
 * Hem sunucu hem cihaz içi (APK) mod aynı fonksiyonu kullanır.
 */
export function prepareLie(
  form: LieForm,
  text: string,
  recent: RecentLie[],
  seed = 1,
): PreparedLie {
  const details = matchedDetails(form.situation, text);
  const detailTags = [...new Set(details.map((detail) => detail.tag))];

  const risk = scoreRisk({
    intensity: form.intensity,
    target: form.target,
    channel: form.channel,
    detailCount: details.length,
    hasSecondPerson: detailTags.includes('ikinci_kisi'),
    hasLocation: detailTags.includes('konum'),
    mentionsDocument: DOCUMENT_WORDS.test(text),
    conflictCount: countConflicts(recent, form.situation, detailTags),
  });

  return {
    riskScore: risk.score,
    riskLevel: risk.level,
    riskReasons: risk.reasons,
    queries: details.length > 0 ? buildQueries(details, mulberry32(seed)) : [],
    detailTags,
  };
}
