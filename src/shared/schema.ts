import { z } from 'zod';
import {
  CHANNELS,
  CUSTOM_SITUATION_MAX,
  HINT_MAX,
  LIE_SOURCES,
  PERSON_MAX,
  INTENSITY_MAX,
  INTENSITY_MIN,
  SITUATIONS,
  STATUSES,
  STRATEGIES,
  STYLES,
  TARGETS,
} from './constants.ts';

const enumOf = <T extends string>(values: readonly T[]) => z.enum(values as unknown as [T, ...T[]]);

const targetSchema = enumOf(TARGETS.map((t) => t.id));
const situationSchema = enumOf(SITUATIONS.map((s) => s.id));
const channelSchema = enumOf(CHANNELS.map((c) => c.id));
const styleSchema = enumOf(STYLES.map((s) => s.id));
const strategySchema = enumOf(STRATEGIES);
const statusSchema = enumOf(STATUSES);

const personSchema = z
  .string()
  .trim()
  .max(PERSON_MAX)
  .transform((s) => s.replace(/\s+/g, ' '))
  .optional();

export const GENDERS = ['kadin', 'erkek', 'belirsiz'] as const;
export type Gender = (typeof GENDERS)[number];

/** Defterde kişi başına tutulan profil: yapay zekâ hitap ve üslubu buna göre seçer. */
export const personProfileSchema = z.object({
  name: z.string().trim().min(1).max(PERSON_MAX),
  relation: targetSchema.default('arkadas'),
  gender: z.enum(GENDERS).default('belirsiz'),
  /** Aramızdaki samimiyet: 1 resmî — 10 çok samimi. */
  closeness: z.coerce.number().int().min(1).max(10).default(5),
  /** Serbest notlar: mesleği, neleri kontrol edebileceği, dikkat edilecekler. */
  notes: z.string().trim().max(300).default(''),
});

export type PersonProfile = z.infer<typeof personProfileSchema>;

export const generateRequestSchema = z.object({
  person: personSchema,
  /** "Nasıl bir yalan olsun?" — opsiyonel yönlendirme (ör. "ailevi bir mazeret olsun"). */
  hint: z
    .string()
    .trim()
    .transform((s) => s.slice(0, HINT_MAX))
    .optional(),
  target: targetSchema,
  situation: situationSchema,
  situationCustom: z
    .string()
    .trim()
    .transform((s) => s.slice(0, CUSTOM_SITUATION_MAX))
    .optional(),
  channel: channelSchema,
  style: styleSchema,
  intensity: z.preprocess(
    (value) => (typeof value === 'boolean' ? Number.NaN : value),
    z.coerce.number().int().min(INTENSITY_MIN).max(INTENSITY_MAX),
  ),
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;

export const querySchema = z.object({ q: z.string().min(1), a: z.string().min(1) });

export const variantSchema = z.object({
  text: z.string().min(1).max(1000),
  strategy: strategySchema,
  riskScore: z.number().int().min(0).max(100),
  riskLevel: z.enum(['dusuk', 'orta', 'yuksek']),
  riskReasons: z.array(z.string()),
  queries: z.array(querySchema).max(3),
});

export type Variant = z.infer<typeof variantSchema>;
export type Query = z.infer<typeof querySchema>;

export const previewQuerySchema = z.object({
  target: targetSchema,
  situation: situationSchema,
  channel: channelSchema,
  intensity: z.preprocess(
    (value) => (typeof value === 'boolean' ? Number.NaN : value),
    z.coerce.number().int().min(INTENSITY_MIN).max(INTENSITY_MAX),
  ),
});

export type PreviewQuery = z.infer<typeof previewQuerySchema>;

export const savedLieSchema = z.object({
  id: z.string(),
  person: z.string().default(''),
  target: targetSchema,
  situation: situationSchema,
  text: z.string(),
  status: statusSchema,
  riskScore: z.number().int(),
  createdAt: z.number().int(),
  source: z.enum(LIE_SOURCES).default('ai'),
  channel: channelSchema.optional(),
  queries: z.array(querySchema).default([]),
});

export type SavedLie = z.infer<typeof savedLieSchema>;

/** Defterin kişi özeti. */
export type PersonSummary = {
  person: string;
  count: number;
  lastAt: number;
  pending: number;
  conflicts: number;
  targets: string[];
  relation?: PersonProfile['relation'];
  gender?: PersonProfile['gender'];
  closeness?: number;
  notes?: string;
};

export type ManualLieInput = {
  person: string;
  text: string;
  target?: GenerateRequest['target'];
  situation?: GenerateRequest['situation'];
  channel?: GenerateRequest['channel'];
  happenedAt?: number;
};

export const saveLieRequestSchema = z.object({
  variant: variantSchema,
  form: generateRequestSchema,
  provider: z.enum(['template', 'ai', 'ollama', 'openrouter']).optional(),
  source: z.enum(LIE_SOURCES).optional(),
  /** Kaydın gerçekleştiği an (manuel kayıtta geçmiş tarih seçilebilir). */
  happenedAt: z.coerce.number().int().optional(),
});

/** Kullanıcının kendi yazdığı yalan kaydı. */
export const manualLieSchema = z.object({
  person: z.string().trim().min(1).max(PERSON_MAX),
  text: z.string().trim().min(3).max(1000),
  target: targetSchema.optional(),
  situation: situationSchema.optional(),
  channel: channelSchema.optional(),
  happenedAt: z.coerce.number().int().optional(),
});

/** "Ne diyeyim?" — kayıtlı bir yalan için gelen soruya cevap. */
export const followUpSchema = z.object({
  lieId: z.string().min(1),
  question: z.string().trim().min(2).max(200),
});

export type FollowUpRequest = z.infer<typeof followUpSchema>;

export const updateStatusSchema = z.object({
  status: z.enum(['beklemede', 'tuttu', 'tutmadı']),
});
