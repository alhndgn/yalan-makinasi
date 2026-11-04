import type { Bank } from '../types.ts';
import { baseClosers } from '../types.ts';

export const isiYetistiremedim: Bank = {
  id: 'isi_yetistiremedim',
  openings: [
    { style: 'ciddi', text: 'İşi yetiştiremedim, kabul ediyorum.' },
    { style: 'ciddi', text: 'Bugünkü teslimi tamamlayamadım.' },
    { style: 'ciddi', text: 'Söz verdiğim tarihe yetişmedi.' },
    { style: 'esprili', text: 'İş benden hızlı çıktı, yetişemedim.' },
    { style: 'esprili', text: 'Takvim beni yine yendi.' },
    { style: 'duygusal', text: 'Yetiştirmek için çok uğraştım ama olmadı.' },
    { style: 'resmi', text: 'Teslim tarihini karşılayamadım, bilginize sunarım.' },
  ],
  details: [
    { tag: 'is', text: 'Üst üste üç iş aynı güne düştü.', q: 'Neden yetişmedi?', a: 'Üst üste üç iş aynı güne düştü.' },
    { tag: 'saglik', text: 'İki gündür başım çok ağrıyor.', q: 'İyi misin?', a: 'İki gündür başım çok ağrıyor.' },
    { tag: 'aile', text: 'Evde bakmam gereken bir durum çıktı.', q: 'Evde bir şey mi oldu?', a: 'Evde bakmam gereken bir durum çıktı.' },
    { tag: 'ulasim', text: 'Malzeme kargoda gecikti, elimde yoktu.', q: 'Malzeme mi gelmedi?', a: 'Malzeme kargoda gecikti, elimde yoktu.' },
    { tag: 'ikinci_kisi', text: 'Birlikte çalıştığım kişi izne çıktı, iş bende kaldı.', q: 'Ekip nerede?', a: 'Birlikte çalıştığım kişi izne çıktı, iş bende kaldı.' },
    { tag: 'konum', text: 'Sahada olduğum için bilgisayara oturamadım.', q: 'Neredeydin?', a: 'Sahada olduğum için bilgisayara oturamadım.' },
  ],
  closers: baseClosers('Kusura bakma.', 'Kusura bakma, yeni bir tarih vereceğim.', 'Seni beklettiğim için üzgünüm, telafi edeceğim.'),
};
