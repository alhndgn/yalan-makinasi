# Yalan Makinası

Bir bahane değil, savunulabilir bir hikâye. Bağlama göre üç alternatif bahane üretir; her metnin
yakalanma riskini, karşı tarafın sorabileceği soruları ve o sorulara **metinle çelişmeyen** cevapları
gösterir. Sonuçlar Yalan Defteri'ne kaydedilir, çelişkiler uyarılır.

- Spec: `docs/superpowers/specs/2026-11-04-yalan-makinasi-design.md`
- Plan: `docs/superpowers/plans/2026-11-04-yalan-makinasi-v0.1.md`

## Çalıştırma

```bash
npm install
npm run build      # arayüzü derler (src/web/dist)
npm start          # http://127.0.0.1:8787 (API + arayüz tek süreç)
```

Geliştirme: `npm run dev:api` (8787, `node --watch`) + ayrı terminalde `npm run dev:web` (5173, proxy).

Ortam değişkenleri için `.env.example` (PORT, DB_PATH, AI_MODE, OLLAMA_URL, OLLAMA_MODEL, OPENROUTER_KEY).

## Test

```bash
npm test           # 61 test: motor, API, arayüz
```

## Mimari

| Katman | Yer | Not |
|---|---|---|
| Motor | `src/engine/` | Şablon bankası (7 durum), deterministik birleştirici, risk formülü, sorgu provası, AI sağlayıcıları |
| API | `src/server/` | Fastify + `node:sqlite` (tek dosya), hız sınırı, kötüye kullanım freni |
| Arayüz | `src/web/` | React 19 + Vite + Tailwind 4, PWA |
| Ortak | `src/shared/` | zod şemaları ve sabitler |

Üretim varsayılan olarak **şablon motorunda** çalışır (ağ yok, <50 ms). `AI_MODE=ollama|openrouter`
seçilirse önce model denenir; model hata verirse sessizce şablona dönülür.

## Telefon (APK)

İki mod var; aynı arayüz, aynı motor:

| Mod | Veri | Kullanım |
|---|---|---|
| `server` (varsayılan) | Fastify + SQLite, tarayıcıdan | `npm run build && npm start` |
| `local` (`VITE_LOCAL_ENGINE=1`) | Tarayıcı içi motor + `localStorage` | APK / çevrimdışı |

```bash
bash scripts/build-apk.sh      # web (local mod) + cap sync + gradle assembleDebug
# çıktı: android/app/build/outputs/apk/debug/app-debug.apk
```

- APK internet gerektirmez; kayıtlar cihazda (`localStorage`, `ym_lies_v1`).
- Bu bir **debug** APK'dır: telefona elle kurulur (bilinmeyen kaynak izni). Play Store için imzalı
  release build + keystore gerekir (`android/keystore.properties` + `bundleRelease`).
- Android projesini güncelledikten sonra: `npx cap sync android`.

## Açılış ekranı (Teq Studio ortak iskelet)

`src/web/src/components/TeqSplash.tsx` — her uygulama kendi adı, vaadi, logosu ve vurgu rengiyle kullanır;
“Developed by Teq Studio” imzası köşede sabittir. Logo ayrı bileşen (`YalanMark.tsx`).

```tsx
<TeqSplash appName="Yalan Makinası" tagline="…" accent="#A83A30" mark={<YalanMark />} onDone={…} />
```

- Soğuk açılışta ~1,2 sn, ardından 400 ms kararma; `sessionStorage` ile oturum başına bir kez.
- `prefers-reduced-motion` açıksa animasyonsuz, 260 ms.
- Tasarım incelemesi: `?splash=hold` ekranı ekranda tutar.
- Android tarafında `AppTheme.NoActionBarLaunch` zemini `@color/splashPaper` (#ECE5D7) — beyaz flaş yok.

## AI sunucusu (Everything VM)

Uygulama **AI öncelikli** çalışır: Ayarlar → AI sunucusu doldurulmuşsa önce AI denenir, ulaşılamazsa
sessizce şablon motoruna düşer (kullanıcı hata görmez).

Kurulum (VM'de root): `bash deploy/everything-ai-setup.sh`
- Ollama `0.0.0.0:11434`'e dinler, `OLLAMA_ORIGINS=*`
- nginx `http://192.168.1.12/ai/` → Ollama (CORS + uzun timeout)
- Model: `qwen2.5:14b-instruct-q4_K_M` (3090'da ~9 GB VRAM; ComfyUI açıkken sığmaz)
- ufw varsa yalnız LAN'a (`192.168.1.0/24`) 80 ve 11434 açılır

Uygulamada: **Ayarlar → AI sunucusu** → adres `http://192.168.1.12/ai/v1`, model adı, (varsa) anahtar →
**Bağlantıyı test et**. Android tarafında bu IP için cleartext HTTP izni `network_security_config.xml`'de.

## Durum

- v0.1 tamam: üretici, şiddet kaydırıcısı, risk + sorgu provası, Yalan Defteri + çelişki uyarısı,
  paylaşım kartı (1080×1350), ayarlar/KVKK, PWA.
- v0.2 (Faz 4): topluluk akışı, oylama, yorum, moderasyon — henüz yok.
