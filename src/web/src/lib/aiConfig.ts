/** Cihazda saklanan AI sunucusu ayarı (Ayarlar ekranından düzenlenir). */
export type AiConfig = {
  enabled: boolean;
  baseUrl: string;
  model: string;
  apiKey: string;
};

const KEY = 'ym_ai';

export const DEFAULT_AI: AiConfig = {
  enabled: false,
  baseUrl: '',
  model: 'qwen2.5:14b-instruct-q4_K_M',
  apiKey: '',
};

export function readAiConfig(): AiConfig {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_AI };
    const parsed = JSON.parse(raw) as Partial<AiConfig>;
    return {
      enabled: Boolean(parsed.enabled),
      baseUrl: typeof parsed.baseUrl === 'string' ? parsed.baseUrl : '',
      model: typeof parsed.model === 'string' && parsed.model ? parsed.model : DEFAULT_AI.model,
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
    };
  } catch {
    return { ...DEFAULT_AI };
  }
}

export function writeAiConfig(config: AiConfig): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(config));
  } catch {
    /* yoksay */
  }
}

export function aiReady(config: AiConfig): boolean {
  return config.enabled && config.baseUrl.trim().length > 0;
}
