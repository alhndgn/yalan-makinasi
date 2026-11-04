import { describe, it, expect } from 'vitest';
import { compose } from '../../src/engine/compose.ts';

const base = {
  deviceId: 'd',
  target: 'arkadas',
  situation: 'ozel',
  channel: 'whatsapp',
  style: 'ciddi',
  intensity: 5,
  salt: '0',
} as const;

describe('özel durum metni', () => {
  it('kullanıcının yazdığı durum metne girer', () => {
    const drafts = compose({ ...base, situationCustom: 'köpeğim kaçtı' });
    expect(drafts[0]!.text.toLowerCase()).toContain('köpeğim kaçtı');
  });

  it('durum metni yoksa banka metni kullanılır', () => {
    const drafts = compose({ ...base, situationCustom: '' });
    expect(drafts[0]!.text.length).toBeGreaterThan(10);
  });
});
