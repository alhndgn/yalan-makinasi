/**
 * Defter kilidi — 4 haneli PIN.
 *
 * PIN hiçbir yerde düz metin tutulmaz: cihazda rastgele salt ile PBKDF2-SHA256 türetilir,
 * yalnızca türetilmiş özet saklanır. WebCrypto yoksa (çok eski WebView) yine de düz metin
 * yazılmaz; iterasyonlu basit özet kullanılır ve bu durum `weak()` ile bildirilir.
 */

const LOCK_KEY = 'ym_lock';
const FAIL_KEY = 'ym_lock_fail';


const ITERATIONS = 120_000;

export type LockRecord = { v: 1; salt: string; hash: string; iterations: number; createdAt: number };

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function randomSalt(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** WebCrypto yoksa kullanılan yedek özet (düz metin değil, ama PBKDF2 kadar güçlü de değil). */
function fallbackHash(pin: string, salt: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  const material = `${salt}:${pin}:${salt}`;
  for (let round = 0; round < 4096; round += 1) {
    for (let i = 0; i < material.length; i += 1) {
      const code = material.charCodeAt(i) + round;
      h1 = (h1 ^ code) * 16777619 >>> 0;
      h2 = (h2 + code * 2654435761) >>> 0;
    }
  }
  return `${h1.toString(16)}${h2.toString(16)}`;
}

async function derive(pin: string, salt: string, iterations: number): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle || typeof TextEncoder === 'undefined') return fallbackHash(pin, salt);

  const encoder = new TextEncoder();
  const key = await subtle.importKey('raw', encoder.encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations, hash: 'SHA-256' },
    key,
    256,
  );
  return toHex(bits);
}

function readRecord(): LockRecord | null {
  try {
    const raw = localStorage.getItem(LOCK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LockRecord;
    return parsed && parsed.hash && parsed.salt ? parsed : null;
  } catch {
    return null;
  }
}

export function hasPin(): boolean {
  return readRecord() !== null;
}

/** Kripto desteği zayıf mı (bilgi metni için). */
export function weakCrypto(): boolean {
  return !globalThis.crypto?.subtle;
}

export async function setPin(pin: string): Promise<void> {
  const salt = randomSalt();
  const hash = await derive(pin, salt, ITERATIONS);
  const record: LockRecord = { v: 1, salt, hash, iterations: ITERATIONS, createdAt: Date.now() };
  localStorage.setItem(LOCK_KEY, JSON.stringify(record));
  resetFailures();
  markUnlocked();
}

export async function verifyPin(pin: string): Promise<boolean> {
  const record = readRecord();
  if (!record) return true;
  const hash = await derive(pin, record.salt, record.iterations);
  const ok = hash === record.hash;
  if (ok) resetFailures();
  else registerFailure();
  return ok;
}

export function clearPin(): void {
  localStorage.removeItem(LOCK_KEY);
  localStorage.removeItem(FAIL_KEY);
  sessionUnlocked = false;
}

/* ---------- yanlış deneme freni ---------- */

export type FailState = { count: number; until: number };

export function failState(): FailState {
  try {
    const raw = localStorage.getItem(FAIL_KEY);
    if (!raw) return { count: 0, until: 0 };
    const parsed = JSON.parse(raw) as FailState;
    return { count: parsed.count ?? 0, until: parsed.until ?? 0 };
  } catch {
    return { count: 0, until: 0 };
  }
}

function registerFailure(): void {
  const current = failState();
  const count = current.count + 1;
  const until = count >= 5 ? Date.now() + 30_000 : current.until;
  localStorage.setItem(FAIL_KEY, JSON.stringify({ count: count >= 5 ? 0 : count, until }));
}

export function resetFailures(): void {
  localStorage.removeItem(FAIL_KEY);
}

/** Bekleme varsa kalan saniye, yoksa 0. */
export function lockedSeconds(now = Date.now()): number {
  const { until } = failState();
  return until > now ? Math.ceil((until - now) / 1000) : 0;
}

/* ---------- oturum ---------- */

/**
 * Kilit durumu yalnızca bellekte tutulur: sayfa/app yeniden açıldığında kilit yeniden sorulur.
 * (sessionStorage kullanılsaydı yenileme veya Android'de geri dönüş kilidi atlayabilirdi.)
 */
let sessionUnlocked = false;

export function markUnlocked(): void {
  sessionUnlocked = true;
}

export function isUnlocked(): boolean {
  if (!hasPin()) return true;
  return sessionUnlocked;
}

export function markLocked(): void {
  sessionUnlocked = false;
}

/** Arka planda geçen süre sonrası kilitle (varsayılan 5 dk). */
export const RELOCK_MS = 5 * 60_000;

export function shouldRelock(hiddenAt: number, now = Date.now()): boolean {
  return now - hiddenAt >= RELOCK_MS;
}

/** PIN'i unuttum: destek adresi (uygulama verisi gönderilmez). */
export const SUPPORT_MAIL = 'teqstudio@hotmail.com';

export function forgotMailUrl(lang: 'tr' | 'en'): string {
  const subject = lang === 'tr' ? 'Yalan Makinası — PIN hatırlatma' : 'Lie Machine — PIN reminder';
  const body =
    lang === 'tr'
      ? 'Merhaba, defter kilidi PIN’imi hatırlamıyorum. Uygulamadaki Ayar → Kilit ekranından bu adrese yazdım.\n\n(Aşağıya istersen cihaz modelini ekle, veri göndermen gerekmez.)\n\n'
      : 'Hi, I do not remember my ledger PIN. I am writing from the Lock screen in the app.\n\n(Add your device model below if you like — no data needs to be sent.)\n\n';
  return `mailto:${SUPPORT_MAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
