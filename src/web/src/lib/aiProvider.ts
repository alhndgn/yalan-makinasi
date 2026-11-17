import { z } from 'zod';
import { buildAnswerPrompt, buildSystemPrompt, type HistoryEntry } from '../../../engine/prompt.ts';
import { variantSchema, type GenerateRequest, type Variant } from '../../../shared/schema.ts';
import { getDeviceId } from './deviceId.ts';
import type { AiConfig } from './aiConfig.ts';
import { endpointFor, isNativeApp, postJson, sessionId } from './aiTransport.ts';

const responseSchema = z.object({ variants: z.array(variantSchema).length(3) });
const answerSchema = z.object({ answer: z.string().min(1) });

/** Model bazen JSON'u ```json ... ``` içine sarar; temizle. */
function stripFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced && fenced[1] ? fenced[1].trim() : trimmed;
}

function extractContent(body: unknown): string | null {
  const data = body as { choices?: { message?: { content?: string } }[] } | null;
  return data?.choices?.[0]?.message?.content || null;
}

async function ask(cfg: AiConfig, payload: Record<string, unknown>, timeoutMs: number) {
  const native = isNativeApp();
  const url = endpointFor(cfg.baseUrl, native);
  const headers: Record<string, string> = { 'content-type': 'application/json' };

  if (native) {
    if (cfg.apiKey) headers.authorization = `Bearer ${cfg.apiKey}`;
  } else {
    // Web: kendi proxy'miz; anahtar sunucuda. Cihaz kimliği zorunlu.
    headers['x-device-id'] = getDeviceId();
    headers['x-opencode-session'] = sessionId();
  }

  return postJson(url, payload, headers, timeoutMs, native);
}

/**
 * AI'dan üç varyant ister.
 * `history`, aynı kişiye daha önce söylenen kayıtlardır: model çelişmesin ve kendini tekrar etmesin.
 * Önce JSON modunda dener, sunucu desteklemiyorsa formatsız tekrar dener; olmazsa hata fırlatır (çağıran şablona düşer).
 */
export async function generateWithAi(
  req: GenerateRequest,
  cfg: AiConfig,
  opts: { history?: HistoryEntry[] } = {},
  timeoutMs = 60000,
): Promise<Variant[]> {
  const base = {
    model: cfg.model,
    temperature: 0.95,
    max_tokens: 2600,
    thinking: { type: 'disabled' },
    reasoning_effort: 'minimal',
    messages: [
      { role: 'system', content: buildSystemPrompt(req.intensity, { person: req.person, history: opts.history }) },
      {
        role: 'user',
        content: JSON.stringify({
          person: req.person ?? null,
          target: req.target,
          situation: req.situation,
          situationCustom: req.situationCustom ?? null,
          channel: req.channel,
          style: req.style,
          intensity: req.intensity,
        }),
      },
    ],
  };

  let res = await ask(cfg, { ...base, response_format: { type: 'json_object' } }, timeoutMs);
  if (!res.ok && [400, 404, 415, 422, 500, 501].includes(res.status)) {
    res = await ask(cfg, base, timeoutMs);
  }
  if (!res.ok) throw new Error(`AI sunucusu ${res.status} döndü`);

  const raw = extractContent(res.body);
  if (!raw) throw new Error('AI boş yanıt verdi');

  return responseSchema.parse(JSON.parse(stripFences(raw))).variants;
}

/** "Ne diyeyim?" — kayıtlı bir yalanın ardından gelen soruya cevap. */
export async function answerWithAi(
  input: { lieText: string; question: string; person?: string },
  cfg: AiConfig,
  timeoutMs = 30000,
): Promise<string> {
  const payload = {
    model: cfg.model,
    temperature: 0.7,
    max_tokens: 500,
    thinking: { type: 'disabled' },
    reasoning_effort: 'minimal',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: buildAnswerPrompt(input) },
      { role: 'user', content: input.question },
    ],
  };

  const res = await ask(cfg, payload, timeoutMs);
  if (!res.ok) throw new Error(`AI sunucusu ${res.status} döndü`);
  const raw = extractContent(res.body);
  if (!raw) throw new Error('AI boş yanıt verdi');
  return answerSchema.parse(JSON.parse(stripFences(raw))).answer.trim();
}
