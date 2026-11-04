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
    { tag: 'ulasim', text: 'Yolda trafik vardı.', q: 'Nerede kaldın?', a: 'Yolda trafik vardı, o yüzden geciktim.' },
    { tag: 'ulasim', text: 'Metro arıza yaptı, yirmi dakika bekledim.', q: 'Metro mu sorun çıkardı?', a: 'Metro arıza yaptı, yirmi dakika bekledim.' },
    { tag: 'saglik', text: 'Sabah midem çok kötüydü.', q: 'İyi misin, bir şey mi oldu?', a: 'Sabah midem çok kötüydü, yeni toparlandım.' },
    { tag: 'aile', text: 'Annem rahatsızlandı, yanında kalmam gerekti.', q: 'Nerede kaldın, evde misin?', a: 'Annem rahatsızlandı, yanında kalmam gerekti.' },
    { tag: 'is', text: 'Patron son dakika bir iş çıkardı.', q: 'İşten mi çıkamadın?', a: 'Patron son dakika bir iş çıkardı.' },
    { tag: 'konum', text: 'Şu an hâlâ yoldayım, birazdan oradayım.', q: 'Şu an neredesin?', a: 'Hâlâ yoldayım, birazdan oradayım.' },
    { tag: 'ikinci_kisi', text: 'Kuzenim yanımdaydı, onu bırakmam gerekti.', q: 'Yanında kim vardı?', a: 'Kuzenim yanımdaydı, onu bırakmam gerekti.' },
  ],
  closers: baseClosers('Kusura bakma.', 'Kusura bakma, bir daha olmayacak.', 'Seni beklettiğim için gerçekten üzgünüm, telafi edeceğim.'),
};
