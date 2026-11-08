/**
 * AI isteğini taşır.
 * - APK/WebView (native): CapacitorHttp → CORS devre dışı, doğrudan sağlayıcıya.
 * - Web: kendi sunucumuzdaki /api/ai/chat proxy'si (anahtar sunucuda kalır).
 */
export type JsonResponse = { ok: boolean; status: number; body: unknown };

export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

export function endpointFor(baseUrl: string, native: boolean): string {
  return native ? `${baseUrl.replace(/\/$/, '')}/chat/completions` : '/api/ai/chat';
}

export async function postJson(
  url: string,
  payload: unknown,
  headers: Record<string, string>,
  timeoutMs: number,
  native: boolean,
): Promise<JsonResponse> {
  if (native) {
    const { CapacitorHttp } = await import('@capacitor/core');
    const res = await CapacitorHttp.request({
      url,
      method: 'POST',
      headers,
      data: payload,
      connectTimeout: timeoutMs,
      readTimeout: timeoutMs,
    });
    return { ok: res.status >= 200 && res.status < 300, status: res.status, body: res.data };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, body };
  } finally {
    clearTimeout(timer);
  }
}
