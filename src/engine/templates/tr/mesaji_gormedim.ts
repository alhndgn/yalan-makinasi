import type { Bank } from '../types.ts';
import { baseClosers } from '../types.ts';

export const mesajiGormedim: Bank = {
  id: 'mesaji_gormedim',
  openings: [
    { style: 'ciddi', text: 'Mesajını yeni gördüm.' },
    { style: 'ciddi', text: 'Bildirim gelmemiş, yeni fark ettim.' },
    { style: 'ciddi', text: 'Telefon sessizdeydi, mesajını görmedim.' },
    { style: 'esprili', text: 'Telefonum bugün bana küstü, bildirim gelmemiş.' },
    { style: 'esprili', text: 'Mesajın bildirimlerin arasında kaybolmuş.' },
    { style: 'duygusal', text: 'Yazdığını yeni gördüm, kötü hissettim.' },
    { style: 'resmi', text: 'Mesajınızı geç gördüm, kusura bakmayın.' },
  ],
  details: [
    { tag: 'is', text: 'Yoğun bir gün geçti, telefona bakamadım.', q: 'Neden cevap vermedin?', a: 'Yoğun bir gün geçti, telefona bakamadım.' },
    { tag: 'konum', text: 'Telefonun şarjı bitmiş, kapanmış.', q: 'Telefonun mu kapandı?', a: 'Telefonun şarjı bitmiş, kapanmış.' },
    { tag: 'ulasim', text: 'Yoldaydım, telefona hiç bakmadım.', q: 'Yolda mıydın?', a: 'Yoldaydım, telefona hiç bakmadım.' },
    { tag: 'ikinci_kisi', text: 'Yanımdaki arkadaşla konuşuyordum, telefonu elime almadım.', q: 'Kiminleydin?', a: 'Yanımdaki arkadaşla konuşuyordum, telefonu elime almadım.' },
    { tag: 'aile', text: 'Aile ziyaretindeydim, telefon çantadaydı.', q: 'Neredeydin?', a: 'Aile ziyaretindeydim, telefon çantadaydı.' },
    { tag: 'saglik', text: 'Başım ağrıyordu, ekrana bakmadım.', q: 'İyi değil miydin?', a: 'Başım ağrıyordu, ekrana bakmadım.' },
  ],
  closers: baseClosers('Kusura bakma.', 'Kusura bakma, bir daha olmayacak.', 'Cevap veremediğim için üzgünüm, şimdi buradayım.'),
};
