import type { SituationId } from '../../shared/constants.ts';
import type { Bank } from './types.ts';
import { gecKaldim } from './tr/gec_kaldim.ts';
import { gidemedim } from './tr/gidemedim.ts';
import { isiYetistiremedim } from './tr/isi_yetistiremedim.ts';
import { mesajiGormedim } from './tr/mesaji_gormedim.ts';
import { ozel } from './tr/ozel.ts';
import { parayiHarcadim } from './tr/parayi_harcadim.ts';
import { planiBozdum } from './tr/plani_bozdum.ts';

export type { Bank, CloserKind, Detail, DetailTag } from './types.ts';

export const banks: Record<SituationId, Bank> = {
  gec_kaldim: gecKaldim,
  gidemedim,
  parayi_harcadim: parayiHarcadim,
  mesaji_gormedim: mesajiGormedim,
  plani_bozdum: planiBozdum,
  isi_yetistiremedim: isiYetistiremedim,
  ozel,
};
