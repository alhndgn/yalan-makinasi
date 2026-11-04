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
    { tag: 'aile', text: 'Evde acil bir durum çıktı.' },
    { tag: 'is', text: 'İşten beklenmedik bir çağrı geldi.' },
    { tag: 'saglik', text: 'Bugün kendimi hiç iyi hissetmiyorum.' },
    { tag: 'ulasim', text: 'Yol kapandı, gidiş geliş uzadı.' },
    { tag: 'ikinci_kisi', text: 'Yanımdaki arkadaşımın işi çıktı, ona eşlik ediyorum.' },
    { tag: 'konum', text: 'Şu an şehir dışındayım, yetişemem.' },
  ],
  closers: baseClosers('Kusura bakma.', 'Kusura bakma, yeni bir gün ayarlayalım.', 'Planını bozduğum için üzgünüm, telafi edeceğim.'),
  queries: [
    { q: 'Ne oldu, neden iptal?', tag: 'aile', a: 'Evde acil bir durum çıktı.' },
    { q: 'İşten mi çağırdılar?', tag: 'is', a: 'İşten beklenmedik bir çağrı geldi.' },
    { q: 'İyi misin?', tag: 'saglik', a: 'Bugün kendimi hiç iyi hissetmiyorum.' },
    { q: 'Yol mu kapandı?', tag: 'ulasim', a: 'Yol kapandı, gidiş geliş uzadı.' },
    { q: 'Kiminlesin?', tag: 'ikinci_kisi', a: 'Yanımdaki arkadaşımın işi çıktı, ona eşlik ediyorum.' },
  ],
};
