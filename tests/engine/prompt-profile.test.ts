import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '../../src/engine/prompt.ts';

describe('kişi profili promptu', () => {
  it('isim, ilişki, cinsiyet ve samimiyeti taşır', () => {
    const prompt = buildSystemPrompt(6, {
      person: 'Ateş',
      profile: { name: 'Ateş', relation: 'sevgili', gender: 'erkek', closeness: 9, notes: 'gece çalışıyor' },
    });
    expect(prompt).toContain('## Kişi: Ateş');
    expect(prompt).toContain('sevgili');
    expect(prompt).toContain('erkek');
    expect(prompt).toContain('9/10');
    expect(prompt).toContain('gece çalışıyor');
    expect(prompt).toContain('çok samimi');
  });

  it('kadın isimde kadın hitabı ister', () => {
    const prompt = buildSystemPrompt(6, {
      person: 'Ayşe',
      profile: { name: 'Ayşe', relation: 'patron', gender: 'kadin', closeness: 4 },
    });
    expect(prompt).toContain('kadın');
    expect(prompt).toContain('abla');
  });

  it('samimiyet düşükse resmî dil ister', () => {
    const prompt = buildSystemPrompt(6, {
      person: 'Mehmet',
      profile: { name: 'Mehmet', relation: 'musteri', gender: 'erkek', closeness: 2 },
    });
    expect(prompt).toContain('mesafeli');
    expect(prompt).toContain('müşteri');
  });

  it('istenen yalan türü (hint) prompta girer', () => {
    const prompt = buildSystemPrompt(6, { person: 'Ayşe', hint: 'ailevi bir mazeret olsun' });
    expect(prompt).toContain('İstenen yalan türü');
    expect(prompt).toContain('ailevi bir mazeret olsun');
  });

  it('profil yoksa kişi bölümü yine de isimle kurulur', () => {
    const prompt = buildSystemPrompt(6, { person: 'Ali' });
    expect(prompt).toContain('## Kişi: Ali');
    expect(prompt).toContain('belirtilmemiş');
  });
});
