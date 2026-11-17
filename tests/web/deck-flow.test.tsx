import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Generator } from '../../src/web/src/screens/Generator.tsx';
import { fillGenerator } from './support/fill.ts';

const variants = [
  { text: 'Birinci metin.', strategy: 'sade', riskScore: 20, riskLevel: 'dusuk', riskReasons: [], queries: [] },
  { text: 'İkinci metin.', strategy: 'detayli', riskScore: 55, riskLevel: 'orta', riskReasons: ['konum'], queries: [{ q: 'Neredeydin?', a: 'Annemde.' }] },
  { text: 'Üçüncü metin.', strategy: 'duygusal', riskScore: 80, riskLevel: 'yuksek', riskReasons: [], queries: [] },
];

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ variants }), { status: 200 })));
});

async function goToDeck() {
  await fillGenerator(userEvent);
  await userEvent.click(screen.getByRole('button', { name: /üret/i }));
  await screen.findByTestId('deck');
  if (screen.queryByTestId('deck-tutorial')) {
    await userEvent.click(screen.getByRole('button', { name: /anladım/i }));
  }
}

describe('üretim akışı: yüklenme → deste → tam ekran', () => {
  it('üretime basınca önce yüklenme ekranı çıkar', async () => {
    let resolve!: (value: Response) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((r) => { resolve = r; })));

    render(<Generator onGenerated={() => {}} />);
    await fillGenerator(userEvent);
    await userEvent.click(screen.getByRole('button', { name: /üret/i }));

    expect(await screen.findByTestId('generating-screen')).toBeInTheDocument();
    expect(screen.getByTestId('gen-active')).toHaveTextContent(/durum değerlendiriliyor/i);

    resolve(new Response(JSON.stringify({ variants }), { status: 200 }));
    expect(await screen.findByTestId('deck')).toBeInTheDocument();
    expect(screen.queryByTestId('generating-screen')).toBeNull();
  });

  it('ilk açılışta kaydırma öğreticisi çıkar, kapatınca bir daha çıkmaz', async () => {
    render(<Generator onGenerated={() => {}} />);
    await fillGenerator(userEvent);
    await userEvent.click(screen.getByRole('button', { name: /üret/i }));

    const tutorial = await screen.findByTestId('deck-tutorial');
    expect(tutorial).toHaveTextContent(/sağa kaydır/i);
    await userEvent.click(screen.getByRole('button', { name: /anladım/i }));
    await waitFor(() => expect(screen.queryByTestId('deck-tutorial')).toBeNull());
    expect(localStorage.getItem('ym_deck_tutorial_seen')).toBe('1');
  });

  it('oklarla alternatifler arasında gezinilir', async () => {
    render(<Generator onGenerated={() => {}} />);
    await goToDeck();

    expect(screen.getByTestId('deck-text')).toHaveTextContent('Birinci metin.');
    await userEvent.click(screen.getByRole('button', { name: /sonraki alternatif/i }));
    expect(screen.getByTestId('deck-text')).toHaveTextContent('İkinci metin.');
    await userEvent.click(screen.getByRole('button', { name: /önceki alternatif/i }));
    expect(screen.getByTestId('deck-text')).toHaveTextContent('Birinci metin.');
  });

  it('destede yalan düzenlenebilir', async () => {
    render(<Generator onGenerated={() => {}} />);
    await goToDeck();

    await userEvent.click(screen.getByRole('button', { name: /yalanı düzenle/i }));
    const area = screen.getByLabelText(/yalan metni/i);
    await userEvent.clear(area);
    await userEvent.type(area, 'Düzenlenmiş metin.');
    await userEvent.click(screen.getByRole('button', { name: /^kaydet$/i }));

    expect(screen.getByTestId('deck-text')).toHaveTextContent('Düzenlenmiş metin.');
  });

  it('bunu kullan → tam ekran: sohbet balonları ve yuvarlak eylemler', async () => {
    render(<Generator onGenerated={() => {}} />);
    await goToDeck();

    await userEvent.click(screen.getByRole('button', { name: /sonraki alternatif/i }));
    await userEvent.click(screen.getByRole('button', { name: /bunu kullan/i }));

    const detail = await screen.findByTestId('detail');
    expect(detail).toHaveTextContent('İkinci metin.');

    // soru ve cevap ayrı balonlarda; soruyu soran kişinin adı görünür
    const chat = screen.getByTestId('chat');
    expect(chat).toHaveTextContent('Ayşe');
    expect(chat).toHaveTextContent('sen');
    expect(chat).toHaveTextContent('Neredeydin?');
    expect(chat).toHaveTextContent('Annemde.');

    // yuvarlak eylemler: whatsapp, paylaş, kaydet, yenile, kopyala
    expect(screen.getByRole('button', { name: /whatsapp/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /diğer uygulamalarda paylaş/i })).toBeInTheDocument();
    expect(screen.getByTestId('dock-save')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^yenile$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /metni kopyala/i })).toBeInTheDocument();
  });

  it('kaydet defter çağrısı yapar ve bildirim gösterir', async () => {
    render(<Generator onGenerated={() => {}} />);
    await goToDeck();
    await userEvent.click(screen.getByRole('button', { name: /bunu kullan/i }));
    await screen.findByTestId('detail');
    await userEvent.click(screen.getByTestId('dock-save'));

    expect(await screen.findByText(/deftere eklendi/i)).toBeInTheDocument();
  });

  it('yenile yeni üretim isteği atar', async () => {
    render(<Generator onGenerated={() => {}} />);
    await goToDeck();
    await userEvent.click(screen.getByRole('button', { name: /bunu kullan/i }));
    await screen.findByTestId('detail');

    await userEvent.click(screen.getByRole('button', { name: /^yenile$/i }));
    await waitFor(() => {
      const calls = (fetch as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
      const generateCalls = calls.filter(([url]) => String(url).includes('/api/generate'));
      expect(generateCalls.length).toBeGreaterThanOrEqual(2);
    });
    expect(await screen.findByTestId('deck')).toBeInTheDocument();
  });
});
