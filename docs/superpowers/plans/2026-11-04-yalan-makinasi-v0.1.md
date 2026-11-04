# Yalan Makinası v0.1 — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bağlama göre 3 alternatif bahane üreten, her birinin yakalanma riskini ve karşı tarafın soracağı sorulara tutarlı cevapları gösteren; kaydedip paylaşabildiğin çalışan bir web uygulaması (PWA) teslim etmek.

**Architecture:** Tek Node süreci. Fastify hem `/api/*` hem derlenmiş SPA'yı servis eder; SQLite `node:sqlite` ile tek dosya. Üretim mantığı `src/engine/` altında saf TypeScript: şablon bankası + deterministik PRNG ile birleştirme + kural tabanlı risk formülü. AI sağlayıcı bir arayüzün arkasında; varsayılan şablon, LLM hata verirse sessizce şablona düşer.

**Tech Stack:** Node 26 (native TypeScript), Fastify 5 + `@fastify/static` + `@fastify/rate-limit`, `node:sqlite`, zod, React 19 + Vite 7 + Tailwind 4, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-04-yalan-makinasi-design.md`

## Global Constraints

- Node 26 çalıştırır: sunucu **derlenmez**, `node src/server/index.ts` ile çalışır. Bu yüzden: göreli import'lar **her zaman `.ts` uzantılı** (`./db.ts`), `import type` kullan, TS `enum` yok (`as const` nesne).
- TypeScript `strict: true`, `noUncheckedIndexedAccess: true`.
- Şiddet `intensity`: tam sayı **1-10**; aralık dışı → `400 VALIDATION`.
- Risk eşikleri: `düşük <35`, `orta 35-64`, `yüksek ≥65`. Formül spec §10.3'teki gibidir, değiştirilmez.
- Serbest metin `situationCustom`: **≤180 karakter**, kırpılır, HTML kabul edilir ama render edilmez (React kaçışlar).
- Her API isteği `X-Device-Id` başlığı taşır (UUID); yoksa `400 DEVICE_REQUIRED`. IP loglanmaz.
- Rate limit: cihaz+IP başına **dakikada 20** üretim; aşımda `429` + `Retry-After`.
- Tüm kullanıcı metinleri **Türkçe**. Değişken/kod isimleri İngilizce.
- Şablon yolu **ağ çağrısı yapmaz**; `templateProvider` içinde `fetch` yasak.
- Para/ödeme/reklam/hesap yok.

## Review Focus

1. **Şiddet uçları ve tip karışması:** kaydırıcıdan `"7"` (string), `0`, `11`, `NaN` gelebilir → sunucu 400 döner, istemci kullanıcıya mesaj gösterir (boş ekran değil).
2. **Serbest metin:** 180 karakter, emoji, satır sonu, `<script>` içeren girdi → kayıt edilir, ekranda ve paylaşım kartında metin olarak görünür, çalışmaz.
3. **Rate limit:** 21. istekte kullanıcı "Biraz bekle" mesajı görür; üret butonu kilitlenmez, sayaç sıfırlanınca açılır.
4. **AI arızası:** bozuk JSON / zaman aşımı / 500 → kullanıcı hata görmez, varyantlar şablondan gelir, `provider: 'template'` yazılır.
5. **Defter boşluğu:** kayıt yokken ve `device_id` kaybolduğunda ekran boş durum gösterir, çökmez; yeni `device_id` üretilir.

---

### Task 1: Monorepo iskeleti + `/api/health`

**Files:**
- Create: `package.json`, `tsconfig.json`, `.env.example`
- Create: `src/server/app.ts`, `src/server/index.ts`
- Create: `src/web/package.json`, `src/web/vite.config.ts`, `src/web/index.html`, `src/web/src/main.tsx`, `src/web/src/App.tsx`, `src/web/src/styles.css`
- Test: `tests/server/health.test.ts`

**Interfaces:**
- Consumes: `AiMode` (Task 2'de `src/shared/constants.ts` içinde tanımlanır)
- Produces: `buildApp(opts?: { dbPath?: string; aiMode?: AiMode; rateLimitPerMin?: number }): FastifyInstance`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { buildApp } from '../../src/server/app.ts';

describe('GET /api/health', () => {
  it('200 döner ve modu bildirir', async () => {
    const app = buildApp({ dbPath: ':memory:' });
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ ok: true, aiMode: 'off' });
    await app.close();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/server/health.test.ts`
Expected: FAIL — `Cannot find module '../../src/server/app.ts'`

- [ ] **Step 3: Implement**

`package.json` (root, `"type": "module"`):
dependencies `fastify`, `@fastify/static`, `@fastify/rate-limit`, `zod`; devDependencies `vitest`, `typescript`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@types/node`, `@types/react`, `@types/react-dom`.
Scripts: `dev` → `npm --prefix src/web run dev` ve `node --watch src/server/index.ts` (iki terminal / `concurrently` yok), `build` → `npm --prefix src/web run build`, `start` → `node src/server/index.ts`, `test` → `vitest run`.

`src/web/src/styles.css`: Tailwind 4 `@theme` bloğunda tasarım tokenları — zemin `#0B0B0D`, vurgu `#E8A33D`, risk `#3FA45B`/`#E8A33D`/`#D64545`, kenarlık `#FFFFFF14`, yarıçap 14px, fontlar Inter + JetBrains Mono, gövdeye SVG noise grain katmanı (%4).
`src/server/app.ts`: `buildApp` bir Fastify örneği oluşturur, `GET /api/health` → `{ ok: true, aiMode: opts.aiMode ?? 'off', version: '0.1.0' }`.
`src/server/index.ts`: `buildApp().listen({ port: Number(process.env.PORT ?? 8787), host: '0.0.0.0' })`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/server/health.test.ts`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: monorepo iskeleti ve health ucu"
```

