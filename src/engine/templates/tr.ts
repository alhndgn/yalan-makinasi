import type { ChannelId, SituationId, StyleId, TargetId } from '../../shared/constants.ts';

export type DetailTag = 'ulasim' | 'saglik' | 'aile' | 'is' | 'konum' | 'ikinci_kisi';
export type CloserKind = 'kisa' | 'normal' | 'empati';

export type Bank = {
  id: SituationId;
  openings: { style: StyleId; text: string }[];
  details: { tag: DetailTag; text: string }[];
  closers: { kind: CloserKind; style: StyleId; text: string }[];
  queries: { q: string; tag: DetailTag; a: string }[];
};

const gecKaldim: Bank = {
  id: 'gec_kaldim',
  openings: [
    { style: 'ciddi', text: 'Kusura bakma, gelemedim.' },
    { style: 'ciddi', text: 'Geç kaldım, haber de veremedim.' },
    { style: 'ciddi', text: 'Bugün orada olamadım, kusura bakma.' },
    { style: 'esprili', text: 'Bugün yola çıktım ama trafik beni yendi.' },
    { style: 'esprili', text: 'Günaydın, ben bugün takvime yenildim.' },
    { style: 'duygusal', text: 'Gelecektim, gerçekten gelmek istiyordum.' },
    { style: 'duygusal', text: 'Seni bekletmek istemezdim, biliyorsun.' },
    { style: 'resmi', text: 'Toplantıya katılamadım, bilginize sunarım.' },
    { style: 'resmi', text: 'Bugünkü programa iştirak edemedim.' },
  ],
  details: [
    { tag: 'ulasim', text: 'Yolda trafik vardı.' },
    { tag: 'ulasim', text: 'Metro arıza yaptı, yirmi dakika bekledim.' },
    { tag: 'saglik', text: 'Sabah midem çok kötüydü.' },
    { tag: 'aile', text: 'Annem rahatsızlandı, yanında kalmam gerekti.' },
    { tag: 'is', text: 'Patron son dakika bir iş çıkardı.' },
    { tag: 'konum', text: 'Şu an hâlâ yoldayım, birazdan oradayım.' },
    { tag: 'ikinci_kisi', text: 'Kuzenim yanımdaydı, onu bırakmam gerekti.' },
  ],
  closers: [
    { kind: 'kisa', style: 'ciddi', text: 'Kusura bakma.' },
    { kind: 'kisa', style: 'ciddi', text: 'Haber veremedim, kusura bakma.' },
    { kind: 'kisa', style: 'esprili', text: 'Cezamı kes, kabul ediyorum.' },
    { kind: 'kisa', style: 'duygusal', text: 'Üzgünüm.' },
    { kind: 'kisa', style: 'resmi', text: 'Bilginize sunarım.' },
    { kind: 'normal', style: 'ciddi', text: 'Kusura bakma, bir daha olmayacak.' },
    { kind: 'normal', style: 'esprili', text: 'Cezamı kes, boynum kıldan ince.' },
    { kind: 'normal', style: 'duygusal', text: 'Seni beklettiğim için gerçekten üzgünüm.' },
    { kind: 'normal', style: 'resmi', text: 'Anlayışınız için teşekkür ederim.' },
    { kind: 'empati', style: 'ciddi', text: 'Seni beklettiğim için gerçekten üzgünüm, telafi edeceğim.' },
    { kind: 'empati', style: 'duygusal', text: 'Seni beklettiğim için gerçekten üzgünüm, telafi edeceğim.' },
    { kind: 'empati', style: 'esprili', text: 'Seni beklettim, telafisi benden.' },
    { kind: 'empati', style: 'resmi', text: 'Zamanınızı aldığım için özür dilerim.' },
  ],
  queries: [
    { q: 'Nerede kaldın?', tag: 'ulasim', a: 'Yolda trafik vardı, o yüzden geciktim.' },
    { q: 'Neden haber vermedin?', tag: 'ulasim', a: 'Metro arıza yaptı, telefona bakamadım.' },
    { q: 'İyi misin, bir şey mi oldu?', tag: 'saglik', a: 'Midem çok kötüydü, yeni toparlandım.' },
    { q: 'Nerede kaldın, evde misin?', tag: 'aile', a: 'Annem rahatsızlandı, yanında kaldım.' },
    { q: 'İşten mi çıkamadın?', tag: 'is', a: 'Patron son dakika bir iş çıkardı.' },
    { q: 'Şu an neredesin?', tag: 'konum', a: 'Hâlâ yoldayım, birazdan oradayım.' },
    { q: 'Yanında kim vardı?', tag: 'ikinci_kisi', a: 'Kuzenim yanımdaydı, onu bırakmam gerekti.' },
  ],
};

