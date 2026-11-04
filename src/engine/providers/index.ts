import type { AiMode } from '../../shared/constants.ts';
import type { LlmProvider } from '../types.ts';
import { createOllamaProvider } from './ollama.ts';
import { createOpenRouterProvider } from './openrouter.ts';
import { templateProvider } from './template.ts';

/**
 * AI sağlayıcı seçimi. `off` → şablon motoru (varsayılan, ağ yok).
 * ollama/openrouter kendi hatalarında sessizce şablona düşer.
 */
export function getProvider(aiMode: AiMode = 'off'): LlmProvider {
  if (aiMode === 'ollama') return createOllamaProvider();
  if (aiMode === 'openrouter') return createOpenRouterProvider();
  return templateProvider;
}
