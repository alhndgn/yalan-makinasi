import { createOpenAiCompatProvider } from './openaiCompat.ts';
import type { LlmProvider } from '../types.ts';

export function createOllamaProvider(env: Record<string, string | undefined> = process.env): LlmProvider {
  return createOpenAiCompatProvider({
    id: 'ollama',
    baseUrl: `${(env.OLLAMA_URL ?? 'http://127.0.0.1:11434').replace(/\/$/, '')}/v1`,
    model: env.OLLAMA_MODEL ?? 'qwen2.5:14b-instruct-q4_K_M',
    timeoutMs: Number(env.OLLAMA_TIMEOUT_MS ?? 6000),
  });
}
