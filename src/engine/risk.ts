import type { ChannelId, TargetId } from '../shared/constants.ts';

export type RiskInput = {
  intensity: number;
  target: TargetId;
  channel: ChannelId;
  detailCount: number;
  hasSecondPerson: boolean;
  hasLocation: boolean;
  mentionsDocument: boolean;
  conflictCount: number;
};

export type RiskLevel = 'dusuk' | 'orta' | 'yuksek';

export type RiskResult = { score: number; level: RiskLevel; reasons: string[] };

const TARGET_WEIGHT: Record<TargetId, number> = {
  patron: 25,
  musteri: 25,
  sevgili: 20,
  hoca: 20,
  anne: 15,
  ozel: 15,
  arkadas: 10,
};

const CHANNEL_WEIGHT: Record<ChannelId, number> = {
  yuz_yuze: 15,
  telefon: 10,
  whatsapp: 5,
};

export function riskLevelFor(score: number): RiskLevel {
  if (score >= 65) return 'yuksek';
  if (score >= 35) return 'orta';
  return 'dusuk';
}

export function scoreRisk(input: RiskInput): RiskResult {
  const reasons: { weight: number; text: string }[] = [];

  const base = input.intensity * 3;
  const targetW = TARGET_WEIGHT[input.target];
  const channelW = CHANNEL_WEIGHT[input.channel];
  const detailW = input.detailCount * 5;

  let flags = 0;
  if (input.hasSecondPerson) {
    flags += 15;
    reasons.push({ weight: 15, text: 'İkinci bir kişiye doğrulanabilir' });
  }
  if (input.hasLocation) {
    flags += 15;
    reasons.push({ weight: 15, text: 'Konum kontrol edilebilir' });
  }
  if (input.mentionsDocument) {
    flags += 20;
    reasons.push({ weight: 20, text: 'Belge ya da resmî kayıt gerektiriyor' });
  }
  const conflictW = Math.min(20, input.conflictCount * 10);
  if (input.conflictCount > 0) {
    reasons.push({ weight: conflictW, text: 'Bu kişiye son 30 günde 2+ bahane söyledin' });
  }
  if (detailW >= 10) {
    reasons.push({ weight: detailW, text: 'Detay arttıkça çelişki riski büyür' });
  }
  if (targetW >= 20) {
    reasons.push({ weight: targetW, text: 'Karşı taraf sorgulama ihtimali yüksek' });
  }

  const score = Math.min(100, base + targetW + channelW + detailW + flags + conflictW);

  const topReasons = [...reasons]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map((r) => r.text);

  return { score, level: riskLevelFor(score), reasons: topReasons };
}
