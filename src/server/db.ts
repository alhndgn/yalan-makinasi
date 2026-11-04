import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { ChannelId, SituationId, Status, Strategy, StyleId, TargetId } from '../shared/constants.ts';

export type SavedLie = {
  id: string;
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
  target: string;
  situation: string;
  text: string;
  status: string;
  risk_score: number;
  created_at: number;
  queries: string;
  detail_tags: string;
};

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS lies (
  id                TEXT PRIMARY KEY,
  device_id         TEXT NOT NULL,
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

CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL);
INSERT INTO schema_version (version) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM schema_version);
`;

export function openDb(path: string): DatabaseSync {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec(SCHEMA_SQL);
  return db;
}

function toSavedLie(row: Row): SavedLie {
  return {
    id: row.id,
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
    `INSERT INTO lies (id, device_id, target, situation, situation_custom, channel, style, intensity,
       text, strategy, risk_score, risk_reasons, queries, detail_tags, provider, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    lie.id,
    lie.deviceId,
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
    Date.now(),
  );
}

export function listLies(db: DatabaseSync, deviceId: string, limit = 50): SavedLie[] {
  const rows = db
    .prepare(
      `SELECT id, target, situation, text, status, risk_score, created_at, queries, detail_tags
       FROM lies WHERE device_id = ? ORDER BY created_at DESC LIMIT ?`,
    )
    .all(deviceId, limit) as unknown as Row[];
  return rows.map(toSavedLie);
}

export function getLie(db: DatabaseSync, id: string, deviceId: string): SavedLie | null {
  const row = db
    .prepare(
      `SELECT id, target, situation, text, status, risk_score, created_at, queries, detail_tags
       FROM lies WHERE id = ? AND device_id = ?`,
    )
    .get(id, deviceId) as unknown as Row | undefined;
  return row ? toSavedLie(row) : null;
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