---

### Task 2: Ortak şemalar ve sabitler

**Files:**
- Create: `src/shared/constants.ts`, `src/shared/schema.ts`
- Test: `tests/shared/schema.test.ts`

**Interfaces:**
- Produces: `TARGETS`, `CHANNELS`, `STYLES`, `SITUATIONS` (`readonly {id,label}[]`), `STATUSES`
- Produces: `type AiMode = 'off' | 'ollama' | 'openrouter'`, `type TargetId = typeof TARGETS[number]['id']` (ChannelId/StyleId/SituationId aynı biçimde)
- Produces: `generateRequestSchema`, `GenerateRequest`, `variantSchema`, `Variant`, `savedLieSchema`, `SavedLie`
- Produces: `INTENSITY_MIN = 1`, `INTENSITY_MAX = 10`, `CUSTOM_SITUATION_MAX = 180`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { generateRequestSchema } from '../../src/shared/schema.ts';

const base = { target: 'patron', situation: 'gec_kaldim', channel: 'whatsapp', style: 'ciddi' };

describe('generateRequestSchema', () => {
  it('geçerli isteği kabul eder ve şiddeti tam sayıya çeker', () => {
    expect(generateRequestSchema.parse({ ...base, intensity: '7' }).intensity).toBe(7);
  });
  it('0 ve 11 reddedilir', () => {
    expect(generateRequestSchema.safeParse({ ...base, intensity: 0 }).success).toBe(false);
    expect(generateRequestSchema.safeParse({ ...base, intensity: 11 }).success).toBe(false);
  });
  it('NaN reddedilir', () => {
    expect(generateRequestSchema.safeParse({ ...base, intensity: NaN }).success).toBe(false);
  });
  it('serbest metin 180 karaktere kırpılır', () => {
    const r = generateRequestSchema.parse({ ...base, situation: 'ozel', situationCustom: 'a'.repeat(300), intensity: 5 });
    expect(r.situationCustom).toHaveLength(180);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/shared/schema.test.ts` → FAIL (module not found)

- [ ] **Step 3: Implement**

`constants.ts`: `TARGETS` = patron, sevgili, anne, arkadas, hoca, musteri, ozel (Türkçe etiketler: "Patron", "Sevgili", "Anne-baba", "Arkadaş", "Hoca", "Müşteri", "Özel"). `CHANNELS` = yuz_yuze, telefon, whatsapp. `STYLES` = ciddi, esprili, duygusal, resmi. `SITUATIONS` = gec_kaldim, gidemedim, parayi_harcadim, mesaji_gormedim, plani_bozdum, isi_yetistiremedim, ozel.

`schema.ts`: `intensity: z.coerce.number().int().min(1).max(10)` — `z.coerce.number()` NaN'de `z.number()` hatası verir (test bunu doğrular). `situationCustom: z.string().trim().slice(0,180).optional()`. `situation` `SITUATIONS` id'lerinden biri. `variantSchema` = `{ text: z.string().min(1), strategy: z.enum(['sade','detayli','duygusal']), riskScore: z.number().int().min(0).max(100), riskLevel: z.enum(['dusuk','orta','yuksek']), riskReasons: z.array(z.string()), queries: z.array(z.object({q: z.string(), a: z.string()})).max(3) }`.

- [ ] **Step 4: Run test to verify it passes** → PASS (4 test)

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: ortak semalar ve sabitler"
```

---

### Task 3: Deterministik PRNG + cümle birleştirici

**Files:**
- Create: `src/engine/random.ts`, `src/engine/compose.ts`, `src/engine/templates/tr.ts` (en az `gec_kaldim` ve `gidemedim` bankaları; kalan durumlar Task 6'da tamamlanır)
- Test: `tests/engine/compose.test.ts`

**Interfaces:**
- Produces: `hashSeed(...parts: (string | number)[]): number`
- Produces: `mulberry32(seed: number): () => number`
- Produces: `type ComposeInput = { deviceId: string; target: TargetId; situation: SituationId; channel: ChannelId; style: StyleId; intensity: number; salt: string }`
- Produces: `type VariantDraft = { strategy: Strategy; text: string; detailTags: string[]; hasSecondPerson: boolean; hasLocation: boolean }`
- Produces: `compose(input: ComposeInput): VariantDraft[]` — her zaman 3 taslak (sade, detayli, duygusal)

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { compose } from '../../src/engine/compose.ts';

const base = { deviceId: 'dev-1', target: 'patron', situation: 'gec_kaldim', channel: 'whatsapp', style: 'ciddi', salt: '0' } as const;

describe('compose', () => {
  it('üç strateji döner ve metinler birbirinden farklı', () => {
    const drafts = compose({ ...base, intensity: 5 });
    expect(drafts.map(d => d.strategy).sort()).toEqual(['detayli', 'duygusal', 'sade']);
    expect(new Set(drafts.map(d => d.text)).size).toBe(3);
  });

  it('aynı girdi + aynı salt = aynı çıktı', () => {
    expect(compose({ ...base, intensity: 7 })).toEqual(compose({ ...base, intensity: 7 }));
  });

  it('farklı salt farklı detay seçer', () => {
    const a = compose({ ...base, intensity: 9, salt: '1' })[1]!.detailTags.join('|');
    const b = compose({ ...base, intensity: 9, salt: '2' })[1]!.detailTags.join('|');
    expect(a).not.toBe(b);
  });

  it('detay sayısı şiddetle artar ve 3 ile sınırlıdır', () => {
    expect(compose({ ...base, intensity: 1 })[1]!.detailTags).toHaveLength(0);
    expect(compose({ ...base, intensity: 6 })[1]!.detailTags).toHaveLength(2);
    expect(compose({ ...base, intensity: 10 })[1]!.detailTags).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails** → FAIL (module not found)

- [ ] **Step 3: Implement**

`hashSeed`: FNV-1a benzeri 32-bit karışım (parçalar `\u0000` ile birleştirilir). `mulberry32` standart 32-bit PRNG.
`compose`: `N = min(3, floor(intensity/3))`; sade = açılış + kapanış (detay sayısı 0), detayli ve duygusal = açılış + `N` detay + kapanış (duygusalda kapanış empati varyantı). Detaylar bankadan PRNG sırasıyla, tekrarsız seçilir. `hasSecondPerson` = seçilen detay etiketi `ikinci_kisi` ise true; `hasLocation` = etiket `konum` ise true. Cümleler `bank.openings`/`bank.closers` içinden `style` ile eşleşenlerden seçilir; eşleşme yoksa `ciddi` varyantı kullanılır.

- [ ] **Step 4: Run test to verify it passes** → PASS (4 test)

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: deterministik birlestirici"
```

---

### Task 4: Risk formülü

**Files:**
- Create: `src/engine/risk.ts`
- Test: `tests/engine/risk.test.ts`

**Interfaces:**
- Produces: `type RiskInput = { intensity: number; target: TargetId; channel: ChannelId; detailCount: number; hasSecondPerson: boolean; hasLocation: boolean; mentionsDocument: boolean; conflictCount: number }`
- Produces: `scoreRisk(input: RiskInput): { score: number; level: 'dusuk'|'orta'|'yuksek'; reasons: string[] }`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { scoreRisk } from '../../src/engine/risk.ts';

const base = { intensity: 1, target: 'arkadas', channel: 'whatsapp', detailCount: 0, hasSecondPerson: false, hasLocation: false, mentionsDocument: false, conflictCount: 0 } as const;

describe('scoreRisk', () => {
  it('en hafif kombinasyon düşük risk', () => {
    const r = scoreRisk(base);
    expect(r.score).toBe(18);
    expect(r.level).toBe('dusuk');
  });
  it('eşik sınırları: 34 düşük, 35 orta, 64 orta, 65 yüksek', () => {
    expect(scoreRisk({ ...base, intensity: 3, target: 'arkadas', channel: 'whatsapp' }).score).toBe(24);
    expect(scoreRisk({ ...base, intensity: 4, target: 'arkadas', channel: 'telefon' }).score).toBe(37);
    expect(scoreRisk({ ...base, intensity: 10, target: 'patron', channel: 'yuz_yuze', detailCount: 3 }).level).toBe('yuksek');
  });
  it('belge geçen metin her zaman yüksek risk', () => {
    const r = scoreRisk({ ...base, intensity: 10, target: 'musteri', channel: 'yuz_yuze', detailCount: 3, mentionsDocument: true });
    expect(r.score).toBe(100);
    expect(r.level).toBe('yuksek');
  });
  it('çelişki puanı 20 ile sınırlıdır ve nedeni yazılır', () => {
    const r = scoreRisk({ ...base, conflictCount: 5 });
    expect(r.score).toBe(38);
    expect(r.reasons).toContain('Bu kişiye son 30 günde 2+ bahane söyledin');
  });
});
```

- [ ] **Step 2: Run test to verify it fails** → FAIL

- [ ] **Step 3: Implement**

Spec §10.3 formülü birebir: `base = intensity*3`, `targetW` tablo (`arkadas:10, anne:15, ozel:15, sevgili:20, hoca:20, patron:25, musteri:25`), `channelW` (`whatsapp:5, telefon:10, yuz_yuze:15`), `detailW = detailCount*5`, `+15` ikinci kişi, `+15` konum, `+20` belge, `conflictW = min(20, conflictCount*10)`; toplam `min(100, ...)`. `reasons` insan diline çevrilir; her katkı için bir cümle, en fazla 3 tanesi döner (puana göre sıralı).

- [ ] **Step 4: Run test to verify it passes** → PASS

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: risk formulu"
```

---

### Task 5: Sorgu provası (metinle tutarlı)

**Files:**
- Create: `src/engine/queries.ts`
- Modify: `src/engine/templates/tr.ts` (bankalara `queries: {q, tag}[]` ekle)
- Test: `tests/engine/queries.test.ts`

**Interfaces:**
- Produces: `buildQueries(bank: Bank, draft: VariantDraft, rng: () => number): { q: string; a: string }[]` — en fazla 3, yalnızca `draft.detailTags` içinde karşılığı olan sorular

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { mulberry32 } from '../../src/engine/random.ts';
import { buildQueries } from '../../src/engine/queries.ts';
import { banks } from '../../src/engine/templates/tr.ts';

const draft = { strategy: 'detayli' as const, text: 'Trafik vardı, annemdeydim, kusura bakma.', detailTags: ['ulasim'], hasSecondPerson: false, hasLocation: false };

describe('buildQueries', () => {
  it('sadece metinde geçen detaya ait soruları sorar', () => {
    const qs = buildQueries(banks.gec_kaldim, draft, mulberry32(1));
    expect(qs.length).toBeGreaterThan(0);
    expect(qs.every(x => x.q.length > 0 && x.a.length > 0)).toBe(true);
  });
  it('detay yoksa soru yok', () => {
    expect(buildQueries(banks.gec_kaldim, { ...draft, detailTags: [] }, mulberry32(1))).toEqual([]);
  });
  it('en fazla 3 soru döner', () => {
    const d = { ...draft, detailTags: ['ulasim', 'aile', 'saglik'] };
    expect(buildQueries(banks.gec_kaldim, d, mulberry32(1)).length).toBeLessThanOrEqual(3);
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement**

Banka `queries` listesinden `tag ∈ draft.detailTags` olanlar süzülür, PRNG ile karıştırılır, ilk 3 alınır. Cevap metni bankadaki `a` alanından gelir ve **aynı etiketin detay cümlesiyle aynı olguyu** anlatır (spec §10.4). Testte ayrıca her cevabın, o etiketin detay metnindeki en az bir anlamlı kelimeyi içerdiği doğrulanır.

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: sorgu provasi"
```

---

### Task 6: Şablon sağlayıcı + sağlayıcı arayüzü

**Files:**
- Create: `src/engine/types.ts`, `src/engine/providers/template.ts`, `src/engine/providers/index.ts`
- Modify: `src/engine/templates/tr.ts` (kalan 5 durum bankası)
- Test: `tests/engine/template-provider.test.ts`

**Interfaces:**
- Produces: `interface LlmProvider { id: 'template'|'ollama'|'openrouter'; generate(req: GenerateRequest, ctx: { deviceId: string; salt: string; conflictCount: number }): Promise<Variant[]> }`
- Produces: `templateProvider: LlmProvider`
- Produces: `getProvider(aiMode: AiMode): LlmProvider`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { templateProvider } from '../../src/engine/providers/template.ts';
import { variantSchema } from '../../src/shared/schema.ts';
import { TARGETS, SITUATIONS } from '../../src/shared/constants.ts';

describe('templateProvider', () => {
  it('tüm hedef × durum × şiddet kombinasyonlarında 3 geçerli varyant üretir', async () => {
    for (const t of TARGETS) for (const s of SITUATIONS) for (const intensity of [1, 5, 10]) {
      const vs = await templateProvider.generate(
        { target: t.id, situation: s.id, channel: 'whatsapp', style: 'ciddi', intensity } as never,
        { deviceId: 'd', salt: '0', conflictCount: 0 },
      );
      expect(vs).toHaveLength(3);
      for (const v of vs) expect(variantSchema.safeParse(v).success).toBe(true);
      expect(new Set(vs.map(v => v.text)).size).toBe(3);
    }
  });
  it('ağ çağrısı yapmaz', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = () => { throw new Error('fetch yasak'); };
    await expect(templateProvider.generate({ target: 'patron', situation: 'gec_kaldim', channel: 'whatsapp', style: 'ciddi', intensity: 5 } as never, { deviceId: 'd', salt: '0', conflictCount: 0 })).resolves.toHaveLength(3);
    globalThis.fetch = original;
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement**

`template.ts`: `compose` → her taslak için `scoreRisk` + `buildQueries` → `variantSchema.parse`. `mentionsDocument` metinde "rapor/belge/imza" kelimesi geçiyorsa true.
`templates/tr.ts`: 7 durum bankası; her bankada en az 3 açılış, 3 kapanış, 4 detay (etiketli: `ulasim`, `saglik`, `aile`, `is`, `konum`, `ikinci_kisi`), 3 sorgu. Ton varyantları ciddi/esprili/duygusal/resmi için ayrı metin.
`providers/index.ts`: `getProvider` — `off` → template; `ollama`/`openrouter` Task 14'te bağlanır, o zamana kadar template döner.

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: sablon saglayici ve saglayici arayuzu"
```

---

### Task 7: SQLite katmanı

**Files:**
- Create: `src/server/schema.sql`, `src/server/db.ts`
- Test: `tests/server/db.test.ts`

**Interfaces:**
- Produces: `openDb(path: string): DatabaseSync`
- Produces: `type NewLie = { id: string; deviceId: string; target: TargetId; situation: SituationId; situationCustom: string | null; channel: ChannelId; style: StyleId; intensity: number; text: string; strategy: Strategy; riskScore: number; riskReasons: string[]; queries: { q: string; a: string }[]; provider: string; status: Status }`
- Produces: `insertLie(db, row: NewLie): void`, `listLies(db, deviceId, limit): SavedLie[]`, `getLie(db, id, deviceId): SavedLie | null`, `updateLieStatus(db, id, deviceId, status): boolean`, `deleteLie(db, id, deviceId): boolean`, `findConflicts(db, deviceId, target, situation, detailTags): { lieId: string; createdAt: number; text: string }[]`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { openDb, insertLie, listLies, updateLieStatus, deleteLie, findConflicts } from '../../src/server/db.ts';

const row = { id: 'l1', deviceId: 'd1', target: 'sevgili', situation: 'gidemedim', situationCustom: null, channel: 'whatsapp', style: 'ciddi', intensity: 5, text: 'Annem rahatsızdı.', strategy: 'detayli', riskScore: 42, riskReasons: ['konum kontrol edilebilir'], queries: [{ q: 'Neredeydin?', a: 'Annemdeydim.' }], provider: 'template', status: 'beklemede' };

describe('db', () => {
  it('kayıt ekler ve listeler', () => {
    const db = openDb(':memory:');
    insertLie(db, row);
    expect(listLies(db, 'd1', 50)).toHaveLength(1);
  });
  it('başka cihaz kaydı görmez', () => {
    const db = openDb(':memory:');
    insertLie(db, row);
    expect(listLies(db, 'd2', 50)).toHaveLength(0);
  });
  it('durum güncellenir, kayıt silinir', () => {
    const db = openDb(':memory:');
    insertLie(db, row);
    expect(updateLieStatus(db, 'l1', 'd1', 'tuttu')).toBe(true);
    expect(deleteLie(db, 'l1', 'd1')).toBe(true);
    expect(listLies(db, 'd1', 50)).toHaveLength(0);
  });
  it('aynı hedef + aynı durumda çelişki bulur', () => {
    const db = openDb(':memory:');
    insertLie(db, row);
    expect(findConflicts(db, 'd1', 'sevgili', 'gidemedim', ['aile'])).toHaveLength(1);
    expect(findConflicts(db, 'd1', 'patron', 'gidemedim', [])).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement**

`schema.sql`: spec §8'deki DDL (lies + schema_version + iki indeks). `openDb` `new DatabaseSync(path)`, `PRAGMA journal_mode=WAL`, `schema.sql` dosyasını okuyup `exec` eder (idempotent `CREATE TABLE IF NOT EXISTS`). JSON alanlar `JSON.stringify`/`parse` ile eşlenir. `findConflicts`: son 30 gün (`created_at >= now - 2592000000`), aynı `device_id` + `target`, `situation` eşit veya detay etiketi kesişimi olan kayıtlar.

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: sqlite katmani"
```

---

### Task 8: API rotaları, abuse freni, rate limit

**Files:**
- Create: `src/server/routes/generate.ts`, `src/server/routes/lies.ts`, `src/server/abuse.ts`
- Modify: `src/server/app.ts` (rotaları bağla, rate limit ve hata işleyici)
- Test: `tests/server/api.test.ts`

**Interfaces:**
- Consumes: Task 2 şemaları, Task 6 `getProvider`, Task 7 db fonksiyonları
- Produces: `POST /api/generate` → `{ variants: Variant[] }`; `POST /api/lies` → `{ id, createdAt }`; `GET /api/lies?limit` → `{ items }`; `PATCH/DELETE /api/lies/:id`; `DELETE /api/lies` (cihazın tüm kayıtları); `GET /api/lies/conflicts?target`; `GET /api/conflicts/preview?target&situation&channel&intensity` → `{ score, level, reasons }` (kayıtsız, formül önizlemesi)
- Produces: `isAbusive(text: string): boolean`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { buildApp } from '../../src/server/app.ts';

const H = { 'x-device-id': '11111111-1111-4111-8111-111111111111' };

describe('API', () => {
  it('X-Device-Id yoksa 400 DEVICE_REQUIRED', async () => {
    const app = buildApp({ dbPath: ':memory:' });
    const res = await app.inject({ method: 'POST', url: '/api/generate', payload: { target: 'patron', situation: 'gec_kaldim', channel: 'whatsapp', style: 'ciddi', intensity: 5 } });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('DEVICE_REQUIRED');
    await app.close();
  });

  it('geçerli istek 3 varyant döner', async () => {
    const app = buildApp({ dbPath: ':memory:' });
    const res = await app.inject({ method: 'POST', url: '/api/generate', headers: H, payload: { target: 'patron', situation: 'gec_kaldim', channel: 'whatsapp', style: 'ciddi', intensity: 5 } });
    expect(res.statusCode).toBe(200);
    expect(res.json().variants).toHaveLength(3);
    await app.close();
  });

  it('şiddet 0 → 400 VALIDATION', async () => {
    const app = buildApp({ dbPath: ':memory:' });
    const res = await app.inject({ method: 'POST', url: '/api/generate', headers: H, payload: { target: 'patron', situation: 'gec_kaldim', channel: 'whatsapp', style: 'ciddi', intensity: 0 } });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('VALIDATION');
    await app.close();
  });

  it('belge talebi ABUSE_BLOCKED', async () => {
    const app = buildApp({ dbPath: ':memory:' });
    const res = await app.inject({ method: 'POST', url: '/api/generate', headers: H, payload: { target: 'patron', situation: 'ozel', situationCustom: 'bana doktor raporu yaz', channel: 'whatsapp', style: 'resmi', intensity: 5 } });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('ABUSE_BLOCKED');
    await app.close();
  });

  it('21. istek 429 döner', async () => {
    const app = buildApp({ dbPath: ':memory:', rateLimitPerMin: 20 });
    let last = 0;
    for (let i = 0; i < 21; i++) {
      const r = await app.inject({ method: 'POST', url: '/api/generate', headers: H, payload: { target: 'arkadas', situation: 'gec_kaldim', channel: 'whatsapp', style: 'ciddi', intensity: 3 } });
      last = r.statusCode;
    }
    expect(last).toBe(429);
    await app.close();
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement**

`abuse.ts`: kelime listesi (`doktor raporu`, `sağlık raporu`, `resmî belge`, `resmi belge`, `izin kağıdı`, `izin kâğıdı`, `imza`, `fatura`, `ehliyet`, `mahkeme`, `savcılık`), küçük harfe indirip arar.
`app.ts`: `@fastify/rate-limit` (key: `x-device-id` + IP, `max: rateLimitPerMin`, `timeWindow: '1 minute'`); hata işleyici zod hatalarını `VALIDATION`, abuse'u `ABUSE_BLOCKED` olarak döner; `POST /api/generate` cihaz çelişkilerini sayıp provider'a geçirir; `POST /api/lies` `X-Device-Id`'yi satıra yazar; `GET /api/lies/conflicts` son 30 günü döner.

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: api rotalari, abuse freni, rate limit"
```

---

### Task 9: Şiddet kaydırıcısı (UI bileşeni)

**Files:**
- Create: `src/web/src/components/IntensitySlider.tsx`, `src/web/src/lib/intensity.ts`
- Test: `tests/web/intensity.test.tsx`

**Interfaces:**
- Produces: `intensityBand(v: number): { label: string; hint: string }` (1-2 Beyaz yalan, 3-4 Küçük bahane, 5-6 Kıvırma, 7-8 Cesur, 9-10 Senaryo)
- Produces: `<IntensitySlider value onChange />` — `role="slider"`, `aria-valuemin=1`, `aria-valuemax=10`, klavye `←/→`, `Home/End`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { IntensitySlider } from '../../src/web/src/components/IntensitySlider.tsx';
import { intensityBand } from '../../src/web/src/lib/intensity.ts';

describe('IntensitySlider', () => {
  it('bant etiketleri doğru', () => {
    expect(intensityBand(1).label).toBe('Beyaz yalan');
    expect(intensityBand(6).label).toBe('Kıvırma');
    expect(intensityBand(10).label).toBe('Senaryo');
  });
  it('ok tuşu değeri artırır ve sınırda durur', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<IntensitySlider value={10} onChange={onChange} />);
    const slider = screen.getByRole('slider');
    await userEvent.click(slider);
    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith(10);
    rerender(<IntensitySlider value={5} onChange={onChange} />);
    await userEvent.click(slider);
    await userEvent.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenLastCalledWith(4);
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement**

Görsel: 10 çentikli ray, gradyan `#3FA45B → #E8A33D → #D64545`, topuz üstünde sayı + bant etiketi. Sürükleme (pointer events) + klavye. `vibrate(8)` varsa çağrılır. `aria-valuetext` = bant etiketi.

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(siddet): 1-10 kaydirici"
```

---

### Task 10: Üretici ekranı + API istemcisi

**Files:**
- Create: `src/web/src/lib/api.ts`, `src/web/src/lib/deviceId.ts`, `src/web/src/screens/Generator.tsx`
- Modify: `src/web/src/App.tsx`
- Test: `tests/web/generator.test.tsx`

**Interfaces:**
- Produces: `getDeviceId(): string` (localStorage `ym_device`, yoksa `crypto.randomUUID()`)
- Produces: `api.generate(body): Promise<Variant[]>`, `api.saveLie(...)`, `api.listLies()`, `api.updateStatus(id, status)`, `api.deleteLie(id)`, `api.previewRisk(query): Promise<{score, level, reasons}>`
- Consumes: Task 9 slider, Task 2 sabitleri, Task 8 `GET /api/conflicts/preview`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Generator } from '../../src/web/src/screens/Generator.tsx';

const variants = [
  { text: 'Trafik vardı.', strategy: 'sade', riskScore: 20, riskLevel: 'dusuk', riskReasons: [], queries: [] },
  { text: 'Annemdeydim.', strategy: 'detayli', riskScore: 45, riskLevel: 'orta', riskReasons: ['konum'], queries: [{ q: 'Neredeydin?', a: 'Annemde.' }] },
  { text: 'Yolda kaldım.', strategy: 'duygusal', riskScore: 30, riskLevel: 'dusuk', riskReasons: [], queries: [] },
];

beforeEach(() => { vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ variants }), { status: 200 }))); });

describe('Generator', () => {
  it('üret butonu varsayılanlarla istek atar ve 3 kart gösterir', async () => {
    render(<Generator onGenerated={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /üret/i }));
    expect(screen.getAllByTestId('variant-card')).toHaveLength(3);
    const body = JSON.parse((fetch as never as { mock: { calls: [string, RequestInit][] } }).mock.calls[0]![1].body as string);
    expect(body).toMatchObject({ target: 'arkadas', channel: 'whatsapp', style: 'ciddi', intensity: 5 });
  });

  it('429 gelirse kullanıcı mesajı gösterir', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: { code: 'RATE_LIMITED', message: 'x' } }), { status: 429 })));
    render(<Generator onGenerated={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /üret/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/biraz bekle/i);
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement**

`Generator`: kime kartları (yatay kaydırma), durum çipleri + serbest metin (180), kanal segmenti, ton segmenti, `IntensitySlider`, "Üret" butonu (yüklenirken spinner + `disabled`). Şiddet/hedef/kanal değiştiğinde 250 ms debounce ile `previewRisk` çağrılır ve kaydırıcının altındaki **canlı risk göstergesi** güncellenir ("şu an: ORTA 48/100"). Hata durumları: 429 → "Biraz bekle, çok hızlı üretiyorsun."; `ABUSE_BLOCKED` → "Bu tür bir metin üretemem."; diğer → "Bir şeyler ters gitti, tekrar dene." Hepsi `role="alert"`.
`App.tsx`: ekran durumu (`generator` | `ledger` | `settings`) — router yok.

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: uretici ekrani"
```

---

### Task 11: Sonuç kartı + kopyala/WhatsApp/kaydet/yeniden

**Files:**
- Create: `src/web/src/components/VariantCard.tsx`, `src/web/src/components/Typewriter.tsx`
- Test: `tests/web/variant-card.test.tsx`

**Interfaces:**
- Produces: `<VariantCard variant onSave onRegenerate />` (testid `variant-card`), `<Typewriter text speedMs />`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { VariantCard } from '../../src/web/src/components/VariantCard.tsx';

const v = { text: 'Trafik vardı, kusura bakma.', strategy: 'sade' as const, riskScore: 20, riskLevel: 'dusuk' as const, riskReasons: ['konum kontrol edilebilir'], queries: [{ q: 'Neredeydin?', a: 'Yolda.' }] };

describe('VariantCard', () => {
  it('risk seviyesini ve sorguları gösterir', () => {
    render(<VariantCard variant={v} onSave={vi.fn()} onRegenerate={vi.fn()} />);
    expect(screen.getByText(/düşük/i)).toBeInTheDocument();
    expect(screen.getByText('Neredeydin?')).toBeInTheDocument();
  });
  it('HTML içeren metin çalışmaz, düz yazı olarak görünür', () => {
    render(<VariantCard variant={{ ...v, text: '<img src=x onerror=alert(1)>' }} onSave={vi.fn()} onRegenerate={vi.fn()} />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByTestId('variant-text').textContent).toContain('<img');
  });
  it('kaydet ve yeniden üret çağrılır', async () => {
    const onSave = vi.fn(); const onRegen = vi.fn();
    render(<VariantCard variant={v} onSave={onSave} onRegenerate={onRegen} />);
    await userEvent.click(screen.getByRole('button', { name: /defter/i }));
    await userEvent.click(screen.getByRole('button', { name: /yeniden/i }));
    expect(onSave).toHaveBeenCalledOnce();
    expect(onRegen).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement**

Kart: strateji etiketi, risk rozetı (renk eşikleri), `Typewriter` metin (reduced-motion'da anında), risk nedenleri (en çok 2), "Karşı taraf ne sorar" açılır listesi, aksiyon satırı: Kopyala (`navigator.clipboard.writeText` + toast), WhatsApp (`https://wa.me/?text=`), Defter'e kaydet, Yeniden (`↻`).
`Typewriter`: `useEffect` + `setInterval`, unmount'ta temizler, `prefers-reduced-motion` dinler.

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: sonuc karti"
```

---

### Task 12: Yalan Defteri + çelişki bandı

**Files:**
- Create: `src/web/src/screens/Ledger.tsx`
- Test: `tests/web/ledger.test.tsx`

**Interfaces:**
- Consumes: `api.listLies`, `api.updateStatus`, `api.deleteLie`
- Produces: `<Ledger />` — boş durumda "Defter boş" + üreticiye dön butonu

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Ledger } from '../../src/web/src/screens/Ledger.tsx';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ items: [
    { id: 'l1', target: 'sevgili', text: 'Annem rahatsızdı.', status: 'beklemede', createdAt: 1, situation: 'gidemedim' },
  ] }), { status: 200 })));
});

describe('Ledger', () => {
  it('kayıtları listeler', async () => {
    render(<Ledger conflicts={[]} />);
    expect(await screen.findByText('Annem rahatsızdı.')).toBeInTheDocument();
  });
  it('boş defterde boş durum gösterir', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ items: [] }), { status: 200 })));
    render(<Ledger conflicts={[]} />);
    expect(await screen.findByText(/defter boş/i)).toBeInTheDocument();
  });
  it('çelişki varsa uyarı bandı görünür', async () => {
    render(<Ledger conflicts={[{ lieId: 'l1', createdAt: 1, text: 'Annem rahatsızdı.' }]} />);
    expect(await screen.findByRole('status')).toHaveTextContent(/çeliş/i);
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement**

Liste satırı: metin (2 satır clamp), hedef + tarih (`Intl.DateTimeFormat('tr-TR')`), durum rozetı üç durumlu (tıklayınca sırayla değişir: beklemede → tuttu → tutmadı), kopyala, sil. Çelişki bandı `role="status"`.
Tarih/saat biçimlendirmesi `lib/format.ts` içinde tek yerde.

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: yalan defteri"
```

---

### Task 13: Paylaşım kartı (1080×1350)

**Files:**
- Create: `src/web/src/lib/shareCard.ts`
- Test: `tests/web/share-card.test.ts`

**Interfaces:**
- Produces: `buildShareCardModel(lie: { text: string; targetLabel: string; riskLevel: string }): { width: 1080; height: 1350; lines: string[]; footer: string }`
- Produces: `drawShareCard(ctx: CanvasRenderingContext2D, model: ShareCardModel): void` — elle görsel doğrulama

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { buildShareCardModel } from '../../src/web/src/lib/shareCard.ts';

describe('buildShareCardModel', () => {
  it('1080×1350 ve metni satırlara böler', () => {
    const m = buildShareCardModel({ text: 'a'.repeat(40) + ' ' + 'b'.repeat(300), targetLabel: 'Patron', riskLevel: 'orta' });
    expect(m.width).toBe(1080);
    expect(m.height).toBe(1350);
    expect(m.lines.length).toBeGreaterThan(1);
    expect(m.lines.join('')).not.toContain('\n');
  });
  it('alt yazı marka içerir', () => {
    expect(buildShareCardModel({ text: 'x', targetLabel: 'Arkadaş', riskLevel: 'dusuk' }).footer).toContain('Yalan Makinası');
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement**

`buildShareCardModel`: metni 34 karakter genişliğe göre kelime bazlı sarar, en çok 12 satır (fazlası `…`), risk etiketi Türkçe.
`drawShareCard`: koyu zemin + grain, üstte "YALAN MAKİNASI", ortada metin (JetBrains Mono), altta risk rozetı ve `footer`. Buton: `toBlob` → indir (`<a download>`). Görsel doğrulama tarayıcıda ekran görüntüsüyle yapılır ve sonucu commit mesajına not edilir.

- [ ] **Step 4: Run → PASS (birim) + elle görsel kontrol**

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: paylasim karti"
```

---

### Task 14: AI sağlayıcıları (Ollama / OpenRouter) + sessiz fallback

**Files:**
- Create: `src/engine/providers/openaiCompat.ts`, `src/engine/providers/ollama.ts`, `src/engine/providers/openrouter.ts`
- Modify: `src/engine/providers/index.ts`, `src/server/app.ts` (aiMode env), `.env.example`
- Test: `tests/engine/ai-fallback.test.ts`

**Interfaces:**
- Produces: `createOpenAiCompatProvider(cfg: { id: 'ollama'|'openrouter'; baseUrl: string; model: string; apiKey?: string; timeoutMs?: number }): LlmProvider`
- Behaviour: 6 sn timeout, tek deneme, zod hatası/ağ hatası → `templateProvider` sonucu, `provider: 'template'`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi } from 'vitest';
import { createOpenAiCompatProvider } from '../../src/engine/providers/openaiCompat.ts';

const req = { target: 'patron', situation: 'gec_kaldim', channel: 'whatsapp', style: 'ciddi', intensity: 5 } as never;
const ctx = { deviceId: 'd', salt: '0', conflictCount: 0 };

describe('openaiCompat', () => {
  it('geçerli JSON dönerse LLM varyantlarını kullanır', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ variants: [
      { text: 'A', strategy: 'sade', riskScore: 10, riskLevel: 'dusuk', riskReasons: [], queries: [] },
      { text: 'B', strategy: 'detayli', riskScore: 20, riskLevel: 'dusuk', riskReasons: [], queries: [] },
      { text: 'C', strategy: 'duygusal', riskScore: 30, riskLevel: 'dusuk', riskReasons: [], queries: [] },
    ] }) } }] }), { status: 200 })));
    const p = createOpenAiCompatProvider({ id: 'ollama', baseUrl: 'http://x', model: 'm' });
    const vs = await p.generate(req, ctx);
    expect(vs.map(v => v.text)).toEqual(['A', 'B', 'C']);
  });

  it('bozuk JSON → şablona düşer, hata fırlatmaz', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('bozuk', { status: 200 })));
    const p = createOpenAiCompatProvider({ id: 'ollama', baseUrl: 'http://x', model: 'm' });
    const vs = await p.generate(req, ctx);
    expect(vs).toHaveLength(3);
    expect(vs[0]!.text.length).toBeGreaterThan(0);
  });

  it('500 → şablona düşer', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('err', { status: 500 })));
    const p = createOpenAiCompatProvider({ id: 'openrouter', baseUrl: 'http://x', model: 'm', apiKey: 'k' });
    expect(await p.generate(req, ctx)).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement**

`openaiCompat`: `AbortController` + timeout, `response_format: { type: 'json_object' }`, sistem istemi spec §11 kuralları (yalnızca verilen bağlam, belge/sağlık/suç yok, JSON şeması birebir). Cevap `variantSchema.array().length(3).safeParse` ile doğrulanır.
`ollama.ts`/`openrouter.ts`: env'den cfg üretip `createOpenAiCompatProvider` çağırır. `index.ts` `getProvider(aiMode)` gerçek sağlayıcıyı döner.
`.env.example`: `AI_MODE=off`, `OLLAMA_URL=http://192.168.1.12:11434`, `OLLAMA_MODEL=qwen2.5:14b-instruct-q4_K_M`, `OPENROUTER_KEY=`, `OPENROUTER_MODEL=`.

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: AI saglayicilari ve sessiz fallback"
```

---

### Task 15: Ayarlar, KVKK, PWA ve cihazı temizleme

**Files:**
- Create: `src/web/src/screens/Settings.tsx`, `src/web/public/manifest.webmanifest`, `src/web/public/icons/icon-192.png` + `icon-512.png`
- Modify: `src/web/vite.config.ts` (`vite-plugin-pwa`), `src/web/src/App.tsx` (settings ekranı)
- Modify: `src/server/routes/lies.ts` (`DELETE /api/lies`)
- Test: `tests/web/settings.test.tsx`, `tests/server/api.test.ts` (tümünü sil)

**Interfaces:**
- Consumes: `api.*` (Task 10)
- Produces: `<Settings />`; `DELETE /api/lies` → `{ deleted: number }`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Settings } from '../../src/web/src/screens/Settings.tsx';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ deleted: 2 }), { status: 200 })));
});

describe('Settings', () => {
  it('tüm kayıtları siler ve onay ister', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true));
    render(<Settings aiMode="off" onBack={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /tüm kayıtları sil/i }));
    expect(confirm).toHaveBeenCalled();
    expect(await screen.findByRole('status')).toHaveTextContent(/2/);
  });
  it('KVKK ve kötüye kullanım metni görünür', () => {
    render(<Settings aiMode="off" onBack={() => {}} />);
    expect(screen.getByText(/eğlence amaçlıdır/i)).toBeInTheDocument();
    expect(screen.getByText(/KVKK/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement**

`Settings`: AI modu göstergesi (salt okunur, sunucudan `/api/health`), varsayılan ton ve şiddet (localStorage), "Defteri dışa aktar" (JSON indirme), "Tüm kayıtları sil" (`confirm` + `DELETE /api/lies`), KVKK aydınlatma metni + kötüye kullanım uyarısı, sürüm.
`DELETE /api/lies`: `X-Device-Id` sahibi tüm satırları siler, `{ deleted }` döner.
PWA: `manifest.webmanifest` (ad "Yalan Makinası", `display: standalone`, `theme_color: #0B0B0D`, 192/512 ikon), `vite-plugin-pwa` ile `generateSW` (precache: derlenmiş varlıklar; `/api` **cache dışı**). `index.html`'e manifest bağlantısı.

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: ayarlar, kvkk, pwa"
```

---

## Kapanış kontrolü

- `npm test` → tüm testler yeşil.
- `npm run build && npm start` → 8787'de tek süreç, `/` uygulamayı, `/api/health` JSON döner.
- Tarayıcıda elle: şiddet 1 ve 10 ile üret, kaydet, defterde gör, durumu değiştir, paylaşım kartını indir, 21. istekte 429 mesajını gör, telefondan "ana ekrana ekle" ile kur.
- AI kapalıyken hiçbir ağ çağrısı yok (DevTools Network boş).
