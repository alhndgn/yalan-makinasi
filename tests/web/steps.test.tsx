import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Generator } from '../../src/web/src/screens/Generator.tsx';
import { fillGenerator } from './support/fill.ts';

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ variants: [] }), { status: 200 })));
});

describe('tek ekran form', () => {
  it('kimin için kutusunun altında dört hızlı seçenek var', async () => {
    render(<Generator onGenerated={() => {}} />);
    for (const label of ['Anne-baba', 'Arkadaş', 'Patron', 'Sevgili']) {
      expect(await screen.findByRole('button', { name: label })).toBeInTheDocument();
    }
    await userEvent.click(screen.getByRole('button', { name: 'Patron' }));
    expect(screen.getByRole('button', { name: 'Patron' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('ne oldu kısmı serbest metin, hazır durum seçenekleri yok', async () => {
    render(<Generator onGenerated={() => {}} />);
    expect(await screen.findByLabelText(/ne oldu/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Gidemedim' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Parayı harcadım' })).toBeNull();
  });

  it('nasıl bir yalan olsun alanı opsiyonel olarak var', async () => {
    render(<Generator onGenerated={() => {}} />);
    expect(await screen.findByLabelText(/nasıl bir yalan olsun/i)).toBeInTheDocument();
  });

  it('metin yazılmadan üret düğmesi kapalı', async () => {
    render(<Generator onGenerated={() => {}} />);
    expect(await screen.findByRole('button', { name: /üret/i })).toBeDisabled();
  });

  it('ton ve kanal varsayılan olarak gizli, açılınca görünür', async () => {
    render(<Generator onGenerated={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Esprili' })).toBeNull();
    await userEvent.click(await screen.findByRole('button', { name: /ton · kanal/i }));
    expect(screen.getByRole('button', { name: 'Esprili' })).toBeInTheDocument();
  });

  it('form doldurulunca üretim isteği kişi ve serbest metinle gider', async () => {
    render(<Generator onGenerated={() => {}} />);
    await fillGenerator(userEvent, { person: 'Ayşe', text: 'trafik vardı gelemedim' });
    await userEvent.click(screen.getByRole('button', { name: /üret/i }));

    const calls = (fetch as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
    const gen = calls.find(([url]) => String(url).includes('/api/generate'))!;
    const payload = JSON.parse(String(gen[1].body));
    expect(payload).toMatchObject({
      person: 'Ayşe',
      situation: 'ozel',
      situationCustom: 'trafik vardı gelemedim',
    });
  });
});
