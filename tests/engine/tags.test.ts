import { describe, it, expect } from 'vitest';
import { extractDetailTags } from '../../src/engine/tags.ts';

describe('extractDetailTags', () => {
  it('metinde geçen detay cümlelerinin etiketlerini döner', () => {
    const text = 'Geç kaldım. Yolda trafik vardı. Annem rahatsızlandı, yanında kalmam gerekti. Kusura bakma.';
    expect(extractDetailTags('gec_kaldim', text).sort()).toEqual(['aile', 'ulasim']);
  });
  it('detay yoksa boş döner', () => {
    expect(extractDetailTags('gec_kaldim', 'Kusura bakma.')).toEqual([]);
  });
});
