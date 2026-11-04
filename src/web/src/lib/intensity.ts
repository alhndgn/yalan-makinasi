export type IntensityBand = { label: string; hint: string };

export function intensityBand(value: number): IntensityBand {
  if (value <= 2) return { label: 'Beyaz yalan', hint: 'Tek cümle, detay yok.' };
  if (value <= 4) return { label: 'Küçük bahane', hint: 'Tek cümle, bir yumuşatıcı.' };
  if (value <= 6) return { label: 'Kıvırma', hint: '2-3 cümle, bir tutarlı detay.' };
  if (value <= 8) return { label: 'Cesur', hint: '3-4 cümle, iki detay, hazır cevap.' };
  return { label: 'Senaryo', hint: 'Tam hikâye; risk göstergesi kırmızıya yakın.' };
}

export function clampIntensity(value: number): number {
  if (!Number.isFinite(value)) return 5;
  return Math.min(10, Math.max(1, Math.round(value)));
}
