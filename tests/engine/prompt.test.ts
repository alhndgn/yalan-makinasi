import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, bandFor, INTENSITY_BANDS } from '../../src/engine/prompt.ts';

describe('AI prompt — şiddet bantları', () => {
  it('beş bant var ve 1-10 aralığını boşluksuz kaplar', () => {
    expect(INTENSITY_BANDS).toHaveLength(5);
    expect(INTENSITY_BANDS[0]!.min).toBe(1);
    expect(INTENSITY_BANDS.at(-1)!.max).toBe(10);
    for (let i = 1; i < INTENSITY_BANDS.length; i++) {
      expect(INTENSITY_BANDS[i]!.min).toBe(INTENSITY_BANDS[i - 1]!.max + 1);
    }
  });

  it('sınır değerleri doğru banda düşer', () => {
    expect(bandFor(1).name).toBe('Beyaz yalan');
    expect(bandFor(2).name).toBe('Beyaz yalan');
    expect(bandFor(3).name).toBe('Küçük bahane');
    expect(bandFor(6).name).toBe('Kıvırma');
    expect(bandFor(8).name).toBe('Cesur yalan');
    expect(bandFor(10).name).toBe('Senaryo');
  });

  it('aralık dışı ve bozuk değerleri kırpar', () => {
    expect(bandFor(0).name).toBe('Beyaz yalan');
    expect(bandFor(99).name).toBe('Senaryo');
    expect(bandFor(Number.NaN).name).toBe('Kıvırma');
  });

  it('prompt şiddetle birlikte değişir', () => {
    const low = buildSystemPrompt(1);
    const high = buildSystemPrompt(10);
    expect(low).toContain('Beyaz yalan');
    expect(high).toContain('Senaryo');
    expect(low).not.toBe(high);
    expect(high).toContain('10/10');
  });
});

describe('AI prompt — insan dili ve sınırlar', () => {
  const p = buildSystemPrompt(7);

  it('makine dili yasaklarını taşır', () => {
    expect(p).toContain('Makine gibi düz');
    expect(p).toContain('Kesinlikle');
    expect(p).toContain('günlük kelimeler');
  });

  it('iyi/kötü ton örneği verir', () => {
    expect(p).toContain('KÖTÜ:');
    expect(p).toContain('İYİ:');
  });

  it('resmî belge ve rapor yasağını taşır', () => {
    expect(p).toContain('sağlık raporu');
    expect(p).toContain('fatura');
    expect(p).toContain('mahkeme');
  });

  it('üç strateji ve JSON sözleşmesi var', () => {
    for (const s of ['sade', 'detayli', 'duygusal']) expect(p).toContain(`"${s}"`);
    expect(p).toContain('"variants"');
    expect(p).toContain('"queries"');
  });
});
