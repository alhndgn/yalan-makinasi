import type { Bank } from '../types.ts';
import { baseClosers } from '../types.ts';

export const gidemedim: Bank = {
  id: 'gidemedim',
  openings: [
    { style: 'ciddi', text: 'Bugün gelemeyeceğim, kusura bakma.' },
    { style: 'ciddi', text: 'Maalesef programa katılamıyorum.' },
    { style: 'ciddi', text: 'Gelemeyeceğim, haber vermek istedim.' },
    { style: 'esprili', text: 'Ben bugün evdeyim, dünya beni idare etsin.' },
    { style: 'esprili', text: 'Planı ben bozdum, suç bende.' },
    { style: 'duygusal', text: 'Gelmeyi çok istiyordum ama olmadı.' },
    { style: 'duygusal', text: 'Seni görmek isterdim, bugün olmuyor.' },
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
  closers: baseClosers('Kusura bakma.', 'Kusura bakma, haber vereceğim.', 'Seni yalnız bıraktığım için üzgünüm, telafi edeceğim.'),
  queries: [
    { q: 'Neyin var, iyi misin?', tag: 'saglik', a: 'Dün geceden beri ateşim var, yatıyorum.' },
    { q: 'Neredeydin?', tag: 'aile', a: 'Babamın doktor randevusu vardı, ona eşlik ettim.' },
    { q: 'İşten mi çıkamadın?', tag: 'is', a: 'İş yerinde acil bir toplantı çıktı.' },
    { q: 'Araba mı bozuldu?', tag: 'ulasim', a: 'Lastik indi, sanayide kaldım.' },
    { q: 'Evde kim var?', tag: 'ikinci_kisi', a: 'Kardeşim bende kalıyor, onu yalnız bırakamazdım.' },
    { q: 'Şu an neredesin?', tag: 'konum', a: 'Şehir dışındayım, dönüşüm uzadı.' },
  ],
};
