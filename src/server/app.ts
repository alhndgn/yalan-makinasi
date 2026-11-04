import Fastify, { type FastifyInstance } from 'fastify';

export type AiMode = 'off' | 'ollama' | 'openrouter';

export type BuildAppOptions = {
  dbPath?: string;
  aiMode?: AiMode;
  rateLimitPerMin?: number;
};

export function buildApp(opts: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({ logger: false });

  app.get('/api/health', async () => ({
    ok: true,
    aiMode: opts.aiMode ?? 'off',
    version: '0.1.0',
  }));

  return app;
}
