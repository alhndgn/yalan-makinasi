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
    { tag: 'saglik', text: 'Dün geceden beri ateşim var.', q: 'Neyin var, iyi misin?', a: 'Dün geceden beri ateşim var, yatıyorum.' },
    { tag: 'aile', text: 'Babamın doktor randevusu vardı, ona eşlik ettim.', q: 'Neredeydin?', a: 'Babamın doktor randevusu vardı, ona eşlik ettim.' },
    { tag: 'is', text: 'İş yerinde acil bir toplantı çıktı.', q: 'İşten mi çıkamadın?', a: 'İş yerinde acil bir toplantı çıktı.' },
    { tag: 'ulasim', text: 'Arabanın lastiği indi, sanayide kaldım.', q: 'Araba mı bozuldu?', a: 'Lastik indi, sanayide kaldım.' },
    { tag: 'ikinci_kisi', text: 'Kardeşim bende kalıyor, onu yalnız bırakamazdım.', q: 'Evde kim var?', a: 'Kardeşim bende kalıyor, onu yalnız bırakamazdım.' },
    { tag: 'konum', text: 'Şu an şehir dışındayım, dönüşüm uzadı.', q: 'Şu an neredesin?', a: 'Şehir dışındayım, dönüşüm uzadı.' },
  ],
  closers: baseClosers('Kusura bakma.', 'Kusura bakma, haber vereceğim.', 'Seni yalnız bıraktığım için üzgünüm, telafi edeceğim.'),
};
