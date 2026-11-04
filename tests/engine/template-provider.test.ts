import { describe, it, expect } from 'vitest';
import { templateProvider } from '../../src/engine/providers/template.ts';
import { variantSchema } from '../../src/shared/schema.ts';
import { SITUATIONS, TARGETS } from '../../src/shared/constants.ts';

const ctx = { deviceId: 'd', salt: '0', conflictCount: 0 };

describe('templateProvider', () => {
  it('tüm hedef × durum × şiddet kombinasyonlarında 3 geçerli varyant üretir', async () => {
    for (const t of TARGETS) {
      for (const s of SITUATIONS) {
        for (const intensity of [1, 5, 10]) {
          const vs = await templateProvider.generate(
            { target: t.id, situation: s.id, channel: 'whatsapp', style: 'ciddi', intensity },
            ctx,
          );
          expect(vs, `${t.id}/${s.id}/${intensity}`).toHaveLength(3);
          for (const v of vs) expect(variantSchema.safeParse(v).success, v.text).toBe(true);
          expect(new Set(vs.map((v) => v.text)).size).toBe(3);
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
      const vs = await templateProvider.generate(
        { target: 'patron', situation: 'gec_kaldim', channel: 'whatsapp', style: 'ciddi', intensity: 5 },
        ctx,
      );
      expect(vs).toHaveLength(3);
    } finally {
      globalThis.fetch = original;
    }
  });

  it('çelişki varsa risk puanı yükselir', async () => {
    const a = await templateProvider.generate(
      { target: 'sevgili', situation: 'gidemedim', channel: 'whatsapp', style: 'ciddi', intensity: 5 },
      ctx,
    );
    const b = await templateProvider.generate(
      { target: 'sevgili', situation: 'gidemedim', channel: 'whatsapp', style: 'ciddi', intensity: 5 },
      { ...ctx, conflictCount: 2 },
    );
    expect(b[0]!.riskScore).toBeGreaterThan(a[0]!.riskScore);
    expect(b[0]!.riskReasons.join(' ')).toContain('30 günde');
  });
});
