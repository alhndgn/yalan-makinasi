import { buildApp } from './app.ts';

const port = Number(process.env.PORT ?? 8787);
const app = buildApp({
  dbPath: process.env.DB_PATH ?? 'data/yalan.db',
  aiMode: (process.env.AI_MODE as 'off' | 'ollama' | 'openrouter') ?? 'off',
  rateLimitPerMin: Number(process.env.RATE_LIMIT_PER_MIN ?? 20),
});

await app.listen({ port, host: '0.0.0.0' });
console.log(`Yalan Makinası API → http://127.0.0.1:${port}`);
