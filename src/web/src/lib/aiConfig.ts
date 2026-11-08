/**
 * AI yapılandırması.
 *
 * Öncelik: derleme zamanı ortam değişkenleri (VITE_AI_*) > cihazda kayıtlı ayar > kapalı.
 * Üretim APK'sında değerler gömülüdür; kullanıcı hiçbir ayar görmez.
 */
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

export type EnvLike = Record<string, string | undefined>;

/** Saf fonksiyon: test edilebilir, yan etkisi yok. */
export function resolveAiConfig(env: EnvLike, stored: Partial<AiConfig> | null = null): AiConfig {
  const envBase = (env.VITE_AI_BASE_URL ?? '').trim();
  if (envBase) {
    return {
      enabled: true,
      baseUrl: envBase,
      model: (env.VITE_AI_MODEL ?? '').trim() || DEFAULT_AI.model,
      apiKey: (env.VITE_AI_KEY ?? '').trim(),
    };
  }

  if (stored) {
    return {
      enabled: Boolean(stored.enabled),
      baseUrl: typeof stored.baseUrl === 'string' ? stored.baseUrl : '',
      model: typeof stored.model === 'string' && stored.model ? stored.model : DEFAULT_AI.model,
      apiKey: typeof stored.apiKey === 'string' ? stored.apiKey : '',
    };
  }

  return { ...DEFAULT_AI };
}

export function readAiConfig(): AiConfig {
  let stored: Partial<AiConfig> | null = null;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) stored = JSON.parse(raw) as Partial<AiConfig>;
  } catch {
    stored = null;
  }
  return resolveAiConfig(import.meta.env as unknown as EnvLike, stored);
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
