import { describe, it, expect } from 'vitest';
import { templateProvider } from '../../src/engine/providers/template.ts';
import { variantSchema } from '../../src/shared/schema.ts';
import { SITUATIONS, TARGETS } from '../../src/shared/constants.ts';

const ctx = { deviceId: 'd', salt: '0', recent: [] };

describe('templateProvider', () => {
  it('tüm hedef × durum × şiddet kombinasyonlarında 3 geçerli varyant üretir', async () => {
    for (const t of TARGETS) {
      for (const s of SITUATIONS) {
        for (const intensity of [1, 5, 10]) {
          const { variants, provider } = await templateProvider.generate(
            { target: t.id, situation: s.id, channel: 'whatsapp', style: 'ciddi', intensity },
            ctx,
          );
          expect(provider).toBe('template');
          expect(variants, `${t.id}/${s.id}/${intensity}`).toHaveLength(3);
          for (const v of variants) expect(variantSchema.safeParse(v).success, v.text).toBe(true);
          expect(new Set(variants.map((v) => v.text)).size).toBe(3);
        }
      }
    }
  });

  it('ağ çağrısı yapmaz', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = () => {
      throw new Error('fetch yasak');
    };
    try {
      const { variants } = await templateProvider.generate(
        { target: 'patron', situation: 'gec_kaldim', channel: 'whatsapp', style: 'ciddi', intensity: 5 },
        ctx,
      );
      expect(variants).toHaveLength(3);
    } finally {
      globalThis.fetch = original;
    }
  });

  it('aynı kişiye yakın tarihli kayıt varsa risk yükselir ve nedeni yazılır', async () => {
    const req = { target: 'sevgili', situation: 'gidemedim', channel: 'whatsapp', style: 'ciddi', intensity: 5 } as const;
    const plain = await templateProvider.generate(req, ctx);
    const withHistory = await templateProvider.generate(req, {
      ...ctx,
      recent: [{ situation: 'gidemedim', detailTags: ['is'] }],
    });
    expect(withHistory.variants[0]!.riskScore).toBeGreaterThan(plain.variants[0]!.riskScore);
    expect(withHistory.variants[0]!.riskReasons.join(' ')).toContain('30 günde');
  });

  it('farklı durumdaki kayıt riski yükseltmez', async () => {
    const req = { target: 'sevgili', situation: 'gidemedim', channel: 'whatsapp', style: 'ciddi', intensity: 5 } as const;
    const plain = await templateProvider.generate(req, ctx);
    const unrelated = await templateProvider.generate(req, {
      ...ctx,
      recent: [{ situation: 'parayi_harcadim', detailTags: ['is'] }],
    });
    expect(unrelated.variants[0]!.riskScore).toBeLessThanOrEqual(plain.variants[0]!.riskScore + 20);
  });
});
