export type AiMode = 'off' | 'ollama' | 'openrouter';

export const TARGETS = [
  { id: 'patron', label: 'Patron' },
  { id: 'sevgili', label: 'Sevgili' },
  { id: 'anne', label: 'Anne-baba' },
  { id: 'arkadas', label: 'Arkadaş' },
  { id: 'hoca', label: 'Hoca' },
  { id: 'musteri', label: 'Müşteri' },
  { id: 'ozel', label: 'Özel' },
] as const;
export type TargetId = (typeof TARGETS)[number]['id'];

export const CHANNELS = [
  { id: 'yuz_yuze', label: 'Yüz yüze' },
  { id: 'telefon', label: 'Telefon' },
  { id: 'whatsapp', label: 'WhatsApp' },
] as const;
export type ChannelId = (typeof CHANNELS)[number]['id'];

export const STYLES = [
  { id: 'ciddi', label: 'Ciddi' },
  { id: 'esprili', label: 'Esprili' },
  { id: 'duygusal', label: 'Duygusal' },
  { id: 'resmi', label: 'Resmî' },
] as const;
export type StyleId = (typeof STYLES)[number]['id'];

export const SITUATIONS = [
  { id: 'gec_kaldim', label: 'Geç kaldım' },
  { id: 'gidemedim', label: 'Gidemedim' },
  { id: 'parayi_harcadim', label: 'Parayı harcadım' },
  { id: 'mesaji_gormedim', label: 'Mesajı görmedim' },
  { id: 'plani_bozdum', label: 'Planı bozdum' },
  { id: 'isi_yetistiremedim', label: 'İşi yetiştiremedim' },
  { id: 'ozel', label: 'Kendim yazacağım' },
] as const;
export type SituationId = (typeof SITUATIONS)[number]['id'];

export const STRATEGIES = ['sade', 'detayli', 'duygusal'] as const;
export type Strategy = (typeof STRATEGIES)[number];

export const STATUSES = ['beklemede', 'tuttu', 'tutmadı'] as const;
export type Status = (typeof STATUSES)[number];

/** Kişi adı (kime söylediğin) sınırı. */
export const PERSON_MAX = 40;
/** Kaydın kaynağı: yapay zekâ önerisi mi, kullanıcı kendi mi yazdı. */
export const LIE_SOURCES = ['ai', 'manual'] as const;
/** "Nasıl bir yalan olsun?" alanının sınırı. */
export const HINT_MAX = 140;
export type LieSource = (typeof LIE_SOURCES)[number];

export const INTENSITY_MIN = 1;
export const INTENSITY_MAX = 10;
export const CUSTOM_SITUATION_MAX = 180;

export const DEFAULT_FORM = {
  target: 'arkadas',
  situation: 'gec_kaldim',
  channel: 'whatsapp',
  style: 'ciddi',
  intensity: 5,
} as const;
