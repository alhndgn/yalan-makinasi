import { CHANNELS, SITUATIONS, STYLES, TARGETS } from '../../../shared/constants.ts';

export type Lang = 'tr' | 'en';

type Dict = Record<string, string>;

const tr: Dict = {
  'app.name': 'Yalan Makinası',
  'app.slogan': 'Yalancının mumu artık hep yanacak.',
  'tab.ledger': 'Defter',
  'tab.generate': 'Üret',
  'tab.settings': 'Ayarlar',

  // dil seçimi
  'lang.title': 'Dil / Language',
  'lang.subtitle': 'Uygulamayı hangi dilde kullanacaksın?',
  'lang.tr': 'Türkçe',
  'lang.en': 'English',
  'lang.hint': 'Sonradan Ayarlar’dan değiştirebilirsin.',

  // üretim formu
  'gen.brand': 'Yalan Makinası',
  'gen.tone': 'Ton · Kanal',
  'gen.who': 'Kimin için?',
  'gen.whoPlaceholder': 'İsim yaz — ör. Ayşe, patron Mehmet',
  'gen.whoAria': 'Kayıtlı kişiler',
  'gen.records': 'kayıt',
  'gen.closeness': 'samimiyet',
  'gen.what': 'Ne oldu?',
  'gen.whatPlaceholder': 'Kendi cümlelerinle yaz: dün akşam iş çıktı, gelemedim…',
  'gen.hint': 'Nasıl bir yalan olsun?',
  'gen.hintOptional': 'opsiyonel',
  'gen.hintPlaceholder': 'ör. ailevi bir mazeret olsun, biraz duygusal',
  'gen.channel': 'Kanal',
  'gen.style': 'Ton',
  'gen.cta': 'Üret',
  'gen.ctaCount': '3 alternatif',
  'gen.errRate': 'Biraz bekle, çok hızlı üretiyorsun.',
  'gen.errAbuse': 'Bu tür bir metin üretemem (belge, rapor, resmî kayıt).',
  'gen.errGeneric': 'Bir şeyler ters gitti, tekrar dene.',
  'gen.repeatSame': '{person} kişisine son {days} günde {count} kez "{situation}" dedin. Aynı bahaneyi tekrar kullanmak riski artırır.',
  'gen.repeatAny': '{person} kişisine son {days} günde {count} kayıt var. Yeni metin eskilerle çelişmesin; ayrıntıları (yer, saat, tanık) tekrar etme.',

  // yüklenme
  'load.1': 'durum değerlendiriliyor',
  'load.2': 'olasılıklar hesaplanıyor',
  'load.3': 'yalan üretiliyor',
  'load.4': 'mum tekrar yakıldı',
  'load.hint': '10-15 saniye sürebilir, kapatma',

  // deste
  'deck.kicker': '3 alternatif',
  'deck.prev': 'Önceki alternatif',
  'deck.next': 'Sonraki alternatif',
  'deck.use': 'Bunu kullan',
  'deck.back': '‹ Formu değiştir',
  'deck.edit': 'Düzenle',
  'deck.editAria': 'Yalanı düzenle',
  'deck.editHint': 'İstediğin kısmını değiştir — gerisi olduğu gibi kalır.',
  'deck.cancel': 'Vazgeç',
  'deck.save': 'Kaydet',
  'deck.editLabel': 'Yalan metni',
  'deck.queries': 'karşı taraf {count} soru sorabilir',
  'deck.noQueries': 'soru provası yok',
  'deck.tutorialTitle': 'Sağa kaydır',
  'deck.tutorialBody': 'Üç yalan hazırladık. Parmağını sağa kaydırıp diğerlerini görebilirsin — beğenmediğini kalemle düzenle.',
  'deck.tutorialOk': 'Anladım',

  // detay
  'detail.picked': 'seçtiğin bahane',
  'detail.risk': 'risk',
  'detail.questions': 'Karşı taraf ne sorar',
  'detail.answers': 'Hazır Cevaplar',
  'detail.you': 'sen',
  'detail.them': 'karşı taraf',
  'detail.copied': 'Kopyalandı',
  'detail.copyFailed': 'Kopyalanamadı',
  'detail.wa': 'WhatsApp’ta paylaş',
  'detail.share': 'Diğer uygulamalarda paylaş',
  'detail.save': 'Deftere kaydet',
  'detail.refresh': 'Yenile',
  'detail.copy': 'Metni kopyala',
  'detail.back': 'Kartlara dön',

  // risk / strateji
  'risk.dusuk': 'düşük',
  'risk.orta': 'orta',
  'risk.yuksek': 'yüksek',
  'strategy.sade': 'Sade',
  'strategy.detayli': 'Detaylı',
  'strategy.duygusal': 'Duygusal',

  // defter
  'ledger.title': 'Yalan Defteri',
  'ledger.add': '+ Kaydet',
  'ledger.heading': 'Kime ne dedin?',
  'ledger.search': 'Kişi ya da metin ara',
  'ledger.searchAria': 'Defterde ara',
  'ledger.emptyTitle': 'Defter boş',
  'ledger.emptyBody': 'İlk yalanını kaydet: kime ne söylediğini yaz; bir dahaki sefere geçmişi hatırlayalım.',
  'ledger.emptyAction': 'Yalan kaydet',
  'ledger.noResult': 'Sonuç yok',
  'ledger.noResultBody': 'Bu aramaya uyan kişi ya da kayıt yok.',
  'ledger.unnamed': 'İsimsiz',
  'ledger.back': 'Deftere dön',
  'ledger.profile': 'Profil',
  'ledger.addShort': '+ Ekle',
  'ledger.noneForPerson': 'Bu kişiye kayıtlı bir şey yok.',
  'ledger.changeStatus': 'değiştir',
  'ledger.sourceAi': 'yapay zekâ önerisi',
  'ledger.sourceManual': 'kendi yazdığın',
  'ledger.askTitle': 'Ne diyeyim?',
  'ledger.askBody': 'Karşı taraf bir soru sorduysa yaz; söylediğin yalanla çelişmeyen bir cevap hazırlayalım.',
  'ledger.askPlaceholder': 'Örn: kiminleydin?',
  'ledger.askCta': 'Cevap hazırla',
  'ledger.asking': 'Düşünüyor…',
  'ledger.copy': 'Kopyala',
  'ledger.copyLie': '⧉ Yalanı kopyala',
  'ledger.cycle': '↻ Durumu değiştir',
  'ledger.delete': 'Sil',
  'ledger.deleteConfirm': 'Eminim, sil',
  'ledger.loading': 'Yükleniyor…',
  'ledger.added': 'Deftere eklendi.',
  'common.undo': 'geri al',
  'ledger.deleted': 'Kayıt silindi.',
  'ledger.saveFailed': 'Kaydedilemedi, tekrar dene.',
  'ledger.statusFailed': 'Durum güncellenemedi.',
  'ledger.copyFailed': 'Kopyalanamadı.',
  'ledger.copied': 'Kopyalandı.',
  'ledger.answerCopied': 'Cevap kopyalandı.',
  'ledger.profileSaved': 'Profil kaydedildi.',

  // yeni kayıt
  'new.title': 'Yalan kaydet',
  'new.intro': 'Kime ne söylediğini yaz. Bir dahaki sefere bunu hatırlarız.',
  'new.who': 'Kime?',
  'new.whoPlaceholder': 'Ayşe, patron Mehmet…',
  'new.text': 'Ne söyledin?',
  'new.textPlaceholder': 'Dün akşam trafik vardı, o yüzden gelemedim.',
  'new.channel': 'Kanal',
  'new.situation': 'Hangi durum',
  'new.kind': 'Kimin için',
  'new.cta': 'Deftere ekle',
  'new.saving': 'Kaydediliyor…',
  'new.back': 'Vazgeç',

  // profil
  'profile.intro': 'Bu bilgiler yapay zekânın hitabını ve üslubunu belirler: kime nasıl konuşacağını, ne kadar samimi olacağını.',
  'profile.relation': 'İlişki',
  'profile.gender': 'Cinsiyet',
  'profile.genderWoman': 'Kadın',
  'profile.genderMan': 'Erkek',
  'profile.genderNone': 'Belirtme',
  'profile.closeness': 'Aramızdaki samimiyet',
  'profile.closenessAria': 'Samimiyet',
  'profile.close1': 'mesafeli · resmî konuşuruz',
  'profile.close2': 'tanıdık · laubali değil',
  'profile.close3': 'samimi · rahat konuşuruz',
  'profile.close4': 'çok samimi · her şeyi konuşuruz',
  'profile.notes': 'Aklında tutması gerekenler',
  'profile.notesPlaceholder': 'ör. öğretmen, konum paylaşıyor, akşamları müsait değil',
  'profile.save': 'Profili kaydet',
  'profile.saving': 'Kaydediliyor…',
  'profile.back': 'Kişiye dön',

  // durumlar
  'status.changed': 'Durum',
  'status.beklemede': 'beklemede',
  'status.tuttu': 'tuttu',
  'status.tutmadı': 'tutmadı',

  // ayarlar
  'settings.title': 'Ayarlar',
  'settings.subtitle': 'Dil, varsayılanlar ve verilerin.',
  'settings.language': 'Dil',
  'settings.defaultStyle': 'Varsayılan ton',
  'settings.data': 'Verilerim',
  'settings.export': 'Defteri dışa aktar (JSON)',
  'settings.deleteAll': 'Tüm kayıtları sil',
  'settings.confirmDelete': 'Defterdeki tüm kayıtlar silinecek. Emin misin?',
  'settings.deleted': '{count} kayıt silindi.',
  'settings.deleteFailed': 'Silme başarısız.',
  'settings.exported': '{count} kayıt dışa aktarıldı.',
  'settings.exportFailed': 'Dışa aktarma başarısız.',
  'settings.legalTitle': 'KVKK ve kullanım',
  'settings.legal1': 'Bu uygulama eğlence amaçlıdır. Resmî belge, sağlık raporu veya imza içeren içerik üretmez. Hesap açılmaz; cihazında üretilen rastgele bir kimlik dışında kimlik bilgisi toplanmaz, IP adresi kaydedilmez. Kayıtlarını istediğin an silebilir veya dışa aktarabilirsin. Veriler yalnızca bu uygulamanın sunucusunda saklanır; üçüncü taraflarla paylaşılmaz.',
  'settings.legal2': 'Uygulama hukuki danışmanlık vermez. Başkalarına zarar vermek, iftira atmak veya dolandırıcılık amacıyla kullanılamaz.',
  'settings.back': '← Üreticiye dön',


  // defter: yeni görünümler (v0.9)
  'ledger.people': 'Kişiler',
  'ledger.calendar': 'Takvim',
  'ledger.streak': '{days} gün üst üste',
  'ledger.streakZero': 'bugün henüz kayıt yok',
  'ledger.reminder': '{count} kaydın 2 gündür beklemede — akıbetini işaretle',
  'ledger.reminderOne': 'Bir kaydın 2 gündür beklemede — akıbetini işaretle',
  'ledger.conflictCount': '{count} çelişki',
  'ledger.conflictStrip': 'Bu kişide çelişki var',
  'ledger.conflictStripHint': 'Aynı kişiye söylediğin kayıtlar birbirini tutmuyor',

  // karne
  'score.held': 'tutma oranı',
  'score.total': 'kayıt',
  'score.kept': 'tuttu',
  'score.failed': 'tutmadı',
  'score.pending': 'beklemede',
  'score.top': 'en sık',

  // çelişkiler
  'conflict.intro': 'Aşağıdaki kayıtlar birbirini tutmuyor. İkisine de dokunup okuyabilirsin; hangisinin geçerli olduğuna sen karar ver.',
  'conflict.none': 'Bu kişide çelişki yok.',
  'conflict.count': 'çelişki',
  'conflict.kind.repeat': 'aynı mazeret',
  'conflict.kind.similar': 'aynı cümle',
  'conflict.kind.same_day': 'aynı gün',
  'conflict.kind.detail': 'zıt ayrıntı',
  'conflict.sev.low': 'hafif',
  'conflict.sev.medium': 'dikkat',
  'conflict.sev.high': 'ciddi',
  'conflict.why.repeat': 'İki hafta içinde aynı mazereti ikinci kez kullandın. Karşı taraf fark ederse açıklaması zor.',
  'conflict.why.similar': 'İki metin neredeyse aynı cümlelerle yazılmış; ezberlenmiş gibi duruyor.',
  'conflict.why.same_day': 'Aynı gün iki farklı mazeret söylemişsin. İkisi de aynı kişide duruyor.',
  'conflict.why.detail': 'Bir kayıtta "{a}", diğerinde "{b}" geçiyor; ikisi aynı anda doğru olamaz.',

  // takvim
  'calendar.legend': 'Son 30 gün. Koyu kare = o gün daha çok kayıt.',
  'calendar.emptyDay': 'O gün kayıt yok.',
  'calendar.hint': 'Bir güne dokun, o gün ne söylediğini gör.',

  // kilit
  'lock.title': 'Defter kilitli',
  'lock.subtitle': '4 haneli şifreni gir.',
  'lock.error': 'Şifre yanlış. Tekrar dene.',
  'lock.wait': 'Çok fazla deneme. {sec} sn bekle.',
  'lock.forgot': 'Şifremi unuttum',
  'lock.forgotBody': 'Şifreyi biz de bilmiyoruz; cihazında geri döndürülemez şekilde saklanıyor. Bize yaz, ne yapabileceğini birlikte bakalım.',
  'lock.mail': 'Bize e-posta gönder',
  'lock.reset': 'Şifreyi kaldır (defter silinir)',
  'lock.resetConfirm': 'Bu işlem defterindeki tüm kayıtları siler ve kilidi kaldırır. Emin misin?',
  'lock.resetHint': 'Son çare: kayıtlar geri gelmez.',

  // pin kurulumu
  'pin.createTitle': '4 haneli şifre belirle',
  'pin.createBody': 'Defteri açarken bu şifre sorulacak.',
  'pin.confirmBody': 'Aynı şifreyi bir kez daha gir.',
  'pin.changeTitle': 'Şifreyi değiştir',
  'pin.mismatch': 'Şifreler aynı değil, baştan dene.',
  'pin.cancel': 'Vazgeç',

  // ayarlar: kilit kartı
  'settings.lock': 'Defter kilidi',
  'settings.lockBody': 'Uygulama açılırken 4 haneli şifre sorulur.',
  'settings.lockOn': 'Kilidi aç',
  'settings.lockOff': 'Kilidi kaldır',
  'settings.lockChange': 'Şifreyi değiştir',
  'settings.lockEnabled': 'Kilit açık.',
  'settings.lockDisabled': 'Kilit kaldırıldı.',
  'settings.lockRemoveConfirm': 'Kilit kaldırılsın mı? Defter şifresiz açılacak.',


  // kişi profili kartı (v0.10)
  'danger.caption': 'Bu kişiye karşı tehlike',
  'danger.aria': 'Tehlike yüzdesi {percent}',
  'danger.level.dusuk': 'güvenli',
  'danger.level.orta': 'dikkat',
  'danger.level.yuksek': 'yüksek',
  'score.success': 'başarı',
  'ledger.gridHint': 'Kutuya dokun → durumu değişir',
  'ledger.openLie': 'Kaydı aç',
  'ledger.cycleAria': 'Durumu değiştir',
  'profile.avatarPick': 'Profil fotoğrafı seç',

  // zaman
  'time.now': 'az önce',
  'time.today': 'bugün',
  'time.yesterday': 'dün',
};

