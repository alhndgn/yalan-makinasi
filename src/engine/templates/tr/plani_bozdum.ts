import type { Bank } from '../types.ts';
import { baseClosers } from '../types.ts';

export const planiBozdum: Bank = {
  id: 'plani_bozdum',
  openings: [
    { style: 'ciddi', text: 'Planı bozdum, biliyorum.' },
    { style: 'ciddi', text: 'Bugünkü planı iptal etmem gerekiyor.' },
    { style: 'ciddi', text: 'Söz verdiğim şeyi yapamayacağım.' },
    { style: 'esprili', text: 'Planı bozdum, kepenkleri indiriyorum.' },
    { style: 'esprili', text: 'Bugün plana ihanet ettim, affet.' },
    { style: 'duygusal', text: 'Planı bozmak istemezdim, gerçekten.' },
    { style: 'resmi', text: 'Programda değişiklik yapmam gerekiyor.' },
  ],
  details: [
    { tag: 'aile', text: 'Evde acil bir durum çıktı.', q: 'Ne oldu, neden iptal?', a: 'Evde acil bir durum çıktı.' },
    { tag: 'is', text: 'İşten beklenmedik bir çağrı geldi.', q: 'İşten mi çağırdılar?', a: 'İşten beklenmedik bir çağrı geldi.' },
    { tag: 'saglik', text: 'Bugün kendimi hiç iyi hissetmiyorum.', q: 'İyi misin?', a: 'Bugün kendimi hiç iyi hissetmiyorum.' },
    { tag: 'ulasim', text: 'Yol kapandı, gidiş geliş uzadı.', q: 'Yol mu kapandı?', a: 'Yol kapandı, gidiş geliş uzadı.' },
    { tag: 'ikinci_kisi', text: 'Yanımdaki arkadaşımın işi çıktı, ona eşlik ediyorum.', q: 'Kiminlesin?', a: 'Yanımdaki arkadaşımın işi çıktı, ona eşlik ediyorum.' },
    { tag: 'konum', text: 'Şu an şehir dışındayım, yetişemem.', q: 'Neredesin?', a: 'Şehir dışındayım, yetişemem.' },
  ],
  closers: baseClosers('Kusura bakma.', 'Kusura bakma, yeni bir gün ayarlayalım.', 'Planını bozduğum için üzgünüm, telafi edeceğim.'),
};
