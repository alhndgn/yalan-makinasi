/**
 * Basit, süreç içi (in-memory) sabit pencere hız sınırlayıcı.
 * Anahtar: cihaz kimliği + IP. Dakikada `maxPerMin` istek.
 */
export type LimitResult = { allowed: boolean; retryAfter: number };

export function createRateLimiter(maxPerMin: number, windowMs = 60_000) {
  const buckets = new Map<string, { count: number; reset: number }>();

  return function check(key: string, now = Date.now()): LimitResult {
    const bucket = buckets.get(key);
    if (!bucket || now >= bucket.reset) {
      buckets.set(key, { count: 1, reset: now + windowMs });
      return { allowed: true, retryAfter: 0 };
    }
    bucket.count += 1;
    if (bucket.count > maxPerMin) {
      return { allowed: false, retryAfter: Math.ceil((bucket.reset - now) / 1000) };
    }
    return { allowed: true, retryAfter: 0 };
  };
}
