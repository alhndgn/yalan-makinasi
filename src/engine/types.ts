import type { GenerateRequest, Variant } from '../shared/schema.ts';

export type GenerateContext = {
  deviceId: string;
  salt: string;
  conflictCount: number;
};

export type ProviderId = 'template' | 'ollama' | 'openrouter';

export interface LlmProvider {
  id: ProviderId;
  generate(req: GenerateRequest, ctx: GenerateContext): Promise<Variant[]>;
}
