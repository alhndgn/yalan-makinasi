import { describe, it, expect } from 'vitest';
import { generateRequestSchema } from '../../src/shared/schema.ts';

const base = { target: 'patron', situation: 'gec_kaldim', channel: 'whatsapp', style: 'ciddi' };

describe('generateRequestSchema', () => {
  it('geçerli isteği kabul eder ve şiddeti tam sayıya çeker', () => {
    expect(generateRequestSchema.parse({ ...base, intensity: '7' }).intensity).toBe(7);
  });
  it('0 ve 11 reddedilir', () => {
    expect(generateRequestSchema.safeParse({ ...base, intensity: 0 }).success).toBe(false);
    expect(generateRequestSchema.safeParse({ ...base, intensity: 11 }).success).toBe(false);
  });
  it('NaN reddedilir', () => {
    expect(generateRequestSchema.safeParse({ ...base, intensity: NaN }).success).toBe(false);
  });
  it('serbest metin 180 karaktere kırpılır', () => {
    const r = generateRequestSchema.parse({ ...base, situation: 'ozel', situationCustom: 'a'.repeat(300), intensity: 5 });
    expect(r.situationCustom).toHaveLength(180);
  });
});
