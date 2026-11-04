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
    { tag: 'is', text: 'Arabanın servis masrafı çıktı.' },
    { tag: 'aile', text: 'Kardeşime acil bir ödeme yaptım.' },
    { tag: 'saglik', text: 'Eczane ve doktor masrafı birikti.' },
    { tag: 'ulasim', text: 'Ulaşım masrafları bu ay ikiye katlandı.' },
    { tag: 'ikinci_kisi', text: 'Arkadaşıma borç vermem gerekti.' },
    { tag: 'is' as const, text: 'İş yerinde avans kapatıldı, açık kaldı.' },
  ],
  closers: baseClosers('Özür dilerim.', 'Özür dilerim, bundan sonra haber vereceğim.', 'Seni zor durumda bıraktığım için üzgünüm, telafi edeceğim.'),
  queries: [
    { q: 'Parayı neye harcadın?', tag: 'is', a: 'Arabanın servis masrafı çıktı, mecburen ödedim.' },
    { q: 'Kime verdin?', tag: 'aile', a: 'Kardeşime acil bir ödeme yaptım.' },
    { q: 'Sağlık masrafı mı vardı?', tag: 'saglik', a: 'Eczane ve doktor masrafı birikti.' },
    { q: 'Ulaşım mı arttı?', tag: 'ulasim', a: 'Ulaşım masrafları bu ay ikiye katlandı.' },
    { q: 'Kime borç verdin?', tag: 'ikinci_kisi', a: 'Arkadaşıma borç vermem gerekti.' },
  ],
};
