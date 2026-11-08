import type { FastifyInstance } from 'fastify';
import { fail } from './helpers.ts';

/**
 * Web modu için AI proxy'si: anahtar sunucuda kalır, tarayıcı CORS'a takılmaz.
 * opencode.ai gibi CORS vermeyen sağlayıcılar için gerekli.
 */
export function registerAiRoutes(app: FastifyInstance) {
  app.post('/api/ai/chat', async (req, reply) => {
    const baseUrl = process.env.AI_BASE_URL ?? process.env.VITE_AI_BASE_URL ?? '';
    const apiKey = process.env.AI_KEY ?? process.env.VITE_AI_KEY ?? '';
    const model = process.env.AI_MODEL ?? process.env.VITE_AI_MODEL ?? '';

    if (!baseUrl) return fail(reply, 503, 'AI_NOT_CONFIGURED', 'AI sunucusu tanımlı değil.');

    const incoming = (req.body ?? {}) as Record<string, unknown>;
    const payload = { ...incoming, model: (incoming.model as string) || model };

    try {
      const upstream = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(35000),
      });

      const body = await upstream.json().catch(() => null);
      if (body === null) {
        return fail(reply, 502, 'AI_BAD_RESPONSE', 'AI yanıtı okunamadı.');
      }
      return reply.code(upstream.status).send(body);
    } catch {
      return fail(reply, 504, 'AI_UNREACHABLE', 'AI sunucusuna ulaşılamadı.');
    }
  });
}
