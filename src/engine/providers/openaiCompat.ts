import { z } from 'zod';
import { buildSystemPrompt } from '../prompt.ts';
import { variantSchema } from '../../shared/schema.ts';
import type { GenerateContext, GenerateResult, LlmProvider, ProviderId } from '../types.ts';
import { templateProvider } from './template.ts';

export type OpenAiCompatConfig = {
  id: Extract<ProviderId, 'ollama' | 'openrouter'>;
  baseUrl: string;
  model: string;
  apiKey?: string;
  timeoutMs?: number;
};

const responseSchema = z.object({ variants: z.array(variantSchema).length(3) });

export function createOpenAiCompatProvider(cfg: OpenAiCompatConfig): LlmProvider {
  return {
    id: cfg.id,
    async generate(req, ctx: GenerateContext): Promise<GenerateResult> {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), cfg.timeoutMs ?? 6000);

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
              { role: 'system', content: buildSystemPrompt(req.intensity) },
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
        }).finally(() => clearTimeout(timer));

        if (!res.ok) throw new Error(`LLM ${res.status}`);
        const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        const raw = data.choices?.[0]?.message?.content;
        if (!raw) throw new Error('bos cevap');
        const parsed = responseSchema.parse(JSON.parse(raw));
        return { variants: parsed.variants, provider: cfg.id };
      } catch {
        // Sessiz düşüş: kullanıcı hata görmez, şablon motoru devralır.
        return templateProvider.generate(req, ctx);
      }
    },
  };
}
