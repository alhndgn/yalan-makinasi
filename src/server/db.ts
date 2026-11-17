import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { ChannelId, LieSource, SituationId, Status, Strategy, StyleId, TargetId } from '../shared/constants.ts';

export type SavedLie = {
  id: string;
  person: string;
  source: LieSource;
  channel: ChannelId | null;
  target: TargetId;
  situation: SituationId;
  text: string;
  status: Status;
  riskScore: number;
  createdAt: number;
  queries: { q: string; a: string }[];
  detailTags: string[];
};

export type NewLie = {
  id: string;
  deviceId: string;
  person?: string;
  source?: LieSource;
  happenedAt?: number;
  target: TargetId;
  situation: SituationId;
  situationCustom: string | null;
  channel: ChannelId;
  style: StyleId;
  intensity: number;
  text: string;
  strategy: Strategy;
  riskScore: number;
  riskReasons: string[];
  queries: { q: string; a: string }[];
  detailTags: string[];
  provider: string;
  status: Status;
};

type Row = {
  id: string;
  person: string | null;
  source: string | null;
  channel: string | null;
  target: string;
  situation: string;
  text: string;
  status: string;
  risk_score: number;
  created_at: number;
  queries: string;
  detail_tags: string;
};

const LIE_COLUMNS =
  'id, person, source, channel, target, situation, text, status, risk_score, created_at, queries, detail_tags';

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS lies (
  id                TEXT PRIMARY KEY,
  device_id         TEXT NOT NULL,
  person            TEXT NOT NULL DEFAULT '',
  source            TEXT NOT NULL DEFAULT 'ai',
  target            TEXT NOT NULL,
  situation         TEXT NOT NULL,
  situation_custom  TEXT,
  channel           TEXT NOT NULL,
  style             TEXT NOT NULL,
  intensity         INTEGER NOT NULL,
  text              TEXT NOT NULL,
  strategy          TEXT NOT NULL,
  risk_score        INTEGER NOT NULL,
  risk_reasons      TEXT NOT NULL,
  queries           TEXT NOT NULL,
  detail_tags       TEXT NOT NULL DEFAULT '[]',
  provider          TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'beklemede',
  shared            INTEGER NOT NULL DEFAULT 0,
  created_at        INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lies_device ON lies(device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lies_target ON lies(device_id, target, created_at DESC);

CREATE TABLE IF NOT EXISTS people (
  device_id   TEXT NOT NULL,
  name        TEXT NOT NULL,
  relation    TEXT NOT NULL DEFAULT 'arkadas',
  gender      TEXT NOT NULL DEFAULT 'belirsiz',
  closeness   INTEGER NOT NULL DEFAULT 5,
  notes       TEXT NOT NULL DEFAULT '',
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  PRIMARY KEY (device_id, name)
);

CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL);
INSERT INTO schema_version (version) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM schema_version);
`;

export function openDb(path: string): DatabaseSync {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec(SCHEMA_SQL);
  migrate(db);
  return db;
}

/** Eski veritabanlarına kişi/kaynak kolonlarını ekler (veri kaybı yok). */
function migrate(db: DatabaseSync): void {
  const columns = db.prepare('PRAGMA table_info(lies)').all() as unknown as { name: string }[];
  const names = new Set(columns.map((c) => c.name));
  if (!names.has('person')) db.exec("ALTER TABLE lies ADD COLUMN person TEXT NOT NULL DEFAULT ''");
  if (!names.has('source')) db.exec("ALTER TABLE lies ADD COLUMN source TEXT NOT NULL DEFAULT 'ai'");
  db.exec('CREATE INDEX IF NOT EXISTS idx_lies_person ON lies(device_id, person, created_at DESC)');
}

function toSavedLie(row: Row): SavedLie {
  return {
    id: row.id,
    person: row.person ?? '',
    source: (row.source as LieSource | null) ?? 'ai',
    channel: (row.channel as ChannelId | null) ?? null,
    target: row.target as TargetId,
    situation: row.situation as SituationId,
    text: row.text,
    status: row.status as Status,
    riskScore: row.risk_score,
    createdAt: row.created_at,
    queries: JSON.parse(row.queries) as { q: string; a: string }[],
    detailTags: JSON.parse(row.detail_tags) as string[],
  };
}

export function insertLie(db: DatabaseSync, lie: NewLie): void {
  db.prepare(
    `INSERT INTO lies (id, device_id, person, source, target, situation, situation_custom, channel, style,
       intensity, text, strategy, risk_score, risk_reasons, queries, detail_tags, provider, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    lie.id,
    lie.deviceId,
    lie.person ?? '',
    lie.source ?? 'ai',
    lie.target,
    lie.situation,
    lie.situationCustom,
    lie.channel,
    lie.style,
    lie.intensity,
    lie.text,
    lie.strategy,
    lie.riskScore,
    JSON.stringify(lie.riskReasons),
    JSON.stringify(lie.queries),
    JSON.stringify(lie.detailTags),
    lie.provider,
    lie.status,
    lie.happenedAt ?? Date.now(),
  );
}

