import { describe, it, expect } from 'vitest';
import { prepareLie } from '../../src/engine/prepareLie.ts';

const form = { target: 'patron' as const, situation: 'gec_kaldim' as const, channel: 'whatsapp' as const, style: 'ciddi' as const, intensity: 6 };
const text = 'Geç kaldım, haber de veremedim. Yolda trafik vardı. Kusura bakma, bir daha olmayacak.';

describe('prepareLie', () => {
  it('metinden detayları çıkarır ve risk/soruları yeniden üretir', () => {
    const prepared = prepareLie(form, text, []);
    expect(prepared.detailTags).toContain('ulasim');
    expect(prepared.riskScore).toBeGreaterThan(0);
    expect(prepared.riskLevel).toBe(prepared.riskScore >= 65 ? 'yuksek' : prepared.riskScore >= 35 ? 'orta' : 'dusuk');
    expect(prepared.queries[0]!.a).toContain('trafik');
  });

  it('geçmiş kayıt riski yükseltir', () => {
    const plain = prepareLie(form, text, []);
    const withHistory = prepareLie(form, text, [{ situation: 'gec_kaldim', detailTags: [] }]);
    expect(withHistory.riskScore).toBeGreaterThan(plain.riskScore);
  });

  it('metinde detay yoksa boş sorgu döner', () => {
    const prepared = prepareLie(form, 'Kusura bakma.', []);
    expect(prepared.detailTags).toHaveLength(0);
    expect(prepared.queries).toHaveLength(0);
  });
});
