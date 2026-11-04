const BLOCKED = [
  'doktor raporu',
  'sağlık raporu',
  'saglik raporu',
  'resmî belge',
  'resmi belge',
  'izin kağıdı',
  'izin kâğıdı',
  'sahte belge',
  'imza',
  'fatura',
  'ehliyet',
  'mahkeme',
  'savcılık',
  'nüfus kayıt',
  'diploma',
];

export function isAbusive(text: string | null | undefined): boolean {
  if (!text) return false;
  const normalized = text.toLocaleLowerCase('tr-TR');
  return BLOCKED.some((word) => normalized.includes(word));
}
