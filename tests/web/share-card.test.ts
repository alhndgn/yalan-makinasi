import { describe, it, expect } from 'vitest';
import { buildShareCardModel } from '../../src/web/src/lib/shareCard.ts';

describe('buildShareCardModel', () => {
  it('1080×1350 ve metni satırlara böler', () => {
    const m = buildShareCardModel({ text: 'a'.repeat(40) + ' ' + 'b'.repeat(300), targetLabel: 'Patron', riskLevel: 'orta' });
    expect(m.width).toBe(1080);
    expect(m.height).toBe(1350);
    expect(m.lines.length).toBeGreaterThan(1);
    expect(m.lines.every((l) => !l.includes('\n'))).toBe(true);
    expect(m.lines.length).toBeLessThanOrEqual(12);
  });

  it('alt yazı marka içerir', () => {
    expect(buildShareCardModel({ text: 'x', targetLabel: 'Arkadaş', riskLevel: 'dusuk' }).footer).toContain('Yalan Makinası');
  });

  it('risk etiketi Türkçe yazılır', () => {
    expect(buildShareCardModel({ text: 'x', targetLabel: 'Arkadaş', riskLevel: 'yuksek' }).riskLabel).toBe('YÜKSEK RİSK');
  });
});
