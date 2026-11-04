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

## Durum

- v0.1 tamam: üretici, şiddet kaydırıcısı, risk + sorgu provası, Yalan Defteri + çelişki uyarısı,
  paylaşım kartı (1080×1350), ayarlar/KVKK, PWA.
- v0.2 (Faz 4): topluluk akışı, oylama, yorum, moderasyon — henüz yok.
