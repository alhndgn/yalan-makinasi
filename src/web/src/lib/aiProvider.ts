import { z } from 'zod';
import { AI_SYSTEM_PROMPT } from '../../../engine/prompt.ts';
import { variantSchema, type GenerateRequest, type Variant } from '../../../shared/schema.ts';
import type { AiConfig } from './aiConfig.ts';

const responseSchema = z.object({ variants: z.array(variantSchema).length(3) });

/**
 * AI sunucusundan (VM'deki nginx /ai → Ollama, OpenAI uyumlu) üç varyant ister.
 * Herhangi bir sorunda hata fırlatır; çağıran taraf şablona düşer.
 */
export async function generateWithAi(req: GenerateRequest, cfg: AiConfig, timeoutMs = 25000): Promise<Variant[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${cfg.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        ...(cfg.apiKey ? { authorization: `Bearer ${cfg.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: cfg.model,
        temperature: 0.9,
        response_format: { type: 'json_object' },
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

    if (!res.ok) throw new Error(`AI sunucusu ${res.status} döndü`);
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) throw new Error('AI boş yanıt verdi');
    return responseSchema.parse(JSON.parse(raw)).variants;
  } finally {
    clearTimeout(timer);
  }
}
