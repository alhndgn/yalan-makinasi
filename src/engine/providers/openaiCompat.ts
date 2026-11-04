import { z } from 'zod';
import { variantSchema } from '../../shared/schema.ts';
import type { GenerateContext, LlmProvider, ProviderId } from '../types.ts';
import { templateProvider } from './template.ts';

export type OpenAiCompatConfig = {
  id: Extract<ProviderId, 'ollama' | 'openrouter'>;
  baseUrl: string;
  model: string;
  apiKey?: string;
  timeoutMs?: number;
};

const responseSchema = z.object({ variants: z.array(variantSchema).length(3) });

const SYSTEM_PROMPT = `Sen Türkçe yazan bir "kıvırma asistanısın". Kullanıcının verdiği bağlama göre üç farklı bahane metni üretirsin.

Kurallar:
- Yalnızca verilen hedef (target), durum (situation), kanal (channel), ton (style) ve yalan şiddeti (intensity 1-10) sınırında kal.
- Şiddet arttıkça cümle ve detay sayısı artar; 1-2 tek cümle, 9-10 tam hikâye.
- Resmî belge, sağlık raporu, imza, fatura, mahkeme/savcılık ile ilgili içerik ÜRETME.
- Üç strateji üret: "sade", "detayli", "duygusal".
- Her metin için "queries" alanında karşı tarafın sorabileceği en fazla 3 soru ve metinle ÇELİŞMEYEN cevaplar yaz.
- "riskScore" 0-100, "riskLevel" "dusuk" | "orta" | "yuksek".
- Sadece şu JSON ile yanıt ver: {"variants":[{"text":"","strategy":"sade","riskScore":0,"riskLevel":"dusuk","riskReasons":[],"queries":[{"q":"","a":""}]}]}`;

export function createOpenAiCompatProvider(cfg: OpenAiCompatConfig): LlmProvider {
  return {
    id: cfg.id,
    async generate(req, ctx: GenerateContext) {
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
              { role: 'system', content: SYSTEM_PROMPT },
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
        return parsed.variants;
      } catch {
        // Sessiz düşüş: kullanıcı hata görmez, şablon motoru devralır.
        return templateProvider.generate(req, ctx);
      }
    },
  };
}
