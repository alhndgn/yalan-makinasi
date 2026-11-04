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
    { tag: 'is', text: 'İşler beklediğimden yavaş ilerledi.', q: 'Tam olarak ne oldu?', a: 'İşler beklediğimden yavaş ilerledi.' },
    { tag: 'aile', text: 'Ailede acil bir konu çıktı.', q: 'Evde bir sorun mu var?', a: 'Ailede acil bir konu çıktı.' },
    { tag: 'saglik', text: 'Kendimi bugün hiç iyi hissetmiyorum.', q: 'İyi misin?', a: 'Kendimi bugün hiç iyi hissetmiyorum.' },
    { tag: 'ulasim', text: 'Yolda beklenmedik bir gecikme oldu.', q: 'Yolda ne oldu?', a: 'Yolda beklenmedik bir gecikme oldu.' },
    { tag: 'ikinci_kisi', text: 'Yanımda bir arkadaşım vardı, onu yalnız bırakamadım.', q: 'Kiminleydin?', a: 'Yanımda bir arkadaşım vardı, onu yalnız bırakamadım.' },
    { tag: 'konum', text: 'Şu an orada değilim, yetişmem zor.', q: 'Neredesin?', a: 'Şu an orada değilim, yetişmem zor.' },
  ],
  closers: baseClosers('Kusura bakma.', 'Kusura bakma, açıklamayı yüz yüze yapayım.', 'Seni zor durumda bıraktığım için üzgünüm, telafi edeceğim.'),
};
