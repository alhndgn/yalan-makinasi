/**
 * Çelişki motoru — kayıtlı yalanlar arasındaki tutarsızlıkları bulur.
 *
 * Tamamen deterministik ve AI'sız çalışır: aynı kayıtlar her zaman aynı çelişkileri verir.
 * Tarayıcıda da geçerli olması için Node API'si kullanmaz.
 */

export type LieLike = {
  id: string;
  text: string;
  person?: string | null;
  situation: string;
  channel?: string;
  createdAt: number;
  status?: string;
};

export type ConflictKind = 'repeat' | 'similar' | 'same_day' | 'detail';
export type ConflictSeverity = 'low' | 'medium' | 'high';

export type Conflict = {
  id: string;
  a: LieLike;
  b: LieLike;
  kind: ConflictKind;
  severity: ConflictSeverity;
  /** Ayrıntı çelişkisinde zıt ifade çifti: "hasta ↔ şehir dışında". */
  pair?: [string, string];
};

const DAY = 86_400_000;
/** Aynı mazeretin tekrarı sayılması için üst sınır. */
const REPEAT_WINDOW_DAYS = 14;
/** Metin benzerliği eşiği (Jaccard). */
const SIMILARITY_THRESHOLD = 0.55;

/** Zıt anlamlı ayrıntı çiftleri — küçük ve kontrollü tutuluyor. */
const OPPOSITES: [string, string][] = [
  ['hasta', 'şehir dışında'],
  ['hastaydı', 'şehir dışındaydı'],
  ['hasta', 'iyi'],
  ['evde', 'işte'],
  ['evdeydim', 'işteydim'],
  ['izinli', 'çalışıyor'],
  ['yoldaydım', 'evdeydim'],
  ['kapatmışım', 'açıktı'],
];

const SEVERITY_RANK: Record<ConflictSeverity, number> = { low: 1, medium: 2, high: 3 };

function lower(value: string): string {
  return value.toLocaleLowerCase('tr');
}

/** Kelime kümesi: noktalama atılır, 3 harften kısa sözcükler yok sayılır. */
export function tokens(text: string): Set<string> {
  return new Set(
    lower(text)
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2),
  );
}

/** İki metin arasındaki Jaccard benzerliği (0-1). */
export function similarity(a: string, b: string): number {
  const left = tokens(a);
  const right = tokens(b);
  if (left.size === 0 || right.size === 0) return 0;
  let shared = 0;
  for (const word of left) if (right.has(word)) shared += 1;
  return shared / (left.size + right.size - shared);
}

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function hasOpposite(text: string, word: string): boolean {
  return lower(text).includes(lower(word));
}

/**
 * Aynı kişiye ait kayıtlar arasında çelişki arar.
 * Girdi sırası önemli değildir; çıktı yeniden eskiye sıralıdır.
 */
export function findConflicts(items: LieLike[]): Conflict[] {
  const sorted = [...items].sort((x, y) => y.createdAt - x.createdAt);
  const found = new Map<string, Conflict>();

  const push = (conflict: Conflict) => {
    // Aynı kayıt çifti için tek çelişki gösterilir: en ağır olan kazanır.
    const key = `${conflict.a.id}:${conflict.b.id}`;
    const existing = found.get(key);
    if (!existing || SEVERITY_RANK[conflict.severity] > SEVERITY_RANK[existing.severity]) {
      found.set(key, conflict);
    }
  };

  for (let i = 0; i < sorted.length; i += 1) {
    const a = sorted[i]!;
    for (let j = i + 1; j < sorted.length; j += 1) {
      const b = sorted[j]!;
      const gap = Math.abs(a.createdAt - b.createdAt);

      // 1) Aynı mazeret, yakın tarihte tekrar
      if (a.situation !== 'ozel' && b.situation !== 'ozel' && a.situation === b.situation && gap <= REPEAT_WINDOW_DAYS * DAY) {
        push({
          id: `repeat-${a.id}-${b.id}`,
          a,
          b,
          kind: 'repeat',
          severity: 'medium',
        });
      }

      // 2) Neredeyse aynı cümle
      if (a.text.length > 20 && b.text.length > 20 && similarity(a.text, b.text) >= SIMILARITY_THRESHOLD) {
        push({
          id: `similar-${a.id}-${b.id}`,
          a,
          b,
          kind: 'similar',
          severity: 'high',
        });
      }

      // 3) Aynı gün, iki farklı mazeret
      if (
        a.situation !== 'ozel' &&
        b.situation !== 'ozel' &&
        a.situation !== b.situation &&
        dayKey(a.createdAt) === dayKey(b.createdAt)
      ) {
        push({
          id: `day-${a.id}-${b.id}`,
          a,
          b,
          kind: 'same_day',
          severity: 'high',
        });
      }

      // 4) Zıt ayrıntı (hasta ↔ şehir dışında gibi)
      for (const [first, second] of OPPOSITES) {
        const crossed =
          (hasOpposite(a.text, first) && hasOpposite(b.text, second)) ||
          (hasOpposite(a.text, second) && hasOpposite(b.text, first));
        if (crossed) {
          push({
            id: `detail-${a.id}-${b.id}`,
            a,
            b,
            kind: 'detail',
            severity: 'low',
            pair: [first, second],
          });
          break;
        }
      }
    }
  }

  return [...found.values()].sort(
    (x, y) =>
      SEVERITY_RANK[y.severity] - SEVERITY_RANK[x.severity] ||
      Math.max(y.a.createdAt, y.b.createdAt) - Math.max(x.a.createdAt, x.b.createdAt),
  );
}

/** Kişi özetinde gösterilecek çelişki sayısı (kırmızı nokta). */
export function conflictCount(items: LieLike[]): number {
  return findConflicts(items).length;
}
