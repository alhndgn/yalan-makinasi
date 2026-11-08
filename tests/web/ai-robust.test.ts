import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateWithAi } from '../../src/web/src/lib/aiProvider.ts';

const cfg = { enabled: true, baseUrl: 'https://api.example/v1', model: 'm', apiKey: 'k' };
const req = { target: 'patron' as const, situation: 'gec_kaldim' as const, channel: 'whatsapp' as const, style: 'ciddi' as const, intensity: 6 };

const three = {
  variants: [
    { text: 'A', strategy: 'sade', riskScore: 10, riskLevel: 'dusuk', riskReasons: [], queries: [] },
    { text: 'B', strategy: 'detayli', riskScore: 20, riskLevel: 'dusuk', riskReasons: [], queries: [] },
    { text: 'C', strategy: 'duygusal', riskScore: 30, riskLevel: 'dusuk', riskReasons: [], queries: [] },
  ],
};

const chat = (content: string) => ({ choices: [{ message: { content } }] });
const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });

afterEach(() => vi.unstubAllGlobals());

describe('AI istemcisi dayanıklılığı', () => {
  it('kod bloğu içine sarılmış JSON’u çözer', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(chat('```json\n' + JSON.stringify(three) + '\n```'))));
    const variants = await generateWithAi(req, cfg);
    expect(variants).toHaveLength(3);
  });

  it('response_format reddedilirse formatsız tekrar dener', async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        calls.push(String(init.body));
        if (calls.length === 1) return new Response('response_format not supported', { status: 400 });
        return json(chat(JSON.stringify(three)));
      }),
    );
    const variants = await generateWithAi(req, cfg);
    expect(variants.map((v) => v.text)).toEqual(['A', 'B', 'C']);
    expect(calls).toHaveLength(2);
    expect(calls[0]).toContain('response_format');
    expect(calls[1]).not.toContain('response_format');
  });

  it('iki deneme de başarısızsa hata fırlatır (çağıran şablona düşer)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 401 })));
    await expect(generateWithAi(req, cfg)).rejects.toThrow();
  });
});
