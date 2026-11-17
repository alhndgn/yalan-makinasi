import type {
  GenerateRequest,
  ManualLieInput,
  PersonProfile,
  PersonSummary,
  SavedLie,
  Variant,
} from '../../../shared/schema.ts';
import type { SituationId, Status, TargetId } from '../../../shared/constants.ts';
import { detailCountFor } from '../../../engine/compose.ts';
import { prepareLie } from '../../../engine/prepareLie.ts';
import { templateProvider } from '../../../engine/providers/template.ts';
import { scoreRisk } from '../../../engine/risk.ts';
import { countConflicts, type RecentLie } from '../../../engine/types.ts';
import { aiReady, readAiConfig } from './aiConfig.ts';
import { generateWithAi } from './aiProvider.ts';
import { getDeviceId } from './deviceId.ts';

/**
 * Cihaz içi (APK / çevrimdışı) veri katmanı. Sunucu yok: kayıtlar localStorage'da,
 * üretim tarayıcıda çalışan şablon motorunda. API istemcisiyle aynı arayüzü sunar.
 */
const LIES_KEY = 'ym_lies_v1';
const PEOPLE_KEY = 'ym_people_v1';
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

type StoredLie = SavedLie & {
  strategy: string;
  provider: string;
  riskReasons: string[];
  detailTags: string[];
};

function read(): StoredLie[] {
  try {
    const raw = localStorage.getItem(LIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StoredLie[]) : [];
  } catch {
    return [];
  }
}

function write(items: StoredLie[]): void {
  try {
    localStorage.setItem(LIES_KEY, JSON.stringify(items.slice(0, 500)));
  } catch {
    /* kota dolu: sessizce yoksay */
  }
}

/** Aynı kişiye söylenenler (AI bağlamı için). */
function historyFor(person: string): { text: string; situation: string; createdAt: number }[] {
  if (!person) return [];
  return read()
    .filter((lie) => (lie.person ?? '') === person)
    .slice(0, 5)
    .map((lie) => ({ text: lie.text, situation: lie.situation, createdAt: lie.createdAt }));
}

function readProfiles(): Record<string, PersonProfile> {
  try {
    const raw = localStorage.getItem(PEOPLE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : {};
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, PersonProfile>) : {};
  } catch {
    return {};
  }
}

function writeProfile(profile: PersonProfile): void {
  try {
    const all = readProfiles();
    all[profile.name] = profile;
    localStorage.setItem(PEOPLE_KEY, JSON.stringify(all));
  } catch {
    /* yoksay */
  }
}

function recentFor(target: TargetId): RecentLie[] {
  const since = Date.now() - THIRTY_DAYS;
  return read()
    .filter((lie) => lie.target === target && lie.createdAt >= since)
    .map((lie) => ({ situation: lie.situation as SituationId, detailTags: lie.detailTags ?? [] }));
}

function toSaved(lie: StoredLie): SavedLie {
  return {
    id: lie.id,
    person: lie.person ?? '',
    source: lie.source ?? 'ai',
    channel: lie.channel,
    target: lie.target,
    situation: lie.situation,
    text: lie.text,
    status: lie.status,
    riskScore: lie.riskScore,
    createdAt: lie.createdAt,
    queries: lie.queries,
  };
}

type ConflictItem = { lieId: string; person: string; target: TargetId; text: string; createdAt: number; overlap: string };

/** Aynı kişiye söylenen ve çakışan kayıt çiftleri. */
function computeConflicts(since = Date.now() - THIRTY_DAYS): ConflictItem[] {
  const rows = read().filter((lie) => lie.createdAt >= since);
  const pairs: ConflictItem[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const a = rows[i]!;
      const b = rows[j]!;
      if ((a.person ?? '') !== (b.person ?? '')) continue;
      if (a.target !== b.target) continue;

      const tagsA = a.detailTags ?? [];
      const shared = tagsA.filter((tag) => (b.detailTags ?? []).includes(tag));
      const sameSituation = a.situation === b.situation;
      if (!sameSituation && shared.length === 0) continue;

      const key = [a.id, b.id].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);

      pairs.push({
        lieId: a.id,
        person: a.person ?? '',
        target: a.target,
        text: a.text,
        createdAt: a.createdAt,
        overlap: sameSituation ? 'aynı durum' : `ortak detay: ${shared.join(', ')}`,
      });
    }
  }

  return pairs.slice(0, 20);
}

