## v0.8.0 — 18 Kasım 2026

- **İki dilli kullanım:** ilk açılışta dil seçimi ekranı (`LanguagePicker`), seçim `localStorage`'da tutulur ve bir daha sorulmaz; Ayarlar'dan değiştirilebilir.
- `i18n.ts` sözlüğü (TR/EN) + `LangProvider`/`useI18n`; tab bar, üretici, deste, detay, defter, profil düzenleyici, ayarlar ve yüklenme ekranı tamamen çevrildi.
- Yapay zekâ artık seçilen dilde üretiyor: `buildSystemPrompt(intensity, { lang })` ve `buildAnswerPrompt({ lang })` İngilizce kural + örnek + bant direktifleriyle; `GenerateRequest.lang` API'ye taşınıyor.
- Çevrimdışı şablon motoruna İngilizce yedek metinler; ay adları ve tarih biçimi dile göre.
- Gizlilik politikasının İngilizcesi (`docs/en.html`) yayımlandı.
- 148/148 test.

# Sürüm geçmişi

## v0.7.0 — 18 Kasım 2026

**Kişi profili + kişiye göre hitap, akış düzeltmeleri.**

- **Kişi profili (Defter → kişi → Profil):** ilişki, cinsiyet, samimiyet (1-10), serbest notlar.
  Yapay zekâ hitabı ve sen/siz tercihini bu profile göre yapıyor ("Ateş bey", "Ayşe abla", "aşkım"…).
- **"Nasıl bir yalan olsun?"**: üretim ekranına opsiyonel yönlendirme alanı (ör. "ailevi bir mazeret olsun").
- **Yalan şiddeti kaldırıldı:** doz sabit (6/10); ibre kullanıcıdan istenmiyor.
- **Kimin için?** yazarken çirkin tarayıcı listesi yerine tasarımlı öneri kartları (avatar, kayıt sayısı, samimiyet).
- **Deste düzenleme:** kalem yerine "✎ Düzenle" düğmesi, otomatik odak, metnin istenen kısmı değiştirilebiliyor.
- **Detay:** balon etiketi artık kişinin adı ("Ayşe · neden gelmedin"), başlıklar "seçtiğin bahane" ve
  "Karşı taraf ne sorar | Hazır Cevaplar".
- **WhatsApp:** wa.me sayfası yerine cihazın paylaşım sayfası / `whatsapp://` — kişiyi seçip doğrudan gönderim
  (`@capacitor/share` eklendi).
- **Sekme durumu korunuyor:** üretim sürerken Defter'e geçilebiliyor; dönünce sonuç kaybolmuyor.
- **Ayarlar:** "Şablon motoru / yapay zekâ" bölümü ve varsayılan şiddet alanı kaldırıldı.
- Test sayısı 131 → 137 (profil promptu, profil uçları, öneri alanı, şiddetin sabitlenmesi).

## v0.6.0 — 17 Kasım 2026

**Üretim ekranı tek ekrana indi, akış sadeleşti.**

- **Form:** "Kimin için?" kutusunun altında dört hızlı seçenek (Anne-baba / Arkadaş / Patron / Sevgili).
  "Ne oldu?" artık hazır çipler değil, serbest metin. Ton/kanal katlanır bölümde kaldı.
- **İbre:** 1-10 yalan şiddeti yarım daire gösterge + sürüklenebilir ibre (sağa çek → artar, sola → azalır,
  klavye ile de ayarlanır). Sayfa kaydırmıyor.
- **Yüklenme metinleri:** durum değerlendiriliyor → olasılıklar hesaplanıyor → yalan üretiliyor → mum tekrar yakıldı.
- **Deste:** ilk açılışta kaydırma öğreticisi (bir kez gösterilir), kart üzerinde kalemle **düzenleme**.
- **Tam ekran:** seçilen yalan en üstte; "karşı taraf ne sorar" WhatsApp tarzı balonlarla (solda gri soru,
  sağda yeşil cevap, "karşı taraf"/"sen" etiketli). Altta yuvarlak eylem çubuğu: WhatsApp, Instagram/paylaş,
  **Defter'e kaydet**, yenile, kopyala.
- Test sayısı 124 → 131 (ibre klavye/sınır, öğretici, düzenleme, balonlar, eylem çubuğu).

## v0.5.0 — 17 Kasım 2026

**Ürün odağı değişti: bahane üretici → yalan defteri.** Slogan: "Yalancının mumu artık hep yanacak."

- **Defter açılış ekranı:** kişiye göre gruplu kayıtlar (ad, kayıt sayısı, çelişki işareti), kişi/metin arama.
- **Manuel kayıt:** kendi yalanını yaz — kişi, metin, durum, kanal. Yapay zekâya hiç gitmez.
- **"Ne diyeyim?"**: kayıtlı bir yalanın ardından gelen soruya, metinle çelişmeyen cevap (AI; erişilemezse soru provasından şablon cevap).
- **Geçmişi hatırlayan AI:** üretimde aynı kişiye son 5 kayıt prompta eklenir; "aynı bahaneyi tekrar etme, ayrıntıları çelişme" talimatı verilir.
- **Tekrar uyarısı:** üretimden önce "bu kişiye son 30 günde N kayıt var / aynı durumu N kez söyledin" uyarısı.
- **Veri modeli:** `lies.person` + `lies.source` kolonları; eski veritabanları açılışta otomatik ve kayıpsız yükseltilir.
- **Yeni uçlar:** `GET /api/lies/people`, `GET /api/lies/person/:ad`, `POST /api/lies/manual`.
- Test sayısı 116 → 124 (göç, geçmiş enjeksiyonu, "ne diyeyim" şablonu, defter akışı).

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