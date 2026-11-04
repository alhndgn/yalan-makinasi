import type { GenerateRequest, SavedLie, Variant } from '../../../shared/schema.ts';
import type { TargetId } from '../../../shared/constants.ts';
import { getDeviceId } from './deviceId.ts';

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

  saveLie(payload: { variant: Variant; form: GenerateRequest; provider?: string }): Promise<{ id: string }> {
    return call<{ id: string }>('/api/lies', { method: 'POST', body: JSON.stringify(payload) });
  },

  listLies(): Promise<{ items: SavedLie[] }> {
    return call<{ items: SavedLie[] }>('/api/lies?limit=50');
  },

  updateStatus(id: string, status: 'tuttu' | 'tutmadı'): Promise<{ ok: true }> {
    return call<{ ok: true }>(`/api/lies/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
  },

  deleteLie(id: string): Promise<{ ok: true }> {
    return call<{ ok: true }>(`/api/lies/${id}`, { method: 'DELETE' });
  },

  deleteAll(): Promise<{ deleted: number }> {
    return call<{ deleted: number }>('/api/lies', { method: 'DELETE' });
  },
};
