# Yalan Makinası — Tasarım Spesifikasyonu

**Tarih:** 2026-11-04
**Durum:** Onaylandı (v0.1 kapsamı)
**Proje:** `C:\dev\projeler\yalan-makinasi`

---

## 1. Ürün tanımı

Kullanıcı acil bir bahaneye ihtiyaç duyduğunda açtığı, girdiği bağlama göre (kime, hangi durum, hangi kanal, hangi ton, ne kadar cesur) **birden fazla alternatif metin** üreten; her metnin yakalanma riskini, karşı tarafın sorabileceği soruları ve o sorulara tutarlı cevapları gösteren; sonucu kaydedip paylaşabildiği mobil öncelikli web uygulaması (PWA).

Araştırma bulgusu (Ekim 2026): bahane üretici araçları çok ve sığ; hiçbirinde **tutarlılık takibi** ve **sorgu provası** yok. Ürünün farkı burada: "metin üretici" değil, **kıvırma asistanı**.

### Tek cümlelik vaat
> "Bir bahane değil, savunulabilir bir hikâye."

---

## 2. Hedef kullanıcı ve kullanım anı

- **Kim:** 18-35, Türkiye, günde birkaç kez mesajlaşan, iş/okul/ilişki trafiğinde sıkışan kişi.
- **Ne zaman:** Karar anında, telefon elinde, 30 saniye içinde metin lazım.
- **Neden tekrar açar:** Yalan Defteri (geçmiş bahaneler + çelişki uyarısı) ve günlük "bugünün bahanesi" akışı.

---

## 3. Kapsam