export function listLies(db: DatabaseSync, deviceId: string, limit = 50): SavedLie[] {
  const rows = db
    .prepare(
      `SELECT ${LIE_COLUMNS} FROM lies WHERE device_id = ? ORDER BY created_at DESC LIMIT ?`,
    )
    .all(deviceId, limit) as unknown as Row[];
  return rows.map(toSavedLie);
}

export function getLie(db: DatabaseSync, id: string, deviceId: string): SavedLie | null {
  const row = db
    .prepare(`SELECT ${LIE_COLUMNS} FROM lies WHERE id = ? AND device_id = ?`)
    .get(id, deviceId) as unknown as Row | undefined;
  return row ? toSavedLie(row) : null;
}

export type PersonSummary = {
  person: string;
  count: number;
  lastAt: number;
  pending: number;
  conflicts: number;
  targets: string[];
};

/** Defterin ana görünümü: kişiye göre özet. */
export function listPeople(db: DatabaseSync, deviceId: string): PersonSummary[] {
  const rows = db
    .prepare(
      `SELECT person, COUNT(*) AS count, MAX(created_at) AS last_at,
              SUM(CASE WHEN status = 'beklemede' THEN 1 ELSE 0 END) AS pending,
              GROUP_CONCAT(DISTINCT target) AS targets
       FROM lies WHERE device_id = ? GROUP BY person ORDER BY last_at DESC`,
    )
    .all(deviceId) as unknown as {
    person: string | null;
    count: number;
    last_at: number;
    pending: number | null;
    targets: string | null;
  }[];

  const conflicts = new Map<string, number>();
  for (const pair of findConflictPairs(db, deviceId)) {
    const key = pair.person;
    conflicts.set(key, (conflicts.get(key) ?? 0) + 1);
  }

  const profiles = new Map(listPersonProfiles(db, deviceId).map((p) => [p.name, p]));

  return rows.map((row) => {
    const person = row.person ?? '';
    const profile = profiles.get(person);
    return {
      person,
      count: Number(row.count),
      lastAt: Number(row.last_at),
      pending: Number(row.pending ?? 0),
      conflicts: conflicts.get(person) ?? 0,
      targets: (row.targets ?? '').split(',').filter(Boolean),
      relation: (profile?.relation ?? undefined) as SavedLie['target'] | undefined,
      gender: (profile?.gender ?? undefined) as 'kadin' | 'erkek' | 'belirsiz' | undefined,
      closeness: profile?.closeness,
      notes: profile?.notes,
    };
  });
}

