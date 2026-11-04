import { createOpenAiCompatProvider } from './openaiCompat.ts';
import type { LlmProvider } from '../types.ts';

export function createOpenRouterProvider(env: Record<string, string | undefined> = process.env): LlmProvider {
  return createOpenAiCompatProvider({
    id: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: env.OPENROUTER_MODEL ?? 'qwen/qwen-2.5-7b-instruct',
    apiKey: env.OPENROUTER_KEY,
    timeoutMs: Number(env.OPENROUTER_TIMEOUT_MS ?? 8000),
  });
}
