import { describe, it, expect } from 'vitest';
import { calendar, dangerScore, scorecard, stalePending, streakDays } from '../../src/engine/insights.ts';

const DAY = 86_400_000;
const NOW = new Date(2026, 10, 18, 15, 0, 0).getTime();
const at = (daysAgo: number) => NOW - daysAgo * DAY;

const lie = (id: string, daysAgo: number, status = 'beklemede', situation = 'is_gucu') => ({
  id,
  text: 'bir şey oldu',
  person: 'Ayşe',
  situation,
  createdAt: at(daysAgo),
  status,
});

describe('karne', () => {
  it('tuttu/tutmadı sayar ve oranı verir', () => {
    const card = scorecard([lie('a', 1, 'tuttu'), lie('b', 2, 'tuttu'), lie('c', 3, 'tutmadı')]);
    expect(card.total).toBe(3);
    expect(card.held).toBe(2);
    expect(card.failed).toBe(1);
    expect(card.heldRate).toBe(67);
  });

  it('değerlendirilen yoksa oran null', () => {
    expect(scorecard([lie('a', 1)]).heldRate).toBeNull();
  });

  it('en sık durumu bulur, "ozel" sayılmaz', () => {
    const card = scorecard([lie('a', 1, 'tuttu', 'is_gucu'), lie('b', 2, 'tuttu', 'is_gucu'), lie('c', 3, 'tuttu', 'ozel')]);
    expect(card.topSituation).toBe('is_gucu');
    expect(card.topSituationCount).toBe(2);
  });

  it('boş defter', () => {
    expect(scorecard([])).toMatchObject({ total: 0, pending: 0, heldRate: null, topSituation: null });
  });
});

describe('takvim', () => {
  it('30 gün döner ve sayar', () => {
    const buckets = calendar([lie('a', 0), lie('b', 0), lie('c', 5)], 30, NOW);
    expect(buckets).toHaveLength(30);
    expect(buckets[buckets.length - 1]!.count).toBe(2);
    const fiveAgo = buckets[buckets.length - 6]!;
    expect(fiveAgo.count).toBe(1);
  });
});

describe('mum serisi', () => {
  it('kesintisiz günleri sayar', () => {
    expect(streakDays([lie('a', 0), lie('b', 1), lie('c', 2)], NOW)).toBe(3);
  });

  it('bugün kayıt yoksa dünden sayar', () => {
    expect(streakDays([lie('a', 1), lie('b', 2)], NOW)).toBe(2);
  });

  it('boşlukta durur', () => {
    expect(streakDays([lie('a', 0), lie('b', 3)], NOW)).toBe(1);
  });

  it('boş defter sıfır', () => {
    expect(streakDays([], NOW)).toBe(0);
  });
});

describe('tehlike yüzdesi', () => {
  it('boş defterde sıfır', () => {
    expect(dangerScore([])).toMatchObject({ percent: 0, level: 'dusuk' });
  });

  it('yüksek risk + yakalanan kayıtlar → yüksek', () => {
    const items = [
      { id: 'a', text: 'x', situation: 'is_gucu', createdAt: 1, status: 'tutmadı', riskScore: 90 },
      { id: 'b', text: 'y', situation: 'is_gucu', createdAt: 2, status: 'tutmadı', riskScore: 88 },
      { id: 'c', text: 'z', situation: 'is_gucu', createdAt: 3, status: 'tuttu', riskScore: 92 },
    ];
    const d = dangerScore(items);
    expect(d.percent).toBeGreaterThan(66);
    expect(d.level).toBe('yuksek');
    expect(d.failureRate).toBeCloseTo(0.67, 1);
  });

  it('tutmuş ve düşük riskli kayıtlar → güvenli', () => {
    const items = [
      { id: 'a', text: 'x', situation: 'is_gucu', createdAt: 1, status: 'tuttu', riskScore: 20 },
      { id: 'b', text: 'y', situation: 'is_gucu', createdAt: 2, status: 'tuttu', riskScore: 22 },
    ];
    const d = dangerScore(items);
    expect(d.level).toBe('dusuk');
    expect(d.percent).toBeLessThan(34);
  });
});

describe('akıbet hatırlatması', () => {
  it('48 saatten eski beklemede kayıtları verir', () => {
    const list = stalePending([lie('a', 3), lie('b', 1), lie('c', 5, 'tuttu')], 48, NOW);
    expect(list.map((item) => item.id)).toEqual(['a']);
  });
});
