const dateFormatter = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export function formatWhen(ts: number): string {
  return dateFormatter.format(new Date(ts));
}

export const TARGET_LABEL: Record<string, string> = {
  patron: 'Patron',
  sevgili: 'Sevgili',
  anne: 'Anne-baba',
  arkadas: 'Arkadaş',
  hoca: 'Hoca',
  musteri: 'Müşteri',
  ozel: 'Özel',
};
