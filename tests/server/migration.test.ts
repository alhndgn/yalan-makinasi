import { describe, it, expect } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDb, listLies, listPeople } from '../../src/server/db.ts';

describe('şema göçü (eski defter → kişi destekli)', () => {
  it('person/source kolonu olmayan eski veritabanını bozmadan yükseltir', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ym-mig-'));
    const path = join(dir, 'eski.db');

    // 1) eski şema: person ve source yok
    const old = new DatabaseSync(path);
    old.exec(`CREATE TABLE lies (
      id TEXT PRIMARY KEY, device_id TEXT NOT NULL, target TEXT NOT NULL, situation TEXT NOT NULL,
      situation_custom TEXT, channel TEXT NOT NULL, style TEXT NOT NULL, intensity INTEGER NOT NULL,
      text TEXT NOT NULL, strategy TEXT NOT NULL, risk_score INTEGER NOT NULL, risk_reasons TEXT NOT NULL,
      queries TEXT NOT NULL, detail_tags TEXT NOT NULL DEFAULT '[]', provider TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'beklemede', shared INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL)`);
    old.prepare(
      `INSERT INTO lies (id, device_id, target, situation, channel, style, intensity, text, strategy,
        risk_score, risk_reasons, queries, detail_tags, provider, status, created_at)
       VALUES ('e1','dev1','patron','gec_kaldim','whatsapp','ciddi',5,'trafik vardı','sade',30,'[]','[]','[]','ai','beklemede',? )`,
    ).run(Date.now());
    old.close();

    // 2) yeni kod açıyor
    const db = openDb(path);
    const columns = (db.prepare('PRAGMA table_info(lies)').all() as unknown as { name: string }[]).map((c) => c.name);
    expect(columns).toContain('person');
    expect(columns).toContain('source');

    const items = listLies(db, 'dev1');
    expect(items).toHaveLength(1);
    expect(items[0]!.text).toBe('trafik vardı');
    expect(items[0]!.person).toBe('');
    expect(items[0]!.source).toBe('ai');

    expect(listPeople(db, 'dev1')).toHaveLength(1);
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });
});