export function listByPerson(db: DatabaseSync, deviceId: string, person: string, limit = 100): SavedLie[] {
  const rows = db
    .prepare(
      `SELECT ${LIE_COLUMNS} FROM lies WHERE device_id = ? AND person = ? ORDER BY created_at DESC LIMIT ?`,
    )
    .all(deviceId, person, limit) as unknown as Row[];
  return rows.map(toSavedLie);
}

/** AI'ya bağlam olarak verilecek geçmiş (aynı kişiye son N kayıt). */
export function listHistoryForPerson(
  db: DatabaseSync,
  deviceId: string,
  person: string,
  limit = 5,
): { text: string; situation: string; createdAt: number }[] {
  const rows = db
    .prepare(
      `SELECT text, situation, created_at FROM lies
       WHERE device_id = ? AND person = ? ORDER BY created_at DESC LIMIT ?`,
    )
    .all(deviceId, person, limit) as unknown as { text: string; situation: string; created_at: number }[];
  return rows.map((row) => ({ text: row.text, situation: row.situation, createdAt: row.created_at }));
}

export type StoredPersonProfile = {
  name: string;
  relation: string;
  gender: string;
  closeness: number;
  notes: string;
};

/** AI bağlamına verilen profil: şema tipine uygun hâli. */
export function toPromptProfile(profile: StoredPersonProfile | null): {
  name: string;
  relation: 'anne' | 'arkadas' | 'hoca' | 'musteri' | 'ozel' | 'patron' | 'sevgili';
  gender: 'belirsiz' | 'erkek' | 'kadin';
  closeness: number;
  notes: string;
} | null {
  if (!profile) return null;
  return {
    name: profile.name,
    relation: profile.relation as 'anne' | 'arkadas' | 'hoca' | 'musteri' | 'ozel' | 'patron' | 'sevgili',
    gender: profile.gender as 'belirsiz' | 'erkek' | 'kadin',
    closeness: profile.closeness,
    notes: profile.notes,
  };
}

export function getPersonProfile(db: DatabaseSync, deviceId: string, name: string): StoredPersonProfile | null {
  const row = db
    .prepare('SELECT name, relation, gender, closeness, notes FROM people WHERE device_id = ? AND name = ?')
    .get(deviceId, name) as unknown as StoredPersonProfile | undefined;
  return row ?? null;
}

export function listPersonProfiles(db: DatabaseSync, deviceId: string): StoredPersonProfile[] {
  return db
    .prepare('SELECT name, relation, gender, closeness, notes FROM people WHERE device_id = ?')
    .all(deviceId) as unknown as StoredPersonProfile[];
}

export function upsertPersonProfile(db: DatabaseSync, deviceId: string, profile: StoredPersonProfile): void {
  const now = Date.now();
  db.prepare(
    `INSERT INTO people (device_id, name, relation, gender, closeness, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(device_id, name) DO UPDATE SET
       relation = excluded.relation,
       gender = excluded.gender,
       closeness = excluded.closeness,
       notes = excluded.notes,
       updated_at = excluded.updated_at`,
  ).run(deviceId, profile.name, profile.relation, profile.gender, profile.closeness, profile.notes, now, now);
}

export function deletePersonProfile(db: DatabaseSync, deviceId: string, name: string): void {
  db.prepare('DELETE FROM people WHERE device_id = ? AND name = ?').run(deviceId, name);
}

export function updateLieStatus(db: DatabaseSync, id: string, deviceId: string, status: Status): boolean {
  const res = db.prepare('UPDATE lies SET status = ? WHERE id = ? AND device_id = ?').run(status, id, deviceId);
  return Number(res.changes) > 0;
}

export function deleteLie(db: DatabaseSync, id: string, deviceId: string): boolean {
  const res = db.prepare('DELETE FROM lies WHERE id = ? AND device_id = ?').run(id, deviceId);
  return Number(res.changes) > 0;
}

export function deleteAllLies(db: DatabaseSync, deviceId: string): number {
  const res = db.prepare('DELETE FROM lies WHERE device_id = ?').run(deviceId);
  return Number(res.changes);
}

