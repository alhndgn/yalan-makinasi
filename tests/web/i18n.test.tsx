import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readLang, translate, labelFor, monthName, writeLang } from '../../src/web/src/lib/i18n.ts';
import { LanguagePicker } from '../../src/web/src/screens/LanguagePicker.tsx';

beforeEach(() => localStorage.clear());

describe('çeviri sözlüğü', () => {
  it('Türkçe ve İngilizce anahtarları eşleşir', async () => {
    const mod = await import('../../src/web/src/lib/i18n.ts');
    // sözlükler doğrudan export edilmiyor: çeviri üzerinden örnek anahtarları doğrula
    for (const key of ['app.slogan', 'gen.cta', 'ledger.title', 'detail.picked', 'settings.language']) {
      expect(translate('tr', key)).not.toBe(key);
      expect(translate('en', key)).not.toBe(key);
      expect(translate('tr', key)).not.toBe(translate('en', key));
    }
    expect(mod.translate('en', 'gen.cta')).toBe('Generate');
  });

  it('bilinmeyen anahtar Türkçeye düşer', () => {
    expect(translate('en', 'olmayan.anahtar')).toBe('olmayan.anahtar');
  });

  it('parametreleri yerleştirir', () => {
    const text = translate('en', 'deck.queries', { count: 3 });
    expect(text).toContain('3');
  });

  it('etiketler dile göre çevrilir', () => {
    expect(labelFor('tr', 'target', 'patron')).toBe('Patron');
    expect(labelFor('en', 'target', 'patron')).toBe('Boss');
    expect(labelFor('en', 'situation', 'gec_kaldim')).toBe('I was late');
    expect(labelFor('en', 'channel', 'whatsapp')).toBe('WhatsApp');
  });

  it('ay adları dile göre', () => {
    expect(monthName('tr', 0)).toBe('Oca');
    expect(monthName('en', 0)).toBe('Jan');
  });

  it('dil kalıcı olarak saklanır', () => {
    expect(readLang()).toBeNull();
    writeLang('en');
    expect(readLang()).toBe('en');
  });
});

describe('dil seçimi ekranı', () => {
  it('iki seçenek sunar ve seçimi iletir', async () => {
    const picked: string[] = [];
    render(<LanguagePicker onPick={(lang) => picked.push(lang)} />);

    expect(screen.getByTestId('language-picker')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('pick-en'));
    await userEvent.click(screen.getByTestId('pick-tr'));

    expect(picked).toEqual(['en', 'tr']);
  });
});