### v0.1 (bu spec) — Faz 0-3 + Faz 5
- Üretici çekirdeği (form → 3 alternatif)
- Yalan şiddeti 1-10 kaydırıcısı
- Risk değerlendirmesi + sorgu provası
- Yalan Defteri (kaydet, durum işaretle, çelişki uyarısı)
- Paylaşım kartı (1080×1350 PNG)
- Şablon tabanlı üretim (varsayılan) + AI sağlayıcı katmanı (Faz 3'te devreye girer, varsayılan kapalı)

### v0.2 (Faz 4 — şimdi yapılmıyor, yer ayrılıyor)
- Topluluk akışı: paylaşılan bahaneler, oylama, yorum, şikâyet/moderasyon
- Anonim takma ad, liderlik listesi, günlük yarışma

### Kapsam dışı (kalıcı)
- Sahte belge / doktor raporu / resmî izin kâğıdı üretimi
- Gerçek kişileri hedef alan iftira üretimi
- Hesap sistemi, ödeme, reklam (v0.1)

---

## 4. Kullanıcı akışı

### 4.1 Ana ekran (üretici)
Tek sayfa, yukarıdan aşağıya üç blok:

1. **Kime?** — yatay kaydırmalı kart seçici: `patron · sevgili · anne-baba · arkadaş · hoca · müşteri · özel`
2. **Ne oldu?** — hazır durum çipleri (`geç kaldım`, `gidemedim`, `parayı harcadım`, `mesajı görmedim`, `planı bozdum`, `işi yetiştiremedim`) + "kendim yazacağım" alanı (tek satır, 180 karakter)
3. **Nasıl söylenecek?**
   - Kanal: `yüz yüze · telefon · WhatsApp`
   - Ton: `ciddi · esprili · duygusal · resmi`
   - **Yalan şiddeti 1-10** (bkz. §5)
4. Birincil buton: **Üret** (klavye ile de `Enter`)

İlk kullanımda hiçbir alan zorunlu değil; hepsi varsayılanla gelir (`arkadaş · geç kaldım · WhatsApp · ciddi · 5`). Üret butonu her zaman aktif.

### 4.2 Sonuç ekranı
Başlık: "3 alternatif". Her kart:

```
[Strateji etiketi]           [Risk: DÜŞÜK 22/100]
──────────────────────────────────────────────
<üretilen metin — daktilo efektiyle yazılır>

Neden bu risk: "ikinci bir kişiye doğrulanabilir"
               "konum kontrol edilebilir"

▸ Karşı taraf ne sorar (3)
   "Neredeydin?"        → "Annemdeydim, telefonum şarjdaydı."
   ...
──────────────────────────────────────────────
[Kopyala] [WhatsApp] [Defter'e kaydet] [↻ Yeniden]
```

Kart aksiyonları: kopyala (panik yok, toast), WhatsApp (`wa.me` paylaşım metni), kaydet (Defter'e + `status=beklemede`), yeniden üret (aynı girdiler, farklı varyant tohumu).

### 4.3 Yalan Defteri
Liste: metin (2 satır kırpık), kime, ne zaman, durum rozetı (`beklemede · tuttu · tutmadı`).
Üstte **çelişki uyarı bandı** görünür olduğunda: "Bu kişiye son 30 günde 2 bahane söyledin — biriyle çelişiyor."
Satır aksiyonları: durum değiştir, kopyala, sil.

### 4.4 Ayarlar
- AI modu: `kapalı (şablon) · yerel (Ollama) · bulut (OpenRouter)` — varsayılan kapalı
- Varsayılan ton ve şiddet
- Defteri dışa aktar (JSON) / tümünü sil
- Uygulama hakkında + kötüye kullanım uyarısı

---

## 5. Yalan şiddeti (1-10)

Ses açma tuşu gibi çalışan tek kaydırıcı. 10 kademe, her kademede çentik ve hafif titreşim (`navigator.vibrate(8)`, destekleyen cihazlarda).

| Aralık | Etiket | Davranış |
|---|---|---|
| 1-2 | **Beyaz yalan** | Tek cümle, detay yok, düşük risk. "Trafik vardı, kusura bakma." |
| 3-4 | **Küçük bahane** | Tek cümle + bir yumuşatıcı. |
| 5-6 | **Kıvırma** | 2-3 cümle, bir tutarlı detay, bir özür/empati cümlesi. |
| 7-8 | **Cesur** | 3-4 cümle, iki detay, zaman/yer tutarlılığı, karşı soruya hazır cevap. |
| 9-10 | **Senaryo** | Tam hikâye: zaman çizgisi, ikinci kişi, neden-sonuç. Risk göstergesi kırmızıya yakın. |

**Görsel:** ray soldan sağa yeşil→kehribar→kırmızı gradyan; topuz üstünde anlık sayı ve etiket. Altında tek satır açıklama: "Şiddet arttıkça metin uzar, detay çoğalır, yakalanma riski yükselir."
Risk göstergesi kaydırıcı hareket ederken **canlı** güncellenir (henüz metin üretmeden, formülle).

Şiddet, üretim motoruna üç şekilde girer: (a) cümle sayısı hedefi, (b) detay yuvası sayısı, (c) risk taban puanı.

---

## 6. Tasarım dili

- **Tema:** karanlık "sorgu odası" — `#0B0B0D` zemin, kâğıt dokusu (SVG noise, %4 opaklık), tek vurgu kehribar `#E8A33D`, risk için `#3FA45B → #E8A33D → #D64545`.
- **Tipografi:** başlık/gövde `Inter` (variable), risk ve sayısal veri `JetBrains Mono`.
- **Bileşenler:** 14px köşe yarıçapı kartlar, 1px `#FFFFFF14` kenarlık, yumuşak gölge yok (düz, katmanlı his).
- **Hareket:** üretilen metin daktilo efekti (18ms/karakter, `prefers-reduced-motion`'da kapalı), risk çubuğu 300ms genişleme, kart girişinde 60ms arayla yukarı kayma.
- **Yerleşim:** mobil 390px tek kolon; masaüstünde 480px ortalanmış kolon, arka planda sabit grain.
- **Erişilebilirlik:** tüm dokunma hedefleri ≥44px, kaydırıcı klavye ile (`←/→`, `Home/End`), kontrast AA.

---

## 7. Mimari

### 7.1 Süreç ve klasörler
Tek Node süreci: Fastify hem `/api/*` hem derlenmiş SPA'yı servis eder.

```
yalan-makinasi/
├─ src/
│  ├─ shared/          # zod şemaları + tipler (server & web ortak)
│  ├─ engine/
│  │  ├─ templates/tr/ # durum × hedef bankaları, ton varyantları
│  │  ├─ compose.ts    # strateji seçimi + cümle birleştirme
│  │  ├─ risk.ts       # deterministik risk formülü
│  │  ├─ queries.ts    # sorgu provası (metinle tutarlı)
│  │  └─ providers/    # template.ts | ollama.ts | openrouter.ts + index.ts
│  ├─ server/
│  │  ├─ app.ts        # fastify kurulumu, rotalar, rate limit
│  │  ├─ db.ts         # better-sqlite3 + schema.sql uygulama
│  │  └─ routes/
│  └─ web/
│     ├─ src/screens/  # Generator, Result, Ledger, Settings
│     ├─ src/components/
│     └─ src/lib/      # api istemcisi, deviceId, i18n metinleri
├─ data/yalan.db
├─ docs/superpowers/specs/
└─ package.json        # npm workspaces: web ayrı, kök server
```

### 7.2 Ortam
- Node 26, TypeScript 5.x, Vite 7, React 19, Tailwind 4, Fastify 5, better-sqlite3, zod.
- `npm run dev`: Vite (5173) + server (8787, `--watch`), Vite proxy `/api`.
- `npm run build && npm start`: tek süreç, 8787.
- Test: Vitest (`engine` birim, `server` `inject`).

### 7.3 Yapılandırma (env)
`PORT`, `DB_PATH`, `AI_MODE=off|ollama|openrouter`, `OLLAMA_URL`, `OLLAMA_MODEL`, `OPENROUTER_KEY`, `OPENROUTER_MODEL`, `RATE_LIMIT_PER_MIN=20`.

---

## 8. Veri modeli (SQLite)

```sql
CREATE TABLE lies (
  id            TEXT PRIMARY KEY,           -- nanoid
  device_id     TEXT NOT NULL,
  target        TEXT NOT NULL,              -- patron|sevgili|...
  situation     TEXT NOT NULL,              -- çip kimliği veya serbest metin
  situation_custom TEXT,
  channel       TEXT NOT NULL,              -- yuz_yuze|telefon|whatsapp
  style         TEXT NOT NULL,              -- ciddi|esprili|duygusal|resmi
  intensity     INTEGER NOT NULL,           -- 1-10
  text          TEXT NOT NULL,
  strategy      TEXT NOT NULL,              -- sade|detayli|duygusal
  risk_score    INTEGER NOT NULL,           -- 0-100
  risk_reasons  TEXT NOT NULL,              -- JSON dizi
  queries       TEXT NOT NULL,              -- JSON [{q,a}]
  provider      TEXT NOT NULL,              -- template|ollama|openrouter
  status        TEXT NOT NULL DEFAULT 'beklemede',  -- beklemede|tuttu|tutmadı
  shared        INTEGER NOT NULL DEFAULT 0, -- Faz 4 için hazır
  created_at    INTEGER NOT NULL            -- unix ms
);
CREATE INDEX idx_lies_device ON lies(device_id, created_at DESC);
CREATE INDEX idx_lies_target ON lies(device_id, target, created_at DESC);

CREATE TABLE schema_version (version INTEGER NOT NULL);
```

Kurallar:
- `device_id`: localStorage'da üretilen UUID; sunucuda başka kimlik tutulmaz, IP loglanmaz.
- Silme: `DELETE /api/lies/:id`; ayarlardan "tümünü sil" cihazın tüm kayıtlarını siler (KVKK).
- Faz 4'te `votes(lie_id, device_id, value)`, `comments`, `reports` eklenir; `lies.shared` ve `lies.id` paylaşım kimliği olarak yeterli.

---

## 9. API sözleşmesi

Tümü JSON. Hata gövdesi: `{ error: { code, message } }`.

| Metot | Yol | Gövde / sorgu | Yanıt |
|---|---|---|---|
| `GET` | `/api/health` | — | `{ ok, aiMode, version }` |
| `POST` | `/api/generate` | `{ target, situation, situationCustom?, channel, style, intensity, count? }` | `{ variants: Variant[] }` |
| `POST` | `/api/lies` | `{ variant, form }` | `{ id, createdAt }` |
| `GET` | `/api/lies` | `?limit=50` | `{ items: SavedLie[] }` |
| `PATCH` | `/api/lies/:id` | `{ status }` | `{ ok: true }` |
| `DELETE` | `/api/lies/:id` | — | `{ ok: true }` |
| `GET` | `/api/lies/conflicts` | `?target=sevgili` | `{ conflicts: [{ lieId, createdAt, text, overlap }] }` |
| `GET` | `/api/conflicts/preview` | `?target&situation` | formül tabanlı ön risk (kayıtsız) |

`Variant` = `{ text, strategy, riskScore, riskLevel, riskReasons[], queries[{q,a}] }`.
`riskLevel`: `düşük <35`, `orta 35-64`, `yüksek ≥65`.

Kurallar: `device_id` `X-Device-Id` başlığında. Rate limit IP+dilekçe başına dakikada 20 üretim (429 + `Retry-After`).

---

## 10. Motor tasarımı

### 10.1 Şablon bankası
`templates/tr/` altında durum bazlı bankalar. Her banka, JSON biçiminde:

```ts
type Bank = {
  id: string;                       // 'gec_kaldim'
  openings: { style: Style[]; text: string }[];   // ton duyarlı açılış
  details: { tag: string; text: string }[];       // 'ulasim' | 'saglik' | 'aile' | 'is'
  closers: { style: Style[]; text: string }[];    // özür/empati/resmiyet
  queries: { q: string; tag: string }[];          // cevabı details etiketinden gelir
};
```

### 10.2 Birleştirme
Üç strateji her zaman üretilir (kullanıcı farklı tatlar görsün):
- **sade:** açılış + kapanış (şiddet 1-4'te detay yok)
- **detaylı:** açılış + N detay + kapanış
- **duygusal:** açılış + empati kapanışı + bir detay

`N` (detay sayısı) = `min(3, floor(intensity / 3))`. Cümle sayısı hedefi = `1 + N + 1`.
Detay seçimi deterministiktir: `hash(deviceId + situation + intensity + strategy + salt)` → PRNG (mulberry32). Aynı girdi + aynı tohum = aynı çıktı (test edilebilir). "Yeniden üret" farklı `salt` gönderir.

### 10.3 Risk formülü (deterministik)
```
base        = intensity * 3                        // 3-30
targetW     = { patron:25, musteri:25, sevgili:20, hoca:20, anne:15, arkadas:10, ozel:15 }
channelW    = { yuz_yuze:15, telefon:10, whatsapp:5 }
detailW     = N * 5                               // her detay +5
checkFlags  = +15 ikinci kişi geçiyorsa, +15 konum, +20 belge/resmî kayıt
conflictW   = min(20, conflicts * 10)
score       = min(100, base + targetW + channelW + detailW + checkFlags + conflictW)
```
`riskReasons` insan diline çevrilir: "konum kontrol edilebilir", "ikinci bir kişiye doğrulanabilir", "bu kişiye son 30 günde 2 bahane söyledin".

### 10.4 Sorgu provası tutarlılığı
Sorular `Bank.queries` içinden seçilir; **cevaplar seçilen detayların etiketlerinden türetilir** — böylece "Neredeydin?" sorusunun cevabı metindeki detayla çelişmez. Detayı olmayan soru sorulmaz. Bu, ürünün asıl teknik farkıdır ve birim testlerle korunur.

### 10.5 Çelişki tespiti
Aynı `target` için son 30 günün kayıtları; her yeni üretimde `situation` etiketi ve detay etiketleri kesişimi hesaplanır. Kesişim varsa `conflicts` döner ve risk puanına eklenir. Metin benzerliği (token overlap ≥2 anlamlı kelime) yeterli — embedding yok.

---

## 11. AI katmanı

```ts
interface LlmProvider {
  id: 'template' | 'ollama' | 'openrouter';
  generate(req: GenerateRequest): Promise<Variant[]>;
}
```

- **template:** her zaman çalışır, ağ yok, <50ms. Varsayılan.
- **ollama:** OpenAI-uyumlu `/v1/chat/completions`, `OLLAMA_URL` (Everything VM, 3090). Model: `qwen2.5:14b-instruct-q4_K_M` (Türkçe kalitesi Llama-3.1-8B'den belirgin iyi; 24GB VRAM'e sığar). `response_format: json_object` + zod doğrulama.
- **openrouter:** aynı istemci, farklı base URL/anahtar. Geliştirme ve yedek.

Davranış: AI seçiliyse önce LLM denenir; 6 sn timeout, tek deneme, zod hatası veya ağ hatasında **sessizce şablona düşer** (`provider` alanı gerçekte kullanılanı yazar). Kullanıcıya hata gösterilmez; Ayarlar'da son sağlayıcı durumu görünür.

İstem (prompt) kuralları: yalnızca verilen `target/situation/channel/style/intensity` sınırında üret; resmî belge/sağlık raporu/suç içeren içerik üretme; 3 varyant + risk + sorgu cevapları JSON döndür.

**Altyapı notu (bilinen engel):** Everything VM'de şu an SSH (:22) ve Ollama (:11434) dışarıdan kapalı, GPU'nun ~10GB'ını ComfyUI tutuyor. Faz 3'te port açılışı + VRAM paylaşımı (ComfyUI'yi durdurup başlatma veya modeli 7B'ye düşürme) yapılacak.

---

## 12. Kötüye kullanım, hukuk, gizlilik

- **Engel listesi (sunucu tarafı, üretim öncesi):** "doktor raporu", "sağlık raporu", "resmî belge", "izin kâğıdı", "imza", "fatura", "ehliyet", "savcılık", "mahkeme" vb. → `400 ABUSE_BLOCKED` + açıklayıcı mesaj.
- **Uyarı:** ana ekran altında tek satır: "Bu uygulama eğlence amaçlıdır. Resmî belge veya sağlık raporu üretmez."
- **Veri:** hesap yok, e-posta yok; `device_id` dışında kimlik yok, IP loglanmaz. Defter silinebilir, dışa aktarılabilir.
- **KVKK:** aydınlatma metni Ayarlar içinde; saklama süresi sınırsız ama kullanıcı siler = kalıcı silinir.
- **Yaş:** 18+ uyarısı, mağaza dağıtımı yoksa zorunlu yaş kapısı yok.
- **Risk:** hukuki danışmanlık değildir; iftira/tehdit amaçlı kullanım kullanım koşullarında yasaklanır.

---

## 13. Test stratejisi

| Katman | Araç | Kapsam |
|---|---|---|
| Motor | Vitest | Şablon birleştirme determinizmi (aynı tohum = aynı çıktı), şiddet→uzunluk eşlemesi, risk formülü sınır değerleri, sorgu-cevap tutarlılığı (cevap metinde geçen detayla uyumlu) |
| API | Vitest + `fastify.inject` | Şema doğrulama, 400/429, kayıt/güncelleme/silme, çelişki ucu, abuse block |
| UI | Vitest + Testing Library | Form durumu, şiddet kaydırıcısı klavye erişimi, sonuç kartı render |
| E2E (elle) | tarayıcı | Üret → kaydet → Defter'de gör → çelişki uyarısı |

Kabul eşiği: motor ve API testleri %100 geçer; hiçbir üretim yolu ağ olmadan çalışır.

---

## 14. Fazlar ve başarı ölçütleri

| Faz | Çıktı | Kabul ölçütü |
|---|---|---|
| 0 | İskelet: repo, Vite+Fastify+SQLite, `/api/health`, tema | `npm run dev` açılır, health 200, boş ekran değil |
| 1 | Üretici: form + şablon motoru + risk + sorgu provası | Aynı girdi → 3 farklı strateji, risk 0-100, cevaplar tutarlı; motor testleri yeşil |
| 2 | Defter + paylaşım kartı | Kaydet/gör/durum/sil çalışır; çelişki bandı doğru; 1080×1350 PNG iner |
| 3 | AI katmanı | Ollama açıkken `provider=ollama`, kapalıyken sessiz fallback; kullanıcı hata görmez |
| 4 | Topluluk (ayrı spec) | — |
| 5 | Yayın | VM'de `/yalan/`, PWA kurulabilir, KVKK metni |

**Ölçüm (yayından sonra 30 gün):** 100 tekil cihaz · ilk oturumda üretim yapan oran >%70 · 7 gün geri dönüş >%15 · paylaşım/kaydet oranı >%25.

---

## 15. Açık sorular

1. **Marka adı:** "Yalan Makinası" çalışma adı; mağaza dağıtımı düşünülürse isim değişebilir (v0.1'i etkilemez).
2. **Yerel model:** Qwen2.5-14B mi, 7B mi? Faz 3'te VM'de ölçülecek (Türkçe kalite/gecikme dengesi).
3. **Paylaşım kartında marka görünürlüğü:** v0.1'de küçük alt yazı; Faz 4'te viral mekanik tasarlanacak.
