import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, buildAnswerPrompt, fallbackAnswer } from '../../src/engine/prompt.ts';

const history = [
  { text: 'geçen hafta trafik vardı dedim', situation: 'gec_kaldim', createdAt: 1_760_000_000_000 },
  { text: 'annem rahatsızdı', situation: 'gidemedim', createdAt: 1_759_000_000_000 },
];

describe('AI geçmişi', () => {
  it('kişiye ait geçmiş prompta girer', () => {
    const prompt = buildSystemPrompt(6, { person: 'Ayşe', history });
    expect(prompt).toContain('Geçmiş (Ayşe)');
    expect(prompt).toContain('geçen hafta trafik vardı dedim');
    expect(prompt).toContain('ÇELİŞME');
  });

  it('geçmiş yoksa "ilk kez" der', () => {
    const prompt = buildSystemPrompt(4, { person: 'Mehmet', history: [] });
    expect(prompt.toLowerCase()).toContain('ilk kez');
  });

  it('kişi yoksa geçmiş bölümü eklenmez', () => {
    expect(buildSystemPrompt(3)).not.toContain('## Geçmiş');
  });

  it('geçmiş en fazla 5 kayıt taşır', () => {
    const many = Array.from({ length: 9 }, (_, i) => ({
      text: `kayit ${i}`,
      situation: 'gec_kaldim',
      createdAt: 1_760_000_000_000 + i,
    }));
    const prompt = buildSystemPrompt(5, { person: 'Ali', history: many });
    expect(prompt).toContain('kayit 0');
    expect(prompt).not.toContain('kayit 6');
  });
});

describe('"Ne diyeyim" cevabı', () => {
  it('prompt metni ve soruyu taşır', () => {
    const prompt = buildAnswerPrompt({ lieText: 'trafik vardı', question: 'kiminleydin?', person: 'Ayşe' });
    expect(prompt).toContain('trafik vardı');
    expect(prompt).toContain('kiminleydin?');
    expect(prompt).toContain('ÇELİŞMEYEN');
  });

  it('AI yoksa en yakın soru-cevabı seçer', () => {
    const answer = fallbackAnswer(
      'kiminleydin sen?',
      [{ q: 'kiminleydin?', a: 'annemdeydim işte' }],
      'trafik vardı, gelemedim.',
    );
    expect(answer).toBe('annemdeydim işte');
  });

  it('eşleşme yoksa metne dayanan genel cevap verir', () => {
    const answer = fallbackAnswer('neden geç kaldın?', [], 'trafik vardı, gelemedim.');
    expect(answer).toMatch(/trafik vardı/);
  });
});
