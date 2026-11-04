import type { SituationId, StyleId } from '../../shared/constants.ts';

export type DetailTag = 'ulasim' | 'saglik' | 'aile' | 'is' | 'konum' | 'ikinci_kisi';
export type CloserKind = 'kisa' | 'normal' | 'empati';

/** Detay cümlesi, davet ettiği soru ve o detaya ait cevap birlikte durur. */
export type Detail = {
  tag: DetailTag;
  text: string;
  q: string;
  a: string;
};

export type Bank = {
  id: SituationId;
  openings: { style: StyleId; text: string }[];
  details: Detail[];
  closers: { kind: CloserKind; style: StyleId; text: string }[];
};

export const baseClosers = (short: string, normal: string, empathy: string): Bank['closers'] => [
  { kind: 'kisa', style: 'ciddi', text: short },
  { kind: 'kisa', style: 'esprili', text: short },
  { kind: 'kisa', style: 'duygusal', text: short },
  { kind: 'kisa', style: 'resmi', text: short },
  { kind: 'normal', style: 'ciddi', text: normal },
  { kind: 'normal', style: 'esprili', text: normal },
  { kind: 'normal', style: 'duygusal', text: normal },
  { kind: 'normal', style: 'resmi', text: normal },
  { kind: 'empati', style: 'ciddi', text: empathy },
  { kind: 'empati', style: 'esprili', text: empathy },
  { kind: 'empati', style: 'duygusal', text: empathy },
  { kind: 'empati', style: 'resmi', text: empathy },
];