export const localData = {
  async generate(body: GenerateRequest & { salt?: string }): Promise<{ variants: Variant[]; provider: string }> {
    const ai = readAiConfig();
    if (aiReady(ai)) {
      try {
        const profile = readProfiles()[(body.person ?? '').trim()] ?? null;
        return {
          variants: await generateWithAi(body, ai, { history: historyFor(body.person ?? ''), profile }),
          provider: 'ai',
        };
      } catch {
        // AI'ya ulaşamadık: sessizce şablon motoruna düş, kullanıcı hata görmesin.
      }
    }

    const result = await templateProvider.generate(body, {
      deviceId: getDeviceId(),
      salt: body.salt ?? String(Date.now()),
      recent: recentFor(body.target),
    });
    return { variants: result.variants, provider: result.provider };
  },

  async previewRisk(query: { target: TargetId; situation: string; channel: string; intensity: number }) {
    const risk = scoreRisk({
      intensity: query.intensity,
      target: query.target,
      channel: query.channel as never,
      detailCount: detailCountFor(query.intensity),
      hasSecondPerson: false,
      hasLocation: false,
      mentionsDocument: false,
      conflictCount: countConflicts(recentFor(query.target), query.situation as SituationId, []),
    });
    return { score: risk.score, level: risk.level, reasons: risk.reasons };
  },

  async saveLie(payload: {
    variant: Variant;
    form: GenerateRequest;
    provider?: string;
    source?: 'ai' | 'manual';
    happenedAt?: number;
  }): Promise<{ id: string }> {
    const prepared = prepareLie(payload.form, payload.variant.text, recentFor(payload.form.target), payload.variant.text.length);
    const stored: StoredLie = {
      id: crypto.randomUUID(),
      person: payload.form.person ?? '',
      source: payload.source ?? 'ai',
      channel: payload.form.channel,
      target: payload.form.target,
      situation: payload.form.situation,
      text: payload.variant.text,
      status: 'beklemede',
      riskScore: prepared.riskScore,
      createdAt: payload.happenedAt ?? Date.now(),
      queries: prepared.queries,
      strategy: payload.variant.strategy,
      provider: payload.provider ?? 'template',
      riskReasons: prepared.riskReasons,
      detailTags: prepared.detailTags,
    };
    write([stored, ...read()]);
    return { id: stored.id };
  },

  async listLies(): Promise<{ items: SavedLie[] }> {
    return { items: read().map(toSaved) };
  },

  /** Kendi yazdığın yalanı kaydeder (AI'ya gitmez). */
  async saveManual(payload: ManualLieInput): Promise<{ id: string }> {
    const person = payload.person.trim().replace(/\s+/g, ' ');
    const situation = payload.situation ?? 'ozel';
    const target = payload.target ?? 'ozel';
    const prepared = prepareLie(
      {
        target,
        situation,
        channel: payload.channel ?? 'yuz_yuze',
        intensity: 5,
      },
      payload.text,
      recentFor(target),
      payload.text.length,
    );
    const stored: StoredLie = {
      id: crypto.randomUUID(),
      person,
      source: 'manual',
      channel: payload.channel ?? 'yuz_yuze',
      target,
      situation,
      text: payload.text,
      status: 'beklemede',
      riskScore: prepared.riskScore,
      createdAt: payload.happenedAt ?? Date.now(),
      queries: prepared.queries,
      strategy: 'sade',
      provider: 'manual',
      riskReasons: prepared.riskReasons,
      detailTags: prepared.detailTags,
    };
    write([stored, ...read()]);
    return { id: stored.id };
  },

  /** Defterin kişi özeti. */
  async people(): Promise<{ people: PersonSummary[] }> {
    const since = Date.now() - THIRTY_DAYS;
    const items = read();
    const map = new Map<string, PersonSummary>();

    for (const lie of items) {
      const person = lie.person ?? '';
      const current = map.get(person) ?? {
        person,
        count: 0,
        lastAt: 0,
        pending: 0,
        conflicts: 0,
        targets: [],
      };
      const profile = readProfiles()[person];
      if (profile) {
        current.relation = profile.relation;
        current.gender = profile.gender;
        current.closeness = profile.closeness;
        current.notes = profile.notes;
      }
      current.count += 1;
      current.lastAt = Math.max(current.lastAt, lie.createdAt);
      if (lie.status === 'beklemede') current.pending += 1;
      if (!current.targets.includes(lie.target)) current.targets.push(lie.target);
      map.set(person, current);
    }

    for (const pair of computeConflicts(since)) {
      const entry = map.get(pair.person);
      if (entry) entry.conflicts += 1;
    }

    return { people: [...map.values()].sort((a, b) => b.lastAt - a.lastAt) };
  },

  async byPerson(person: string): Promise<{ items: SavedLie[] }> {
    return {
      items: read()
        .filter((lie) => (lie.person ?? '') === person)
        .map(toSaved),
    };
  },

  async history(person: string): Promise<{ text: string; situation: string; createdAt: number }[]> {
    return historyFor(person);
  },

  async getPersonProfile(name: string): Promise<PersonProfile | null> {
    return readProfiles()[name] ?? null;
  },

  async savePersonProfile(profile: PersonProfile): Promise<{ ok: true }> {
    writeProfile(profile);
    return { ok: true };
  },

  async updateStatus(id: string, status: Status): Promise<{ ok: true }> {
    write(read().map((lie) => (lie.id === id ? { ...lie, status } : lie)));
    return { ok: true };
  },

  async deleteLie(id: string): Promise<{ ok: true }> {
    write(read().filter((lie) => lie.id !== id));
    return { ok: true };
  },

  async deleteAll(): Promise<{ deleted: number }> {
    const count = read().length;
    write([]);
    return { deleted: count };
  },

  async conflicts(): Promise<{ conflicts: ConflictItem[] }> {
    return { conflicts: computeConflicts() };
  },
};
