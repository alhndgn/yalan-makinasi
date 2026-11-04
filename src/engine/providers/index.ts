import type { AiMode } from '../../shared/constants.ts';
import type { LlmProvider } from '../types.ts';
import { templateProvider } from './template.ts';

/**
 * AI sağlayıcı kaydı. `off` her zaman şablon motorunu kullanır;
 * ollama/openrouter Task 14'te bağlanır ve hata durumunda şablona düşer.
 */
export function getProvider(_aiMode: AiMode = 'off'): LlmProvider {
  return templateProvider;
}
