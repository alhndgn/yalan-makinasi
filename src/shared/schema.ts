import { z } from 'zod';
import {
  CHANNELS,
  CUSTOM_SITUATION_MAX,
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

export const generateRequestSchema = z.object({
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
  target: targetSchema,
  situation: situationSchema,
  text: z.string(),
  status: statusSchema,
  riskScore: z.number().int(),
  createdAt: z.number().int(),
});

export type SavedLie = z.infer<typeof savedLieSchema>;

export const saveLieRequestSchema = z.object({
  variant: variantSchema,
  form: generateRequestSchema,
  provider: z.enum(['template', 'ollama', 'openrouter']).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['beklemede', 'tuttu', 'tutmadı']),
});
