/**
 * Süreç içi (in-memory) sabit pencere hız sınırlayıcı.
 * Anahtar: cihaz kimliği + IP. Dakikada `maxPerMin` istek.
 * Süresi dolan kovalar hem erişimde hem de süpürmede silinir.
 */
export type LimitResult = { allowed: boolean; retryAfter: number };

export function createRateLimiter(maxPerMin: number, windowMs = 60_000) {
  const buckets = new Map<string, { count: number; reset: number }>();
  const limit = Number.isFinite(maxPerMin) && maxPerMin > 0 ? Math.trunc(maxPerMin) : 20;

  function sweep(now: number) {
    if (buckets.size < 256) return;
    for (const [key, bucket] of buckets) {
      if (now >= bucket.reset) buckets.delete(key);
    }
  }

  return function check(key: string, now = Date.now()): LimitResult {
    const bucket = buckets.get(key);
    if (!bucket || now >= bucket.reset) {
      if (bucket) buckets.delete(key);
      sweep(now);
      buckets.set(key, { count: 1, reset: now + windowMs });
      return { allowed: true, retryAfter: 0 };
    }
    bucket.count += 1;
    if (bucket.count > limit) {
      return { allowed: false, retryAfter: Math.max(1, Math.ceil((bucket.reset - now) / 1000)) };
    }
    return { allowed: true, retryAfter: 0 };
  };
}
