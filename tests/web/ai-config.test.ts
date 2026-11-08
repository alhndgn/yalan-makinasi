import { describe, it, expect } from 'vitest';
import { resolveAiConfig } from '../../src/web/src/lib/aiConfig.ts';

describe('resolveAiConfig', () => {
  it('derleme zamanı adres varsa AI açılır ve model/anahtar oradan gelir', () => {
    const cfg = resolveAiConfig({
      VITE_AI_BASE_URL: 'https://api.yelsoft.online/v1',
      VITE_AI_MODEL: 'ollamacloud/deepseek-v4.1-flash',
      VITE_AI_KEY: 'gizli',
    });
    expect(cfg).toMatchObject({
      enabled: true,
      baseUrl: 'https://api.yelsoft.online/v1',
      model: 'ollamacloud/deepseek-v4.1-flash',
      apiKey: 'gizli',
    });
  });

  it('model verilmezse varsayılan model kullanılır', () => {
    expect(resolveAiConfig({ VITE_AI_BASE_URL: 'http://x/v1' }).model).toContain('qwen2.5');
  });

  it('derleme zamanı adres yoksa cihazda kayıtlı ayar geçerli', () => {
    const cfg = resolveAiConfig({}, { enabled: true, baseUrl: 'http://192.168.1.12/ai/v1', model: 'm', apiKey: 'k' });
    expect(cfg.enabled).toBe(true);
    expect(cfg.baseUrl).toBe('http://192.168.1.12/ai/v1');
  });

  it('hiçbir ayar yoksa AI kapalı', () => {
    expect(resolveAiConfig({}).enabled).toBe(false);
  });

  it('anahtar gömülü olsa bile adres boşsa AI çalışmaz', () => {
    expect(resolveAiConfig({ VITE_AI_KEY: 'k' }).enabled).toBe(false);
  });
});
