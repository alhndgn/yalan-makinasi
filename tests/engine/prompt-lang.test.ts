import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, buildAnswerPrompt } from '../../src/engine/prompt.ts';

describe('prompt dili', () => {
  it('İngilizce seçilince çıktı dilini İngilizce ister', () => {
    const prompt = buildSystemPrompt(6, { person: 'Sarah', lang: 'en' });
    expect(prompt).toContain('ENGLISH');
    expect(prompt).toContain('Spinning it');
    expect(prompt).toContain('## Person: Sarah');
    expect(prompt).not.toContain('## Kişi:');
  });

  it('Türkçe varsayılan', () => {
    const prompt = buildSystemPrompt(6, { person: 'Ayşe' });
    expect(prompt).toContain('TÜRKÇE');
    expect(prompt).toContain('## Kişi: Ayşe');
  });

  it('İngilizce cevap promptu da İngilizce', () => {
    const prompt = buildAnswerPrompt({ lieText: 'traffic was bad', question: 'who were you with?', lang: 'en' });
    expect(prompt).toContain('writing in English');
    expect(prompt).toContain('traffic was bad');
  });

  it('Türkçe cevap promptu değişmedi', () => {
    const prompt = buildAnswerPrompt({ lieText: 'trafik vardı', question: 'kiminleydin?' });
    expect(prompt).toContain('ÇELİŞMEYEN');
  });
});
