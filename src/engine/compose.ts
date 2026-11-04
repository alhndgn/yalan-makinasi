import { STRATEGIES, type ChannelId, type SituationId, type Strategy, type StyleId, type TargetId } from '../shared/constants.ts';
import { hashSeed, mulberry32 } from './random.ts';
import { banks, type Bank, type CloserKind, type DetailTag } from './templates/tr.ts';

export type ComposeInput = {
  deviceId: string;
  target: TargetId;
  situation: SituationId;
  channel: ChannelId;
  style: StyleId;
  intensity: number;
  salt: string;
};

export type VariantDraft = {
  strategy: Strategy;
  text: string;
  detailTags: DetailTag[];
  hasSecondPerson: boolean;
  hasLocation: boolean;
};

export function detailCountFor(intensity: number): number {
  return Math.min(3, Math.floor(intensity / 3));
}

function pickOpening(bank: Bank, style: StyleId, rng: () => number): string {
  const pool = bank.openings.filter((o) => o.style === style);
  const usable = pool.length > 0 ? pool : bank.openings.filter((o) => o.style === 'ciddi');
  const idx = Math.floor(rng() * usable.length);
  return usable[idx]!.text;
}

function pickCloser(bank: Bank, style: StyleId, kind: CloserKind, rng: () => number): string {
  const match = bank.closers.filter((c) => c.kind === kind && c.style === style);
  const pool = match.length > 0 ? match : bank.closers.filter((c) => c.kind === kind);
  const idx = Math.floor(rng() * pool.length);
  return pool[idx]!.text;
}

function pickDetails(bank: Bank, count: number, rng: () => number) {
  if (count === 0) return [] as { tag: DetailTag; text: string }[];
  const start = Math.floor(rng() * bank.details.length);
  const picked: { tag: DetailTag; text: string }[] = [];
  for (let i = 0; i < count; i++) {
    picked.push(bank.details[(start + i) % bank.details.length]!);
  }
  return picked;
}

function composeOne(bank: Bank, input: ComposeInput, strategy: Strategy): VariantDraft {
  const rng = mulberry32(
    hashSeed(input.deviceId, input.target, input.situation, input.channel, input.style, input.intensity, strategy, input.salt),
  );
  const opening = pickOpening(bank, input.style, rng);
  const count = strategy === 'sade' ? 0 : detailCountFor(input.intensity);
  const details = pickDetails(bank, count, rng);
  const kind: CloserKind = strategy === 'sade' ? 'kisa' : strategy === 'duygusal' ? 'empati' : 'normal';
  const closer = pickCloser(bank, input.style, kind, rng);

  const text = [opening, ...details.map((d) => d.text), closer].join(' ').replace(/\s+/g, ' ').trim();
  const tags = details.map((d) => d.tag);

  return {
    strategy,
    text,
    detailTags: tags,
    hasSecondPerson: tags.includes('ikinci_kisi'),
    hasLocation: tags.includes('konum'),
  };
}

export function compose(input: ComposeInput): VariantDraft[] {
  const bank = banks[input.situation];
  if (!bank) throw new Error(`Banka yok: ${input.situation}`);
  return STRATEGIES.map((strategy) => composeOne(bank, input, strategy));
}