export type ConflictPair = {
  lieId: string;
  person: string;
  target: TargetId;
  text: string;
  createdAt: number;
  overlap: string;
};

/** Son 30 günde aynı kişiye söylenen ve birbiriyle çakışan kayıtlar. */
export function findConflictPairs(db: DatabaseSync, deviceId: string): ConflictPair[] {
  const rows = db
    .prepare(
      `SELECT id, person, target, text, created_at, situation, detail_tags FROM lies
       WHERE device_id = ? AND created_at >= ? ORDER BY created_at DESC LIMIT 200`,
    )
    .all(deviceId, Date.now() - THIRTY_DAYS) as unknown as {
    id: string;
    person: string | null;
    target: string;
    text: string;
    created_at: number;
    situation: string;
    detail_tags: string;
  }[];

  const pairs: ConflictPair[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const a = rows[i]!;
      const b = rows[j]!;
      if (a.target !== b.target) continue;

      const tagsA = JSON.parse(a.detail_tags) as string[];
      const shared = tagsA.filter((tag) => (JSON.parse(b.detail_tags) as string[]).includes(tag));
      const sameSituation = a.situation === b.situation;
      if (!sameSituation && shared.length === 0) continue;

      const key = [a.id, b.id].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);

      pairs.push({
        lieId: a.id,
        person: a.person ?? '',
        target: a.target as TargetId,
        text: a.text,
        createdAt: a.created_at,
        overlap: sameSituation ? 'aynı durum' : `ortak detay: ${shared.join(', ')}`,
      });
    }
  }

  return pairs.slice(0, 20);
}

export function listRecentForTarget(
  db: DatabaseSync,
  deviceId: string,
  target: TargetId,
): { situation: SituationId; detailTags: string[] }[] {
  const rows = db
    .prepare(
      `SELECT situation, detail_tags FROM lies
       WHERE device_id = ? AND target = ? AND created_at >= ? ORDER BY created_at DESC LIMIT 50`,
    )
    .all(deviceId, target, Date.now() - THIRTY_DAYS) as unknown as { situation: string; detail_tags: string }[];
  return rows.map((row) => ({
    situation: row.situation as SituationId,
    detailTags: JSON.parse(row.detail_tags) as string[],
  }));
}

export function listRecentByTarget(
  db: DatabaseSync,
  deviceId: string,
  target: TargetId,
): { lieId: string; createdAt: number; text: string }[] {
  const rows = db
    .prepare(
      `SELECT id, text, created_at FROM lies
       WHERE device_id = ? AND target = ? AND created_at >= ? ORDER BY created_at DESC LIMIT 20`,
    )
    .all(deviceId, target, Date.now() - THIRTY_DAYS) as unknown as { id: string; text: string; created_at: number }[];
  return rows.map((row) => ({ lieId: row.id, createdAt: row.created_at, text: row.text }));
}

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

export function findConflicts(
  db: DatabaseSync,
  deviceId: string,
  target: TargetId,
  situation: SituationId,
  detailTags: string[],
): { lieId: string; createdAt: number; text: string }[] {
  const since = Date.now() - THIRTY_DAYS;
  const rows = db
    .prepare(
      `SELECT id, text, created_at, situation, detail_tags FROM lies
       WHERE device_id = ? AND target = ? AND created_at >= ? ORDER BY created_at DESC`,
    )
    .all(deviceId, target, since) as unknown as {
    id: string;
    text: string;
    created_at: number;
    situation: string;
    detail_tags: string;
  }[];

  return rows
    .filter((row) => {
      if (row.situation === situation) return true;
      const tags = JSON.parse(row.detail_tags) as string[];
      return tags.some((t) => detailTags.includes(t));
    })
    .map((row) => ({ lieId: row.id, createdAt: row.created_at, text: row.text }));
}
