import type { Bank } from '../types.ts';
import { baseClosers } from '../types.ts';

export const ozel: Bank = {
  id: 'ozel',
  openings: [
    { style: 'ciddi', text: 'Kusura bakma, durumu anlatmam gerekiyor.' },
    { style: 'ciddi', text: 'Sana söylemem gereken bir şey var.' },
    { style: 'ciddi', text: 'Bugün istediğim gibi gitmedi, açıklayayım.' },
    { style: 'esprili', text: 'Kısa bir itiraf: bugün planlar suya düştü.' },
    { style: 'esprili', text: 'Bu iş biraz karıştı, anlatayım.' },
    { style: 'duygusal', text: 'Seni üzmek istemem ama anlatmam lazım.' },
    { style: 'resmi', text: 'Durumu bilginize sunmam gerekiyor.' },
  ],
  details: [
    { tag: 'is', text: 'İşler beklediğimden yavaş ilerledi.' },
    { tag: 'aile', text: 'Ailede acil bir konu çıktı.' },
    { tag: 'saglik', text: 'Kendimi bugün hiç iyi hissetmiyorum.' },
    { tag: 'ulasim', text: 'Yolda beklenmedik bir gecikme oldu.' },
    { tag: 'ikinci_kisi', text: 'Yanımda bir arkadaşım vardı, onu yalnız bırakamadım.' },
    { tag: 'konum', text: 'Şu an orada değilim, yetişmem zor.' },
  ],
  closers: baseClosers('Kusura bakma.', 'Kusura bakma, açıklamayı yüz yüze yapayım.', 'Seni zor durumda bıraktığım için üzgünüm, telafi edeceğim.'),
  queries: [
    { q: 'Tam olarak ne oldu?', tag: 'is', a: 'İşler beklediğimden yavaş ilerledi.' },
    { q: 'Evde bir sorun mu var?', tag: 'aile', a: 'Ailede acil bir konu çıktı.' },
    { q: 'İyi misin?', tag: 'saglik', a: 'Kendimi bugün hiç iyi hissetmiyorum.' },
    { q: 'Yolda ne oldu?', tag: 'ulasim', a: 'Yolda beklenmedik bir gecikme oldu.' },
    { q: 'Kiminleydin?', tag: 'ikinci_kisi', a: 'Yanımda bir arkadaşım vardı, onu yalnız bırakamadım.' },
  ],
};
