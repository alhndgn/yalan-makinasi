import { describe, it, expect } from 'vitest';
import { scoreRisk } from '../../src/engine/risk.ts';

const base = {
  intensity: 1,
  target: 'arkadas',
  channel: 'whatsapp',
  detailCount: 0,
  hasSecondPerson: false,
  hasLocation: false,
  mentionsDocument: false,
  conflictCount: 0,
} as const;

describe('scoreRisk', () => {
  it('en hafif kombinasyon düşük risk', () => {
    const r = scoreRisk(base);
    expect(r.score).toBe(18);
    expect(r.level).toBe('dusuk');
  });

  it('eşik sınırları: 34 düşük, 35 orta, 64 orta, 67 yüksek', () => {
    expect(scoreRisk({ ...base, intensity: 3, target: 'sevgili' }).score).toBe(34);
    expect(scoreRisk({ ...base, intensity: 3, target: 'sevgili' }).level).toBe('dusuk');
    expect(scoreRisk({ ...base, intensity: 5, target: 'arkadas', channel: 'telefon' }).score).toBe(35);
    expect(scoreRisk({ ...base, intensity: 5, target: 'arkadas', channel: 'telefon' }).level).toBe('orta');
    expect(scoreRisk({ ...base, intensity: 8, target: 'patron', channel: 'yuz_yuze' }).score).toBe(64);
    expect(scoreRisk({ ...base, intensity: 8, target: 'patron', channel: 'yuz_yuze' }).level).toBe('orta');
    expect(scoreRisk({ ...base, intensity: 9, target: 'patron', channel: 'yuz_yuze' }).score).toBe(67);
    expect(scoreRisk({ ...base, intensity: 9, target: 'patron', channel: 'yuz_yuze' }).level).toBe('yuksek');
  });

  it('belge geçen metin her zaman yüksek risk ve 100 ile sınırlı', () => {
    const r = scoreRisk({ ...base, intensity: 10, target: 'musteri', channel: 'yuz_yuze', detailCount: 3, mentionsDocument: true });
    expect(r.score).toBe(100);
    expect(r.level).toBe('yuksek');
    expect(r.reasons.length).toBeLessThanOrEqual(3);
  });

  it('çelişki puanı 20 ile sınırlıdır ve nedeni yazılır', () => {
    const r = scoreRisk({ ...base, conflictCount: 5 });
    expect(r.score).toBe(38);
    expect(r.reasons).toContain('Bu kişiye son 30 günde 2+ bahane söyledin');
  });
});
