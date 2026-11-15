import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { api } from '../../src/web/src/lib/api.ts';

const form = { target: 'patron' as const, situation: 'gec_kaldim' as const, channel: 'whatsapp' as const, style: 'ciddi' as const, intensity: 6, salt: '1' };
const three = (tag: string) => ({
  variants: [0, 1, 2].map((i) => ({
    text: `${tag}-${i}`,
    strategy: ['sade', 'detayli', 'duygusal'][i],
    riskScore: 20,
    riskLevel: 'dusuk',
    riskReasons: [],
    queries: [],
  })),
});
const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe('Sunucu istemcisinde AI önceliği', () => {
  it('AI yapılandırılmışsa /api/ai/chat kullanılır, /api/generate çağrılmaz', async () => {
    localStorage.setItem('ym_ai', JSON.stringify({ enabled: true, baseUrl: 'https://opencode.ai/zen/go/v1', model: 'm', apiKey: '' }));
    const calls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      calls.push(String(url));
      return ok({ choices: [{ message: { content: JSON.stringify(three('ai')) } }] });
    }));

    const res = await api.generate(form);
    expect(res.provider).toBe('ai');
    expect(res.variants.map((v) => v.text)).toEqual(['ai-0', 'ai-1', 'ai-2']);
    expect(calls).toEqual(['/api/ai/chat']);
  });

  it('AI hata verirse sunucu üretimine düşer', async () => {
    localStorage.setItem('ym_ai', JSON.stringify({ enabled: true, baseUrl: 'https://opencode.ai/zen/go/v1', model: 'm', apiKey: '' }));
    const calls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      calls.push(String(url));
      if (String(url).includes('/api/ai/chat')) return new Response('boom', { status: 500 });
      return ok({ variants: three('srv').variants, provider: 'template' });
    }));

    const res = await api.generate(form);
    expect(res.provider).toBe('template');
    // İlk deneme + JSON modsuz tekrar deneme, ikisi de AI; sonra sunucu üretimi.
    expect(calls.filter((c) => c === '/api/ai/chat')).toHaveLength(2);
    expect(calls.at(-1)).toContain('/api/generate');
  });
});
