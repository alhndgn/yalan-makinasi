import { buildApp } from './app.ts';

const rawPort = Number(process.env.PORT ?? 8787);
const port = Number.isFinite(rawPort) && rawPort > 0 ? rawPort : 8787;

const rawRate = Number(process.env.RATE_LIMIT_PER_MIN ?? 20);
const rateLimitPerMin = Number.isFinite(rawRate) && rawRate > 0 ? rawRate : 20;

const aiMode = (['off', 'ollama', 'openrouter'] as const).includes(process.env.AI_MODE as never)
  ? (process.env.AI_MODE as 'off' | 'ollama' | 'openrouter')
  : 'off';

const app = buildApp({
  dbPath: process.env.DB_PATH ?? 'data/yalan.db',
  aiMode,
  rateLimitPerMin,
});

await app.listen({ port, host: '0.0.0.0' });
console.log(`Yalan Makinası API → http://127.0.0.1:${port} (ai=${aiMode})`);
