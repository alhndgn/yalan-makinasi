import { compose } from '../compose.ts';
import { buildQueries } from '../queries.ts';
import { hashSeed, mulberry32 } from '../random.ts';
import { scoreRisk } from '../risk.ts';
import { countConflicts, type GenerateContext, type GenerateResult, type LlmProvider } from '../types.ts';
import { variantSchema } from '../../shared/schema.ts';

const DOCUMENT_WORDS = /(rapor|belge|imza|fatura|ehliyet)/i;

export const templateProvider: LlmProvider = {
  id: 'template',
  async generate(req, ctx: GenerateContext): Promise<GenerateResult> {
    const drafts = compose({
      deviceId: ctx.deviceId,
      target: req.target,
      situation: req.situation,
      situationCustom: req.situationCustom,
      channel: req.channel,
      style: req.style,
      intensity: req.intensity,
      salt: ctx.salt,
    });

    const variants = drafts.map((draft) => {
      const risk = scoreRisk({
        intensity: req.intensity,
        target: req.target,
        channel: req.channel,
        detailCount: draft.detailTags.length,
        hasSecondPerson: draft.hasSecondPerson,
        hasLocation: draft.hasLocation,
        mentionsDocument: DOCUMENT_WORDS.test(draft.text),
        conflictCount: countConflicts(ctx.recent, req.situation, draft.detailTags),
      });

      const rng = mulberry32(hashSeed(ctx.deviceId, req.situation, draft.strategy, ctx.salt, 'queries'));

      return variantSchema.parse({
        text: draft.text,
        strategy: draft.strategy,
        riskScore: risk.score,
        riskLevel: risk.level,
        riskReasons: risk.reasons,
        queries: buildQueries(draft.selectedDetails, rng),
      });
    });

    return { variants, provider: 'template' };
  },
};
