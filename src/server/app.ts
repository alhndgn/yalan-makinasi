import Fastify, { type FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { AiMode } from '../shared/constants.ts';
import { getProvider } from '../engine/providers/index.ts';
import { openDb } from './db.ts';
import { createRateLimiter } from './rateLimit.ts';
import { fail } from './routes/helpers.ts';
import { registerAiRoutes } from './routes/ai.ts';
import { registerGenerateRoutes } from './routes/generate.ts';
import { registerLieRoutes } from './routes/lies.ts';

export type { AiMode };

export type BuildAppOptions = {
  dbPath?: string;
  aiMode?: AiMode;
  rateLimitPerMin?: number;
};

export function buildApp(opts: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({ logger: false });
  const db = openDb(opts.dbPath ?? ':memory:');
  const aiMode = opts.aiMode ?? 'off';
  const provider = getProvider(aiMode);
  const limit = createRateLimiter(opts.rateLimitPerMin ?? 20);

  app.addHook('onRequest', async (req, reply) => {
    if (!req.url.startsWith('/api/') || req.url.startsWith('/api/health')) return;

    if (!req.headers['x-device-id']) {
      return fail(reply, 400, 'DEVICE_REQUIRED', 'X-Device-Id başlığı gerekli.');
    }

    if (req.method === 'POST' && req.url.startsWith('/api/generate')) {
      const key = `${String(req.headers['x-device-id'])}|${req.ip}`;
      const result = limit(key);
      if (!result.allowed) {
        reply.header('retry-after', String(result.retryAfter));
        return fail(reply, 429, 'RATE_LIMITED', 'Biraz bekle, çok hızlı üretiyorsun.');
      }
    }
  });

  app.setErrorHandler((error, req, reply) => {
    const status = error.statusCode && error.statusCode >= 400 && error.statusCode < 500 ? error.statusCode : 500;
    if (!req.url.startsWith('/api/')) {
      return reply.code(status).send(status === 500 ? 'Beklenmeyen bir hata oluştu.' : error.message);
    }
    if (status === 500) {
      return reply.code(500).send({ error: { code: 'INTERNAL', message: 'Beklenmeyen bir hata oluştu.' } });
    }
    if (error.code?.includes('INVALID_JSON')) {
      return reply.code(400).send({ error: { code: 'INVALID_JSON', message: 'Gövde geçerli JSON değil.' } });
    }
    return reply.code(status).send({ error: { code: error.code ?? 'BAD_REQUEST', message: error.message } });
  });

  app.get('/api/health', async () => ({ ok: true, aiMode, version: '0.6.0' }));

  registerAiRoutes(app);
  registerGenerateRoutes(app, db, provider);
  registerLieRoutes(app, db);

  const distDir = resolve(process.cwd(), 'src/web/dist');
  if (existsSync(distDir)) {
    app.register(fastifyStatic, { root: distDir });
    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith('/api/')) {
        return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Yol bulunamadı.' } });
      }
      return reply.sendFile('index.html');
    });
  }

  app.addHook('onClose', async () => {
    db.close();
  });

  return app;
}