const en: Dict = {
  'app.name': 'Lie Machine',
  'app.slogan': 'A liar’s candle never goes out.',
  'tab.ledger': 'Ledger',
  'tab.generate': 'Generate',
  'tab.settings': 'Settings',

  'lang.title': 'Language / Dil',
  'lang.subtitle': 'Which language do you want to use?',
  'lang.tr': 'Türkçe',
  'lang.en': 'English',
  'lang.hint': 'You can change this later in Settings.',

  'gen.brand': 'Lie Machine',
  'gen.tone': 'Tone · Channel',
  'gen.who': 'Who is it for?',
  'gen.whoPlaceholder': 'Type a name — e.g. Sarah, boss Mike',
  'gen.whoAria': 'Saved people',
  'gen.records': 'records',
  'gen.closeness': 'closeness',
  'gen.what': 'What happened?',
  'gen.whatPlaceholder': 'Write it in your own words: work ran late, I couldn’t make it…',
  'gen.hint': 'What kind of lie?',
  'gen.hintOptional': 'optional',
  'gen.hintPlaceholder': 'e.g. a family excuse, a bit emotional',
  'gen.channel': 'Channel',
  'gen.style': 'Tone',
  'gen.cta': 'Generate',
  'gen.ctaCount': '3 options',
  'gen.errRate': 'Slow down a little — you’re generating too fast.',
  'gen.errAbuse': 'I can’t write that kind of text (documents, reports, official records).',
  'gen.errGeneric': 'Something went wrong, try again.',
  'gen.repeatSame': 'You told {person} “{situation}” {count} times in the last {days} days. Reusing the same excuse raises the risk.',
  'gen.repeatAny': 'You have {count} records with {person} in the last {days} days. Keep the new text consistent with them; don’t reuse places, times or witnesses.',

  'load.1': 'assessing the situation',
  'load.2': 'weighing the odds',
  'load.3': 'writing the lie',
  'load.4': 'candle lit again',
  'load.hint': 'This can take 10-15 seconds, don’t close',

  'deck.kicker': '3 options',
  'deck.prev': 'Previous option',
  'deck.next': 'Next option',
  'deck.use': 'Use this one',
  'deck.back': '‹ Change the form',
  'deck.edit': 'Edit',
  'deck.editAria': 'Edit the lie',
  'deck.editHint': 'Change whatever part you want — the rest stays as it is.',
  'deck.cancel': 'Cancel',
  'deck.save': 'Save',
  'deck.editLabel': 'Lie text',
  'deck.queries': 'they may ask {count} questions',
  'deck.noQueries': 'no question preview',
  'deck.tutorialTitle': 'Swipe right',
  'deck.tutorialBody': 'We prepared three lies. Swipe right to see the others — tap edit to change the one you don’t like.',
  'deck.tutorialOk': 'Got it',

  'detail.picked': 'your chosen excuse',
  'detail.risk': 'risk',
  'detail.questions': 'What they might ask',
  'detail.answers': 'Ready answers',
  'detail.you': 'you',
  'detail.them': 'them',
  'detail.copied': 'Copied',
  'detail.copyFailed': 'Could not copy',
  'detail.wa': 'Share on WhatsApp',
  'detail.share': 'Share in other apps',
  'detail.save': 'Save to ledger',
  'detail.refresh': 'Regenerate',
  'detail.copy': 'Copy text',
  'detail.back': 'Back to cards',

  'risk.dusuk': 'low',
  'risk.orta': 'medium',
  'risk.yuksek': 'high',
  'strategy.sade': 'Plain',
  'strategy.detayli': 'Detailed',
  'strategy.duygusal': 'Emotional',

  'ledger.title': 'Lie Ledger',
  'ledger.add': '+ Record',
  'ledger.heading': 'Who did you lie to?',
  'ledger.search': 'Search a person or text',
  'ledger.searchAria': 'Search the ledger',
  'ledger.emptyTitle': 'Ledger is empty',
  'ledger.emptyBody': 'Record your first lie: write who you told what, so we remember it next time.',
  'ledger.emptyAction': 'Record a lie',
  'ledger.noResult': 'No results',
  'ledger.noResultBody': 'No person or record matches that search.',
  'ledger.unnamed': 'Unnamed',
  'ledger.back': 'Back to ledger',
  'ledger.profile': 'Profile',
  'ledger.addShort': '+ Add',
  'ledger.noneForPerson': 'Nothing recorded for this person yet.',
  'ledger.changeStatus': 'change',
  'ledger.sourceAi': 'AI suggestion',
  'ledger.sourceManual': 'written by you',
  'ledger.askTitle': 'What should I say?',
  'ledger.askBody': 'If they asked a follow-up question, type it here and we’ll craft an answer that doesn’t contradict your lie.',
  'ledger.askPlaceholder': 'e.g. who were you with?',
  'ledger.askCta': 'Draft an answer',
  'ledger.asking': 'Thinking…',
  'ledger.copy': 'Copy',
  'ledger.copyLie': '⧉ Copy the lie',
  'ledger.cycle': '↻ Change status',
  'ledger.delete': 'Delete',
  'ledger.deleteConfirm': 'Yes, delete',
  'ledger.loading': 'Loading…',
  'ledger.added': 'Added to the ledger.',
  'common.undo': 'undo',
  'ledger.deleted': 'Record deleted.',
  'ledger.saveFailed': 'Could not save, try again.',
  'ledger.statusFailed': 'Could not update the status.',
  'ledger.copyFailed': 'Could not copy.',
  'ledger.copied': 'Copied.',
  'ledger.answerCopied': 'Answer copied.',
  'ledger.profileSaved': 'Profile saved.',

  'new.title': 'Record a lie',
  'new.intro': 'Write who you told what. We’ll remember it next time.',
  'new.who': 'To whom?',
  'new.whoPlaceholder': 'Sarah, boss Mike…',
  'new.text': 'What did you say?',
  'new.textPlaceholder': 'Last night there was heavy traffic, that’s why I couldn’t come.',
  'new.channel': 'Channel',
  'new.situation': 'Which situation',
  'new.kind': 'Category',
  'new.cta': 'Add to ledger',
  'new.saving': 'Saving…',
  'new.back': 'Cancel',

  'profile.intro': 'These details shape how the AI speaks: how it addresses this person and how familiar it sounds.',
  'profile.relation': 'Relationship',
  'profile.gender': 'Gender',
  'profile.genderWoman': 'Woman',
  'profile.genderMan': 'Man',
  'profile.genderNone': 'Not specified',
  'profile.closeness': 'How close are you',
  'profile.closenessAria': 'Closeness',
  'profile.close1': 'distant · formal wording',
  'profile.close2': 'acquainted · not too casual',
  'profile.close3': 'close · relaxed wording',
  'profile.close4': 'very close · anything goes',
  'profile.notes': 'Things it should remember',
  'profile.notesPlaceholder': 'e.g. teacher, shares location, not available in the evenings',
  'profile.save': 'Save profile',
  'profile.saving': 'Saving…',
  'profile.back': 'Back to person',

  'status.changed': 'Status',
  'status.beklemede': 'pending',
  'status.tuttu': 'held up',
  'status.tutmadı': 'fell apart',

  'settings.title': 'Settings',
  'settings.subtitle': 'Language, defaults and your data.',
  'settings.language': 'Language',
  'settings.defaultStyle': 'Default tone',
  'settings.data': 'My data',
  'settings.export': 'Export ledger (JSON)',
  'settings.deleteAll': 'Delete all records',
  'settings.confirmDelete': 'All records in the ledger will be deleted. Are you sure?',
  'settings.deleted': '{count} records deleted.',
  'settings.deleteFailed': 'Delete failed.',
  'settings.exported': '{count} records exported.',
  'settings.exportFailed': 'Export failed.',
  'settings.legalTitle': 'Privacy and usage',
  'settings.legal1': 'This app is for entertainment. It does not produce official documents, medical reports or signatures. There is no account; apart from a random device id generated on your phone, no identity data is collected and no IP address is stored. You can delete or export your records anytime. Data is stored only on this app’s server and is never shared with third parties.',
  'settings.legal2': 'This app does not provide legal advice. It must not be used to harm others, slander anyone or commit fraud.',
  'settings.back': 'Back to generator',
  // ledger: new views (v0.9)
  'ledger.people': 'People',
  'ledger.calendar': 'Calendar',
  'ledger.streak': '{days}-day streak',
  'ledger.streakZero': 'nothing recorded today yet',
  'ledger.reminder': '{count} records are 2 days old — mark the outcome',
  'ledger.reminderOne': '1 record is 2 days old — mark the outcome',
  'ledger.conflictCount': '{count} conflicts',
  'ledger.conflictStrip': 'This person has conflicts',
  'ledger.conflictStripHint': 'What you told them does not add up',

  'score.held': 'held up rate',
  'score.total': 'records',
  'score.kept': 'kept',
  'score.failed': 'failed',
  'score.pending': 'pending',
  'score.top': 'most used',

  'conflict.intro': 'These records contradict each other. Tap either one to read it and decide which is still true.',
  'conflict.none': 'No conflicts for this person.',
  'conflict.count': 'conflicts',
  'conflict.kind.repeat': 'same excuse',
  'conflict.kind.similar': 'same wording',
  'conflict.kind.same_day': 'same day',
  'conflict.kind.detail': 'opposite detail',
  'conflict.sev.low': 'mild',
  'conflict.sev.medium': 'watch out',
  'conflict.sev.high': 'serious',
  'conflict.why.repeat': 'You used the same excuse twice within two weeks. If they notice, it is hard to explain.',
  'conflict.why.similar': 'The two texts are almost identical; they read as memorised.',
  'conflict.why.same_day': 'You gave two different excuses on the same day, both to this person.',
  'conflict.why.detail': 'One record says "{a}", the other says "{b}" — both cannot be true.',

  'calendar.legend': 'Last 30 days. Darker square = more records that day.',
  'calendar.emptyDay': 'No records that day.',
  'calendar.hint': 'Tap a day to see what you said.',

  'lock.title': 'Ledger is locked',
  'lock.subtitle': 'Enter your 4-digit PIN.',
  'lock.error': 'Wrong PIN. Try again.',
  'lock.wait': 'Too many attempts. Wait {sec}s.',
  'lock.forgot': 'I forgot my PIN',
  'lock.forgotBody': 'We do not know it either — it is stored on your device in a form that cannot be reversed. Write to us and we will figure out what we can do.',
  'lock.mail': 'Email us',
  'lock.reset': 'Remove the lock (deletes the ledger)',
  'lock.resetConfirm': 'This deletes every record in your ledger and removes the lock. Are you sure?',
  'lock.resetHint': 'Last resort: records will not come back.',

  'pin.createTitle': 'Set a 4-digit PIN',
  'pin.createBody': 'This PIN will be asked when you open the ledger.',
  'pin.confirmBody': 'Enter the same PIN once more.',
  'pin.changeTitle': 'Change PIN',
  'pin.mismatch': 'PINs do not match, start again.',
  'pin.cancel': 'Cancel',

  'settings.lock': 'Ledger lock',
  'settings.lockBody': 'A 4-digit PIN is asked when the app opens.',
  'settings.lockOn': 'Turn on the lock',
  'settings.lockOff': 'Remove the lock',
  'settings.lockChange': 'Change PIN',
  'settings.lockEnabled': 'Lock is on.',
  'settings.lockDisabled': 'Lock removed.',
  'settings.lockRemoveConfirm': 'Remove the lock? The ledger will open without a PIN.',
  'danger.caption': 'Risk with this person',
  'danger.aria': 'Danger score {percent}',
  'danger.level.dusuk': 'safe',
  'danger.level.orta': 'watch',
  'danger.level.yuksek': 'high',
  'score.success': 'success',
  'ledger.gridHint': 'Tap a card to change its status',
  'ledger.openLie': 'Open record',
  'ledger.cycleAria': 'Change status',
  'profile.avatarPick': 'Choose profile photo',



  'time.now': 'just now',
  'time.today': 'today',
  'time.yesterday': 'yesterday',
};

