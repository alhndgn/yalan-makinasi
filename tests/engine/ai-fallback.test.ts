import { describe, it, expect, vi, afterEach } from 'vitest';
import { createOpenAiCompatProvider } from '../../src/engine/providers/openaiCompat.ts';
import { getProvider } from '../../src/engine/providers/index.ts';

const req = { target: 'patron', situation: 'gec_kaldim', channel: 'whatsapp', style: 'ciddi', intensity: 5 } as never;
const ctx = { deviceId: 'd', salt: '0', conflictCount: 0 };

const validPayload = {
  choices: [
    {
      message: {
        content: JSON.stringify({
          variants: [
            { text: 'A', strategy: 'sade', riskScore: 10, riskLevel: 'dusuk', riskReasons: [], queries: [] },
            { text: 'B', strategy: 'detayli', riskScore: 20, riskLevel: 'dusuk', riskReasons: [], queries: [] },
            { text: 'C', strategy: 'duygusal', riskScore: 30, riskLevel: 'dusuk', riskReasons: [], queries: [] },
          ],
        }),
      },
    },
  ],
};

afterEach(() => vi.unstubAllGlobals());

describe('openaiCompat', () => {
  it('geçerli JSON dönerse LLM varyantlarını kullanır', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(validPayload), { status: 200 })));
    const p = createOpenAiCompatProvider({ id: 'ollama', baseUrl: 'http://x', model: 'm' });
    const vs = await p.generate(req, ctx);
    expect(vs.map((v) => v.text)).toEqual(['A', 'B', 'C']);
  });

  it('bozuk JSON → şablona düşer, hata fırlatmaz', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('bozuk', { status: 200 })));
    const p = createOpenAiCompatProvider({ id: 'ollama', baseUrl: 'http://x', model: 'm' });
    const vs = await p.generate(req, ctx);
    expect(vs).toHaveLength(3);
    expect(vs[0]!.text.length).toBeGreaterThan(0);
  });

  it('500 → şablona düşer', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('err', { status: 500 })));
    const p = createOpenAiCompatProvider({ id: 'openrouter', baseUrl: 'http://x', model: 'm', apiKey: 'k' });
    expect(await p.generate(req, ctx)).toHaveLength(3);
  });

  it('ağ hatası → şablona düşer', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new Error('offline'))));
    const p = createOpenAiCompatProvider({ id: 'ollama', baseUrl: 'http://x', model: 'm' });
    expect(await p.generate(req, ctx)).toHaveLength(3);
  });

  it('getProvider off modunda şablon döner', () => {
    expect(getProvider('off').id).toBe('template');
  });
});
