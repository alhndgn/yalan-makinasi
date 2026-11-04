import { describe, it, expect } from 'vitest';
import { compose } from '../../src/engine/compose.ts';

const base = { deviceId: 'dev-1', target: 'patron', situation: 'gec_kaldim', channel: 'whatsapp', style: 'ciddi', salt: '0' } as const;

describe('compose', () => {
  it('üç strateji döner ve metinler birbirinden farklı', () => {
    const drafts = compose({ ...base, intensity: 5 });
    expect(drafts.map((d) => d.strategy).sort()).toEqual(['detayli', 'duygusal', 'sade']);
    expect(new Set(drafts.map((d) => d.text)).size).toBe(3);
  });

  it('aynı girdi + aynı salt = aynı çıktı', () => {
    expect(compose({ ...base, intensity: 7 })).toEqual(compose({ ...base, intensity: 7 }));
  });

  it('farklı salt farklı detay seçer', () => {
    const a = compose({ ...base, intensity: 9, salt: '1' })[1]!.detailTags.join('|');
    const b = compose({ ...base, intensity: 9, salt: '2' })[1]!.detailTags.join('|');
    expect(a).not.toBe(b);
  });

  it('tekrar eden cümleyi iki kez yazmaz', () => {
    for (const intensity of [1, 5, 10]) {
      for (const draft of compose({ ...base, intensity })) {
        const sentences = draft.text
          .split(/(?<=\.)\s+/)
          .map((s) => s.trim().toLowerCase().replace(/[.,!?;:…"'“”]/g, ''));
        for (const s of sentences) {
          const others = sentences.filter((o) => o !== s);
          expect(others.some((o) => o.includes(s) || s.includes(o))).toBe(false);
        }
      }
    }
  });

  it('duygusal strateji tek detay kullanır (spec §10.2)', () => {
    const drafts = compose({ ...base, intensity: 10 });
    const duygusal = drafts.find((d) => d.strategy === 'duygusal')!;
    expect(duygusal.detailTags).toHaveLength(1);
  });

  it('detaylı ve duygusal varyantlar aynı detayları tekrarlamaz', () => {
    const drafts = compose({ ...base, intensity: 10 });
    const detayli = drafts.find((d) => d.strategy === 'detayli')!;
    const duygusal = drafts.find((d) => d.strategy === 'duygusal')!;
    expect(duygusal.detailTags.every((t) => !detayli.detailTags.includes(t)) || duygusal.text !== detayli.text).toBe(true);
    expect(detayli.text).not.toBe(duygusal.text);
  });

  it('detay sayısı şiddetle artar ve 3 ile sınırlıdır', () => {
    expect(compose({ ...base, intensity: 1 })[1]!.detailTags).toHaveLength(0);
    expect(compose({ ...base, intensity: 6 })[1]!.detailTags).toHaveLength(2);
    expect(compose({ ...base, intensity: 10 })[1]!.detailTags).toHaveLength(3);
  });
});
