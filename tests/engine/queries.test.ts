import { describe, it, expect } from 'vitest';
import { mulberry32 } from '../../src/engine/random.ts';
import { buildQueries } from '../../src/engine/queries.ts';
import { banks } from '../../src/engine/templates/tr.ts';
import { templateProvider } from '../../src/engine/providers/template.ts';
import { SITUATIONS, TARGETS } from '../../src/shared/constants.ts';

const bank = banks.gec_kaldim;
const words = (s: string) => s.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 2);

describe('buildQueries', () => {
  it('sorular yalnızca verilen detaylardan üretilir', () => {
    const details = bank.details.slice(0, 2);
    const qs = buildQueries(details, mulberry32(1));
    expect(qs).toHaveLength(2);
    for (const item of qs) {
      const matched = details.find((d) => d.q === item.q && d.a === item.a);
      expect(matched, item.q).toBeTruthy();
    }
  });

  it('detay yoksa soru yok', () => {
    expect(buildQueries([], mulberry32(1))).toEqual([]);
  });

  it('en fazla 3 soru döner', () => {
    expect(buildQueries(bank.details, mulberry32(1)).length).toBe(3);
  });

  it('her cevap, ait olduğu detayın ayırt edici kelimesini taşır', () => {
    const d = bank.details[1]!;
    const [qa] = buildQueries([d], mulberry32(2));
    const shared = words(qa!.a).filter((w) => words(d.text).includes(w));
    expect(shared.length).toBeGreaterThan(0);
  });
});

describe('templateProvider uçtan uca tutarlılık', () => {
  it('dönen her cevap, aynı varyantın metninde geçen bir detaya ait', async () => {
    const ctx = { deviceId: 'd', salt: '0', recent: [] };
    for (const t of TARGETS) {
      for (const s of SITUATIONS) {
        for (const intensity of [1, 5, 10]) {
          const { variants } = await templateProvider.generate(
            { target: t.id, situation: s.id, channel: 'whatsapp', style: 'ciddi', intensity },
            ctx,
          );
          for (const v of variants) {
            for (const qa of v.queries) {
              const detail = banks[s.id].details.find((d) => d.q === qa.q);
              expect(detail, `${s.id}: ${qa.q}`).toBeTruthy();
              expect(v.text, `${s.id} metninde detay yok: ${qa.q}`).toContain(detail!.text);
            }
          }
        }
      }
    }
  });
});
