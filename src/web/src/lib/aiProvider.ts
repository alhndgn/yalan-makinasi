import { z } from 'zod';
import { AI_SYSTEM_PROMPT } from '../../../engine/prompt.ts';
import { variantSchema, type GenerateRequest, type Variant } from '../../../shared/schema.ts';
import type { AiConfig } from './aiConfig.ts';

const responseSchema = z.object({ variants: z.array(variantSchema).length(3) });

/** Model bazen JSON'u ```json ... ``` içine sarar; temizle. */
function stripFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced && fenced[1] ? fenced[1].trim() : trimmed;
}

async function request(
  req: GenerateRequest,
  cfg: AiConfig,
  jsonMode: boolean,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(`${cfg.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        ...(cfg.apiKey ? { authorization: `Bearer ${cfg.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: cfg.model,
        temperature: 0.9,
        max_tokens: 1200,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
        messages: [
          { role: 'system', content: AI_SYSTEM_PROMPT },
          {
            role: 'user',
            content: JSON.stringify({
              target: req.target,
              situation: req.situation,
              situationCustom: req.situationCustom ?? null,
              channel: req.channel,
              style: req.style,
              intensity: req.intensity,
            }),
          },
        ],
      }),
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * AI sunucusundan üç varyant ister (OpenAI uyumlu her uç: Ollama proxy, opencode-go/yelsoft...).
 * Önce JSON modunda dener; sunucu desteklemiyorsa formatsız tekrar dener.
 * Herhangi bir sorunda hata fırlatır; çağıran taraf şablona düşer.
 */
export async function generateWithAi(req: GenerateRequest, cfg: AiConfig, timeoutMs = 30000): Promise<Variant[]> {
  let res = await request(req, cfg, true, timeoutMs);
  if (!res.ok && [400, 404, 415, 422, 500, 501].includes(res.status)) {
    res = await request(req, cfg, false, timeoutMs);
  }
  if (!res.ok) throw new Error(`AI sunucusu ${res.status} döndü`);

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error('AI boş yanıt verdi');

  return responseSchema.parse(JSON.parse(stripFences(raw))).variants;
}
