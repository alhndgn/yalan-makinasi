import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { localData } from '../../src/web/src/lib/localStore.ts';
import { writeAiConfig } from '../../src/web/src/lib/aiConfig.ts';

const form = { target: 'patron' as const, situation: 'gec_kaldim' as const, channel: 'whatsapp' as const, style: 'ciddi' as const, intensity: 6 };

const aiPayload = {
  choices: [
    {
      message: {
        content: JSON.stringify({
          variants: [
            { text: 'AI-A', strategy: 'sade', riskScore: 15, riskLevel: 'dusuk', riskReasons: [], queries: [] },
            { text: 'AI-B', strategy: 'detayli', riskScore: 40, riskLevel: 'orta', riskReasons: [], queries: [] },
            { text: 'AI-C', strategy: 'duygusal', riskScore: 60, riskLevel: 'orta', riskReasons: [], queries: [] },
          ],
        }),
      },
    },
  ],
};

beforeEach(() => {
  localStorage.clear();
  writeAiConfig({ enabled: true, baseUrl: 'http://192.168.1.12/ai/v1', model: 'qwen2.5:14b-instruct-q4_K_M', apiKey: '' });
});

afterEach(() => vi.unstubAllGlobals());

describe('AI öncelikli üretim', () => {
  it('AI yanıt verirse metinler AI’dan gelir', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(aiPayload), { status: 200 })));
    const result = await localData.generate({ ...form, salt: '1' });
    expect(result.provider).toBe('ai');
    expect(result.variants.map((v) => v.text)).toEqual(['AI-A', 'AI-B', 'AI-C']);
  });

  it('AI hata verirse şablona düşer, kullanıcıya hata çıkmaz', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('boom', { status: 500 })));
    const result = await localData.generate({ ...form, salt: '1' });
    expect(result.provider).toBe('template');
    expect(result.variants).toHaveLength(3);
    expect(result.variants[0]!.text.length).toBeGreaterThan(10);
  });

  it('AI kapalıysa hiç ağ çağrısı yapılmaz', async () => {
    writeAiConfig({ enabled: false, baseUrl: 'http://x/ai/v1', model: 'm', apiKey: '' });
    const spy = vi.fn();
    vi.stubGlobal('fetch', spy);
    const result = await localData.generate({ ...form, salt: '1' });
    expect(spy).not.toHaveBeenCalled();
    expect(result.provider).toBe('template');
  });

  it('bozuk JSON şablona düşürür', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('bozuk', { status: 200 })));
    const result = await localData.generate({ ...form, salt: '1' });
    expect(result.provider).toBe('template');
  });

  it('zaman aşımında şablona düşer', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10))));
    const result = await localData.generate({ ...form, salt: '1' });
    expect(result.provider).toBe('template');
  });
});
