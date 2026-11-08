import { z } from 'zod';
import { AI_SYSTEM_PROMPT } from '../../../engine/prompt.ts';
import { variantSchema, type GenerateRequest, type Variant } from '../../../shared/schema.ts';
import { getDeviceId } from './deviceId.ts';
import type { AiConfig } from './aiConfig.ts';
import { endpointFor, isNativeApp, postJson } from './aiTransport.ts';

const responseSchema = z.object({ variants: z.array(variantSchema).length(3) });

function stripFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced && fenced[1] ? fenced[1].trim() : trimmed;
}

function extractContent(body: unknown): string | null {
  const data = body as { choices?: { message?: { content?: string } }[] } | null;
  return data?.choices?.[0]?.message?.content ?? null;
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
  }
  return postJson(url, payload, headers, timeoutMs, native);
}

/**
 * AI'dan üç varyant ister.
 * - Native (APK): doğrudan sağlayıcı, CORS yok.
 * - Web: /api/ai/chat proxy'si, anahtar sunucuda kalır.
 * Önce JSON modunda dener, sunucu desteklemiyorsa formatsız tekrar dener; olmazsa hata fırlatır (çağıran şablona düşer).
 */
export async function generateWithAi(req: GenerateRequest, cfg: AiConfig, timeoutMs = 30000): Promise<Variant[]> {
  const base = {
    model: cfg.model,
    temperature: 0.9,
    max_tokens: 1200,
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
