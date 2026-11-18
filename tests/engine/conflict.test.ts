import { describe, it, expect } from 'vitest';
import { findConflicts, similarity, tokens } from '../../src/engine/conflict.ts';

const DAY = 86_400_000;
const NOW = new Date(2026, 10, 18, 12, 0, 0).getTime();

const lie = (id: string, text: string, situation: string, daysAgo: number, status = 'beklemede') => ({
  id,
  text,
  person: 'Ayşe',
  situation,
  createdAt: NOW - daysAgo * DAY,
  status,
});

describe('metin benzerliği', () => {
  it('aynı cümle 1 döner', () => {
    expect(similarity('annem rahatsızlandı gelemedim', 'annem rahatsızlandı gelemedim')).toBe(1);
  });

  it('alakasız cümlelerde düşük', () => {
    expect(similarity('toplantı uzadı', 'kardeşim geldi şehir dışından')).toBeLessThan(0.2);
  });

  it('kısa kelimeler atılır, noktalama yok sayılır', () => {
    expect([...tokens('İş, çıktı!')]).toEqual(['çıktı']);
  });
});

describe('çelişki bulma', () => {
  it('iki hafta içinde aynı mazeret → tekrar', () => {
    const found = findConflicts([lie('a', 'iş çıktı gelemedim', 'is_gucu', 10), lie('b', 'yine iş çıktı', 'is_gucu', 2)]);
    expect(found).toHaveLength(1);
    expect(found[0]!.kind).toBe('repeat');
    expect(found[0]!.severity).toBe('medium');
  });

  it('iki haftadan eski tekrar sayılmaz', () => {
    const found = findConflicts([lie('a', 'iş çıktı gelemedim', 'is_gucu', 40), lie('b', 'iş çıktı yine', 'is_gucu', 2)]);
    expect(found).toHaveLength(0);
  });

  it('neredeyse aynı cümle → yüksek', () => {
    const found = findConflicts([
      lie('a', 'dün akşam annem rahatsızlandı hastaneye götürdüm', 'aile_saglik', 6),
      lie('b', 'annem rahatsızlandı dün akşam hastaneye götürdüm ben', 'aile_saglik', 5),
    ]);
    expect(found[0]!.kind).toBe('similar');
    expect(found[0]!.severity).toBe('high');
  });

  it('aynı gün iki farklı mazeret → yüksek', () => {
    const found = findConflicts([lie('a', 'iş çıktı', 'is_gucu', 0), lie('b', 'yolda kaldım', 'ulasim', 0)]);
    expect(found.some((c) => c.kind === 'same_day')).toBe(true);
  });

  it('zıt ayrıntı → düşük, çiftiyle', () => {
    const found = findConflicts([
      lie('a', 'annem hasta bugün ona bakıyorum', 'aile_saglik', 20),
      lie('b', 'annem şehir dışında burada değil', 'aile_saglik', 90),
    ]);
    const detail = found.find((c) => c.kind === 'detail');
    expect(detail).toBeTruthy();
    expect(detail!.severity).toBe('low');
    expect(detail!.pair).toBeTruthy();
  });

  it('tek kayıtta çelişki yok', () => {
    expect(findConflicts([lie('a', 'iş çıktı', 'is_gucu', 1)])).toHaveLength(0);
  });

  it('aynı kayıt çifti için tek satır döner', () => {
    const found = findConflicts([
      lie('a', 'annem hasta gelemedim bu akşam', 'aile_saglik', 3),
      lie('b', 'annem hasta gelemedim bu akşam', 'aile_saglik', 3),
    ]);
    expect(found).toHaveLength(1);
    expect(found[0]!.severity).toBe('high');
  });
});
