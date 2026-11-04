import { STRATEGIES, type ChannelId, type SituationId, type Strategy, type StyleId, type TargetId } from '../shared/constants.ts';
import { hashSeed, mulberry32 } from './random.ts';
import { banks, type Bank, type CloserKind, type Detail, type DetailTag } from './templates/tr.ts';

export type ComposeInput = {
  deviceId: string;
  target: TargetId;
  situation: SituationId;
  situationCustom?: string;
  channel: ChannelId;
  style: StyleId;
  intensity: number;
  salt: string;
};

export type VariantDraft = {
  strategy: Strategy;
  text: string;
  detailTags: DetailTag[];
  selectedDetails: Detail[];
  hasSecondPerson: boolean;
  hasLocation: boolean;
};

/** Noktalama ve büyük/küçük harf farkını yok sayan karşılaştırma anahtarı. */
export function normalizeSentence(text: string): string {
  return text
    .toLocaleLowerCase('tr-TR')
    .replace(/[.,!?;:…"'“”]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function detailCountFor(intensity: number): number {
  return Math.min(3, Math.floor(intensity / 3));
}

function pickOpening(bank: Bank, style: StyleId, rng: () => number): string {
  const pool = bank.openings.filter((o) => o.style === style);
  const usable = pool.length > 0 ? pool : bank.openings.filter((o) => o.style === 'ciddi');
  return usable[Math.floor(rng() * usable.length)]!.text;
}

function pickCloser(bank: Bank, style: StyleId, kind: CloserKind, rng: () => number): string {
  const match = bank.closers.filter((c) => c.kind === kind && c.style === style);
  const pool = match.length > 0 ? match : bank.closers.filter((c) => c.kind === kind);
  return pool[Math.floor(rng() * pool.length)]!.text;
}

function pickDetails(bank: Bank, count: number, rng: () => number): Detail[] {
  if (count === 0) return [];
  const start = Math.floor(rng() * bank.details.length);
  const picked: Detail[] = [];
  for (let i = 0; i < count; i++) picked.push(bank.details[(start + i) % bank.details.length]!);
  return picked;
}

/** Kullanıcının yazdığı durum metnini cümle olarak kullanılabilir hale getirir. */
function customSentence(custom: string | undefined): string | null {
  const trimmed = (custom ?? '').trim().replace(/\s+/g, ' ');
  if (!trimmed) return null;
  const withDot = /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
  return `Durum şöyle: ${withDot}`;
}

function composeOne(bank: Bank, input: ComposeInput, strategy: Strategy): VariantDraft {
  const rng = mulberry32(
    hashSeed(input.deviceId, input.target, input.situation, input.channel, input.style, input.intensity, strategy, input.salt),
  );

  const custom = input.situation === 'ozel' ? customSentence(input.situationCustom) : null;
  const opening = custom ?? pickOpening(bank, input.style, rng);
  // spec §10.2: sade = detay yok, duygusal = tek detay, detaylı = şiddete göre 1-3 detay
  const count = strategy === 'sade' ? 0 : strategy === 'duygusal' ? Math.min(1, detailCountFor(input.intensity)) : detailCountFor(input.intensity);
  const details = pickDetails(bank, count, rng);
  const kind: CloserKind = strategy === 'sade' ? 'kisa' : strategy === 'duygusal' ? 'empati' : 'normal';
  const closer = pickCloser(bank, input.style, kind, rng);

  const parts = [opening, ...details.map((d) => d.text), closer];
  const kept: string[] = [];
  for (const part of parts) {
    const normalized = normalizeSentence(part);
    if (normalized.length === 0) continue;
    if (kept.some((k) => normalizeSentence(k).includes(normalized) || normalized.includes(normalizeSentence(k)))) {
      continue;
    }
    kept.push(part);
  }

  const text = kept.join(' ').replace(/\s+/g, ' ').trim();
  const tags = details.map((d) => d.tag);

  return {
    strategy,
    text,
    detailTags: tags,
    selectedDetails: details,
    hasSecondPerson: tags.includes('ikinci_kisi'),
    hasLocation: tags.includes('konum'),
  };
}

export function compose(input: ComposeInput): VariantDraft[] {
  const bank = banks[input.situation];
  if (!bank) throw new Error(`Banka yok: ${input.situation}`);
  return STRATEGIES.map((strategy) => composeOne(bank, input, strategy));
}
