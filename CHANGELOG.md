# Sürüm geçmişi

## v0.4.0 — 15 Kasım 2026

**Yeni akış**
- Üretime basınca tam ekran yüklenme sahnesi: dönen damga, "bahane bulunuyor → detaylar uyduruluyor → risk hesaplanıyor" adımları, ilerleme çubuğu.
- Üç alternatif artık kaydırmalı destede: oklar, noktalar ve parmakla kaydırma.
- Seçilen kart tam ekran açılıyor: büyük metin, risk çubuğu, soru provası, Kopyala · WhatsApp · Defter'e kaydet · Kart indir · Başka üret · Kartlara dön.
- `VariantCard` kaldırıldı; `GeneratingScreen`, `VariantDeck`, `VariantDetail` eklendi.

**Yapay zekâ**
- opencode-go (`https://opencode.ai/zen/go/v1`) + `deepseek-v4.1-flash` beyni; `x-opencode-session` başlığı, kapatılmış reasoning, 60 sn timeout.
- Sunucu modunda da AI önceliği (öncesinde web'de şablon dönüyordu).
- Şiddet bantlı, insan dili odaklı yeni sistem promptu (`buildSystemPrompt`).

## v0.3.0 — 15 Kasım 2026

- AI ayarları kullanıcıdan gizlendi; anahtar derleme zamanında gömülüyor.
- Modeller için oturum başlığı ve JSON modu geri düşüşü.

## v0.2.1 — 8 Kasım 2026

- AI hazır ayarları (opencode-go / yerel VM), kod bloğu temizliği, dayanıklı hata yönetimi.

## v0.2.0 — 8 Kasım 2026

- AI öncelikli üretim, Ayarlar'da sunucu testi, VM kurulum betiği, cleartext ağ izni.

## v0.1.0 — 4 Kasım 2026

- İlk sürüm: üç adımlı üretici, deterministik şablon motoru, risk formülü, soru provası, Yalan Defteri, paylaşım kartı, Teq Studio açılış ekranı, Capacitor Android paketi.
