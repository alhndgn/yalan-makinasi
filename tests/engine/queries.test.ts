import { describe, it, expect } from 'vitest';
import { mulberry32 } from '../../src/engine/random.ts';
import { buildQueries } from '../../src/engine/queries.ts';
import { banks } from '../../src/engine/templates/tr.ts';

const bank = banks.gec_kaldim!;
const draft = {
  strategy: 'detayli' as const,
  text: 'Trafik vardı, annemdeydim, kusura bakma.',
  detailTags: ['ulasim'] as const,
  hasSecondPerson: false,
  hasLocation: false,
};

const words = (s: string) => s.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 2);

describe('buildQueries', () => {
  it('sadece metinde geçen detaya ait soruları sorar', () => {
    const qs = buildQueries(bank, { ...draft, detailTags: ['ulasim'] }, mulberry32(1));
    expect(qs.length).toBeGreaterThan(0);
    expect(qs.every((x) => x.q.length > 0 && x.a.length > 0)).toBe(true);
  });

  it('cevap, o detayın metniyle aynı olguyu anlatır', () => {
    const qs = buildQueries(bank, { ...draft, detailTags: ['ulasim'] }, mulberry32(1));
    const detailWords = bank.details.filter((d) => d.tag === 'ulasim').flatMap((d) => words(d.text));
    expect(qs.some((x) => words(x.a).some((w) => detailWords.includes(w)))).toBe(true);
  });

  it('detay yoksa soru yok', () => {
    expect(buildQueries(bank, { ...draft, detailTags: [] }, mulberry32(1))).toEqual([]);
  });

  it('en fazla 3 soru döner', () => {
    const d = { ...draft, detailTags: ['ulasim', 'aile', 'saglik'] as const };
    expect(buildQueries(bank, { ...d, detailTags: [...d.detailTags] }, mulberry32(1)).length).toBeLessThanOrEqual(3);
  });
});
