import { compose } from '../compose.ts';
import { buildQueries } from '../queries.ts';
import { hashSeed, mulberry32 } from '../random.ts';
import { scoreRisk } from '../risk.ts';
import { countConflicts, type GenerateContext, type GenerateResult, type LlmProvider } from '../types.ts';
import { variantSchema, type GenerateRequest } from '../../shared/schema.ts';

const DOCUMENT_WORDS = /(rapor|belge|imza|fatura|ehliyet|report|document|signature|invoice)/i;

/** İngilizce çevrimdışı yedek: AI'ya ulaşılamazsa kullanılabilir üç metin. */
function englishDrafts(req: GenerateRequest): { strategy: 'sade' | 'detayli' | 'duygusal'; text: string }[] {
  const reason = (req.situationCustom ?? '').trim().replace(/[.!?]+$/, '');
  const core = reason || 'something came up at the last minute';

  if (req.intensity <= 3) {
    const short = `hey, ${core}. can't make it, sorry.`;
    return [
      { strategy: 'sade', text: short },
      { strategy: 'detayli', text: `${short} I'll text you when I'm free.` },
      { strategy: 'duygusal', text: `really sorry - ${core}. I hate cancelling on you.` },
    ];
  }

  if (req.intensity <= 6) {
    return [
      { strategy: 'sade', text: `look, ${core}. can't make it tonight, sorry.` },
      {
        strategy: 'detayli',
        text: `look, ${core}. it took longer than I expected and I'm still stuck here. I'll make it up to you, promise.`,
      },
      {
        strategy: 'duygusal',
        text: `I feel awful about this - ${core} and I couldn't get out of it. don't be mad, I'll fix it.`,
      },
    ];
  }

  return [
    {
      strategy: 'sade',
      text: `honestly, ${core}. I'm still in the middle of it and I can't leave.`,
    },
    {
      strategy: 'detayli',
      text: `so this is what happened: ${core}. I tried to wrap it up early but it kept going. I'm heading over as soon as I can, I'll explain when I see you.`,
    },
    {
      strategy: 'duygusal',
      text: `I really didn't want to do this to you - ${core} and I've been stressed about it all evening. I'm sorry, I'll make it up to you.`,
    },
  ];
}

export const templateProvider: LlmProvider = {
  id: 'template',
  async generate(req, ctx: GenerateContext): Promise<GenerateResult> {
    if (req.lang === 'en') {
      const variants = englishDrafts(req).map((draft) => {
        const risk = scoreRisk({
          intensity: req.intensity,
          target: req.target,
          channel: req.channel,
          detailCount: 1,
          hasSecondPerson: false,
          hasLocation: false,
          mentionsDocument: DOCUMENT_WORDS.test(draft.text),
          conflictCount: countConflicts(ctx.recent, req.situation, []),
        });
        return variantSchema.parse({
          text: draft.text,
          strategy: draft.strategy,
          riskScore: risk.score,
          riskLevel: risk.level,
          riskReasons: risk.reasons,
          queries: [
            { q: 'what came up exactly?', a: 'just something I had to deal with, I’ll tell you later.' },
            { q: 'are you coming at all?', a: 'yeah, as soon as I can get away.' },
          ],
        });
      });
      return { variants, provider: 'template' };
    }

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
