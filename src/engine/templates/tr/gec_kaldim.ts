import type { Bank } from '../types.ts';
import { baseClosers } from '../types.ts';

export const gecKaldim: Bank = {
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
  closers: baseClosers('Kusura bakma.', 'Kusura bakma, bir daha olmayacak.', 'Seni beklettiğim için gerçekten üzgünüm, telafi edeceğim.'),
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