const gidemedim: Bank = {
  id: 'gidemedim',
  openings: [
    { style: 'ciddi', text: 'Bugün gelemeyeceğim, kusura bakma.' },
    { style: 'ciddi', text: 'Maalesef programa katılamıyorum.' },
    { style: 'esprili', text: 'Ben bugün evdeyim, dünya beni idare etsin.' },
    { style: 'esprili', text: 'Planı ben bozdum, suç bende.' },
    { style: 'duygusal', text: 'Gelmeyi çok istiyordum ama olmadı.' },
    { style: 'resmi', text: 'Davetinize katılamayacağımı bildirmek isterim.' },
  ],
  details: [
    { tag: 'saglik', text: 'Dün geceden beri ateşim var.' },
    { tag: 'aile', text: 'Babamın doktor randevusu vardı, ona eşlik ettim.' },
    { tag: 'is', text: 'İş yerinde acil bir toplantı çıktı.' },
    { tag: 'ulasim', text: 'Arabanın lastiği indi, sanayide kaldım.' },
    { tag: 'ikinci_kisi', text: 'Kardeşim bende kalıyor, onu yalnız bırakamazdım.' },
    { tag: 'konum', text: 'Şu an şehir dışındayım, dönüşüm uzadı.' },
  ],
  closers: [
    { kind: 'kisa', style: 'ciddi', text: 'Kusura bakma.' },
    { kind: 'kisa', style: 'esprili', text: 'Bir dahaki sefere ilk ben gelirim.' },
    { kind: 'kisa', style: 'duygusal', text: 'Üzgünüm.' },
    { kind: 'kisa', style: 'resmi', text: 'Bilginize sunarım.' },
    { kind: 'normal', style: 'ciddi', text: 'Kusura bakma, haber vereceğim.' },
    { kind: 'normal', style: 'esprili', text: 'Bir sonraki plan benden, söz.' },
    { kind: 'normal', style: 'duygusal', text: 'Seni yalnız bıraktığım için üzgünüm.' },
    { kind: 'normal', style: 'resmi', text: 'Anlayışınız için teşekkür ederim.' },
    { kind: 'empati', style: 'ciddi', text: 'Seni yalnız bıraktığım için üzgünüm, telafi edeceğim.' },
    { kind: 'empati', style: 'duygusal', text: 'Seni yalnız bıraktığım için üzgünüm, telafi edeceğim.' },
    { kind: 'empati', style: 'esprili', text: 'Kaçırdığım için üzgünüm, telafisi benden.' },
    { kind: 'empati', style: 'resmi', text: 'Programınızı aksattığım için özür dilerim.' },
  ],
  queries: [
    { q: 'Neyin var, iyi misin?', tag: 'saglik', a: 'Dün geceden beri ateşim var, yatıyorum.' },
    { q: 'Neredeydin?', tag: 'aile', a: 'Babamın doktor randevusu vardı, ona eşlik ettim.' },
    { q: 'İşten mi çıkamadın?', tag: 'is', a: 'İş yerinde acil bir toplantı çıktı.' },
    { q: 'Araba mı bozuldu?', tag: 'ulasim', a: 'Lastik indi, sanayide kaldım.' },
    { q: 'Evde kim var?', tag: 'ikinci_kisi', a: 'Kardeşim bende kalıyor, onu yalnız bırakamazdım.' },
    { q: 'Şu an neredesin?', tag: 'konum', a: 'Şehir dışındayım, dönüşüm uzadı.' },
  ],
};

export const banks: Partial<Record<SituationId, Bank>> = {
  gec_kaldim: gecKaldim,
  gidemedim,
};

export type ComposeContext = { target: TargetId; channel: ChannelId };