const DICTS: Record<Lang, Dict> = { tr, en };

const TARGET_LABEL: Record<Lang, Record<string, string>> = {
  tr: Object.fromEntries(TARGETS.map((t) => [t.id, t.label])),
  en: {
    patron: 'Boss',
    sevgili: 'Partner',
    anne: 'Parents',
    arkadas: 'Friend',
    hoca: 'Teacher',
    musteri: 'Client',
    ozel: 'Other',
  },
};

const SITUATION_LABEL: Record<Lang, Record<string, string>> = {
  tr: Object.fromEntries(SITUATIONS.map((s) => [s.id, s.label])),
  en: {
    gec_kaldim: 'I was late',
    gidemedim: 'I couldn’t come',
    parayi_harcadim: 'I spent the money',
    mesaji_gormedim: 'I missed the message',
    plani_bozdum: 'I broke the plan',
    isi_yetistiremedim: 'I missed the deadline',
    ozel: 'I’ll write it myself',
  },
};

const CHANNEL_LABEL: Record<Lang, Record<string, string>> = {
  tr: Object.fromEntries(CHANNELS.map((c) => [c.id, c.label])),
  en: { yuz_yuze: 'In person', telefon: 'Phone', whatsapp: 'WhatsApp' },
};

const STYLE_LABEL: Record<Lang, Record<string, string>> = {
  tr: Object.fromEntries(STYLES.map((s) => [s.id, s.label])),
  en: { ciddi: 'Serious', esprili: 'Playful', duygusal: 'Emotional', resmi: 'Formal' },
};

export const STORAGE_KEY = 'ym_lang';

export function readLang(): Lang | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'tr' || value === 'en' ? value : null;
  } catch {
    return null;
  }
}

export function writeLang(lang: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* yoksay */
  }
}

export function translate(lang: Lang, key: string, params?: Record<string, string | number>): string {
  const raw = DICTS[lang][key] ?? DICTS.tr[key] ?? key;
  if (!params) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`));
}

export function labelFor(lang: Lang, kind: 'target' | 'situation' | 'channel' | 'style', id: string): string {
  const map =
    kind === 'target' ? TARGET_LABEL : kind === 'situation' ? SITUATION_LABEL : kind === 'channel' ? CHANNEL_LABEL : STYLE_LABEL;
  return map[lang][id] ?? map.tr[id] ?? id;
}

export function monthName(lang: Lang, index: number): string {
  const trMonths = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  const enMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return (lang === 'en' ? enMonths : trMonths)[index] ?? '';
}
