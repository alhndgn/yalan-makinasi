import type {
  GenerateRequest,
  ManualLieInput,
  PersonProfile,
  PersonSummary,
  SavedLie,
  Variant,
} from '../../../shared/schema.ts';
import type { Status, TargetId } from '../../../shared/constants.ts';
import { getDeviceId } from './deviceId.ts';
import { aiReady, readAiConfig } from './aiConfig.ts';
import { generateWithAi } from './aiProvider.ts';

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-device-id': getDeviceId(),
      ...(init.headers ?? {}),
    },
  });
  const data = (await res.json().catch(() => null)) as { error?: { code?: string } } | null;
  if (!res.ok) throw new ApiError(data?.error?.code ?? 'UNKNOWN', res.status);
  return data as T;
}

export type RiskPreview = { score: number; level: 'dusuk' | 'orta' | 'yuksek'; reasons: string[] };

export const api = {
  async generate(body: GenerateRequest & { salt?: string }): Promise<{ variants: Variant[]; provider: string }> {
    // AI beyin her iki modda da aynı: önce AI, olmazsa sunucu/şablon.
    const ai = readAiConfig();
    if (aiReady(ai)) {
      try {
        const history = body.person ? await api.history(body.person).catch(() => []) : [];
        const profile = body.person ? await api.getPersonProfile(body.person).catch(() => null) : null;
        return { variants: await generateWithAi(body, ai, { history, profile }), provider: 'ai' };
      } catch {
        /* sessizce şablona düş */
      }
    }

    const { salt, ...payload } = body;
    const query = salt ? `?salt=${encodeURIComponent(salt)}` : '';
    return call<{ variants: Variant[]; provider: string }>(`/api/generate${query}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  previewRisk(query: { target: TargetId; situation: string; channel: string; intensity: number }): Promise<RiskPreview> {
    const qs = new URLSearchParams({
      target: query.target,
      situation: query.situation,
      channel: query.channel,
      intensity: String(query.intensity),
    });
    return call<RiskPreview>(`/api/lies/conflicts/preview?${qs}`);
  },

  saveLie(payload: {
    variant: Variant;
    form: GenerateRequest;
    provider?: string;
    source?: 'ai' | 'manual';
    happenedAt?: number;
  }): Promise<{ id: string }> {
    return call<{ id: string }>('/api/lies', { method: 'POST', body: JSON.stringify(payload) });
  },

  /** Kullanıcının kendi yazdığı yalan. */
  saveManual(payload: ManualLieInput): Promise<{ id: string }> {
    return call<{ id: string }>('/api/lies/manual', { method: 'POST', body: JSON.stringify(payload) });
  },

  people(): Promise<{ people: PersonSummary[] }> {
    return call<{ people: PersonSummary[] }>('/api/lies/people');
  },

  async getPersonProfile(name: string): Promise<PersonProfile | null> {
    try {
      return await call<PersonProfile>(`/api/people/${encodeURIComponent(name)}`);
    } catch {
      return null;
    }
  },

  savePersonProfile(profile: PersonProfile): Promise<{ ok: true }> {
    const { name, ...rest } = profile;
    return call<{ ok: true }>(`/api/people/${encodeURIComponent(name)}`, {
      method: 'PUT',
      body: JSON.stringify(rest),
    });
  },

  byPerson(person: string): Promise<{ items: SavedLie[] }> {
    return call<{ items: SavedLie[] }>(`/api/lies/person/${encodeURIComponent(person)}`);
  },

  /** Aynı kişiye son söylenenler — AI bağlamı. */
  async history(person: string): Promise<{ text: string; situation: string; createdAt: number }[]> {
    const { items } = await api.byPerson(person);
    return items.slice(0, 5).map((lie) => ({ text: lie.text, situation: lie.situation, createdAt: lie.createdAt }));
  },

  listLies(): Promise<{ items: SavedLie[] }> {
    return call<{ items: SavedLie[] }>('/api/lies?limit=50');
  },

  updateStatus(id: string, status: Status): Promise<{ ok: true }> {
    return call<{ ok: true }>(`/api/lies/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
  },

  deleteLie(id: string): Promise<{ ok: true }> {
    return call<{ ok: true }>(`/api/lies/${id}`, { method: 'DELETE' });
  },

  deleteAll(): Promise<{ deleted: number }> {
    return call<{ deleted: number }>('/api/lies', { method: 'DELETE' });
  },

  conflicts(): Promise<{ conflicts: { lieId: string; target: TargetId; text: string; createdAt: number; overlap: string }[] }> {
    return call<{ conflicts: { lieId: string; target: TargetId; text: string; createdAt: number; overlap: string }[] }>(
      '/api/lies/conflicts',
    );
  },
};
