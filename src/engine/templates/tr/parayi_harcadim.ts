import type { Bank } from '../types.ts';
import { baseClosers } from '../types.ts';

export const parayiHarcadim: Bank = {
  id: 'parayi_harcadim',
  openings: [
    { style: 'ciddi', text: 'Parayı harcadım, saklamak istemedim.' },
    { style: 'ciddi', text: 'Hesaptaki para beklediğimden hızlı gitti.' },
    { style: 'ciddi', text: 'Doğrusunu söyleyeyim, parayı harcadım.' },
    { style: 'esprili', text: 'Para bende durmadı, kendine yeni bir sahip buldu.' },
    { style: 'esprili', text: 'Cüzdanım bugün hayırsever moda geçti.' },
    { style: 'duygusal', text: 'Sana söylemem gereken bir şey var, biraz zor.' },
    { style: 'resmi', text: 'Bütçede öngörülemeyen bir harcama oluştu.' },
  ],
  details: [
    { tag: 'is', text: 'Arabanın servis masrafı çıktı.', q: 'Parayı neye harcadın?', a: 'Arabanın servis masrafı çıktı, mecburen ödedim.' },
    { tag: 'aile', text: 'Kardeşime acil bir ödeme yaptım.', q: 'Kime para verdin?', a: 'Kardeşime acil bir ödeme yaptım.' },
    { tag: 'saglik', text: 'Eczane ve doktor masrafı birikti.', q: 'Sağlık masrafı mı vardı?', a: 'Eczane ve doktor masrafı birikti.' },
    { tag: 'ulasim', text: 'Ulaşım masrafları bu ay ikiye katlandı.', q: 'Ulaşım masrafı mı arttı?', a: 'Ulaşım masrafları bu ay ikiye katlandı.' },
    { tag: 'ikinci_kisi', text: 'Arkadaşıma borç vermem gerekti.', q: 'Kime borç verdin?', a: 'Arkadaşıma borç vermem gerekti.' },
    { tag: 'is', text: 'İş yerinde avans kapatıldı, açık kaldı.', q: 'Avans mı kesildi?', a: 'İş yerinde avans kapatıldı, açık kaldı.' },
  ],
  closers: baseClosers('Özür dilerim.', 'Özür dilerim, bundan sonra haber vereceğim.', 'Seni zor durumda bıraktığım için üzgünüm, telafi edeceğim.'),
};
