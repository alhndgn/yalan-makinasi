import type { GenerateRequest, SavedLie, Variant } from '../../../shared/schema.ts';
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

function recentFor(target: TargetId): RecentLie[] {
  const since = Date.now() - THIRTY_DAYS;
  return read()
    .filter((lie) => lie.target === target && lie.createdAt >= since)
    .map((lie) => ({ situation: lie.situation as SituationId, detailTags: lie.detailTags ?? [] }));
}

function toSaved(lie: StoredLie): SavedLie {
  return {
    id: lie.id,
    target: lie.target,
    situation: lie.situation,
    text: lie.text,
    status: lie.status,
    riskScore: lie.riskScore,
    createdAt: lie.createdAt,
    queries: lie.queries,
  };
}

export const localData = {
  async generate(body: GenerateRequest & { salt?: string }): Promise<{ variants: Variant[]; provider: string }> {
    const ai = readAiConfig();
    if (aiReady(ai)) {
      try {
        return { variants: await generateWithAi(body, ai), provider: 'ai' };
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

  async saveLie(payload: { variant: Variant; form: GenerateRequest; provider?: string }): Promise<{ id: string }> {
    const prepared = prepareLie(payload.form, payload.variant.text, recentFor(payload.form.target), payload.variant.text.length);
    const stored: StoredLie = {
      id: crypto.randomUUID(),
      target: payload.form.target,
      situation: payload.form.situation,
      text: payload.variant.text,
      status: 'beklemede',
      riskScore: prepared.riskScore,
      createdAt: Date.now(),
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

  async conflicts(): Promise<{ conflicts: { lieId: string; target: TargetId; text: string; createdAt: number; overlap: string }[] }> {
    const since = Date.now() - THIRTY_DAYS;
    const rows = read().filter((lie) => lie.createdAt >= since);
    const pairs: { lieId: string; target: TargetId; text: string; createdAt: number; overlap: string }[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        const a = rows[i]!;
        const b = rows[j]!;
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
          target: a.target,
          text: a.text,
          createdAt: a.createdAt,
          overlap: sameSituation ? 'aynı durum' : `ortak detay: ${shared.join(', ')}`,
        });
      }
    }
    return { conflicts: pairs.slice(0, 20) };
  },
};
