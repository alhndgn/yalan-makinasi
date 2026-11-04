import { describe, it, expect } from 'vitest';
import { openDb, insertLie, listLies, updateLieStatus, deleteLie, findConflicts } from '../../src/server/db.ts';

const row = {
  id: 'l1',
  deviceId: 'd1',
  target: 'sevgili' as const,
  situation: 'gidemedim' as const,
  situationCustom: null,
  channel: 'whatsapp' as const,
  style: 'ciddi' as const,
  intensity: 5,
  text: 'Annem rahatsızdı.',
  strategy: 'detayli' as const,
  riskScore: 42,
  riskReasons: ['konum kontrol edilebilir'],
  queries: [{ q: 'Neredeydin?', a: 'Annemdeydim.' }],
  detailTags: ['aile'],
  provider: 'template',
  status: 'beklemede' as const,
};

describe('db', () => {
  it('kayıt ekler ve listeler', () => {
    const db = openDb(':memory:');
    insertLie(db, row);
    const items = listLies(db, 'd1', 50);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: 'l1', text: 'Annem rahatsızdı.', status: 'beklemede' });
    expect(items[0]!.queries[0]!.q).toBe('Neredeydin?');
  });

  it('başka cihaz kaydı görmez', () => {
    const db = openDb(':memory:');
    insertLie(db, row);
    expect(listLies(db, 'd2', 50)).toHaveLength(0);
  });

  it('durum güncellenir, kayıt silinir', () => {
    const db = openDb(':memory:');
    insertLie(db, row);
    expect(updateLieStatus(db, 'l1', 'd1', 'tuttu')).toBe(true);
    expect(listLies(db, 'd1', 50)[0]!.status).toBe('tuttu');
    expect(updateLieStatus(db, 'l1', 'd2', 'tuttu')).toBe(false);
    expect(deleteLie(db, 'l1', 'd1')).toBe(true);
    expect(listLies(db, 'd1', 50)).toHaveLength(0);
  });

  it('aynı hedefte aynı durumu çelişki sayar', () => {
    const db = openDb(':memory:');
    insertLie(db, row);
    expect(findConflicts(db, 'd1', 'sevgili', 'gidemedim', ['aile'])).toHaveLength(1);
    expect(findConflicts(db, 'd1', 'patron', 'gidemedim', [])).toHaveLength(0);
  });

  it('farklı durumda ortak detay etiketi de çelişki sayar', () => {
    const db = openDb(':memory:');
    insertLie(db, row);
    expect(findConflicts(db, 'd1', 'sevgili', 'gec_kaldim', ['aile'])).toHaveLength(1);
    expect(findConflicts(db, 'd1', 'sevgili', 'gec_kaldim', ['is'])).toHaveLength(0);
  });
});
