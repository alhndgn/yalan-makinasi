import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Generator } from '../../src/web/src/screens/Generator.tsx';

const variants = [
  { text: 'Birinci metin.', strategy: 'sade', riskScore: 20, riskLevel: 'dusuk', riskReasons: [], queries: [] },
  { text: 'İkinci metin.', strategy: 'detayli', riskScore: 55, riskLevel: 'orta', riskReasons: ['konum'], queries: [{ q: 'Neredeydin?', a: 'Annemde.' }] },
  { text: 'Üçüncü metin.', strategy: 'duygusal', riskScore: 80, riskLevel: 'yuksek', riskReasons: [], queries: [] },
];

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ variants }), { status: 200 })));
});

describe('üretim akışı: yüklenme → deste → tam ekran', () => {
  it('üretime basınca önce yüklenme ekranı çıkar', async () => {
    let resolve!: (value: Response) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((r) => { resolve = r; })));

    render(<Generator onGenerated={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /üret/i }));

    expect(await screen.findByTestId('generating-screen')).toBeInTheDocument();
    expect(screen.getByTestId('gen-active')).toBeInTheDocument();

    resolve(new Response(JSON.stringify({ variants }), { status: 200 }));
    expect(await screen.findByTestId('deck')).toBeInTheDocument();
    expect(screen.queryByTestId('generating-screen')).toBeNull();
  });

  it('oklarla alternatifler arasında gezinilir', async () => {
    render(<Generator onGenerated={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /üret/i }));
    await screen.findByTestId('deck');

    expect(screen.getByTestId('deck-text')).toHaveTextContent('Birinci metin.');
    await userEvent.click(screen.getByRole('button', { name: /sonraki alternatif/i }));
    expect(screen.getByTestId('deck-text')).toHaveTextContent('İkinci metin.');
    await userEvent.click(screen.getByRole('button', { name: /önceki alternatif/i }));
    expect(screen.getByTestId('deck-text')).toHaveTextContent('Birinci metin.');
  });

  it('bunu kullan → tam ekran; kartlara dön → deste', async () => {
    render(<Generator onGenerated={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /üret/i }));
    await screen.findByTestId('deck');

    await userEvent.click(screen.getByRole('button', { name: /sonraki alternatif/i }));
    await userEvent.click(screen.getByRole('button', { name: /bunu kullan/i }));

    const detail = await screen.findByTestId('detail');
    expect(detail).toHaveTextContent('İkinci metin.');
    expect(detail).toHaveTextContent('Neredeydin?');

    await userEvent.click(screen.getAllByRole('button', { name: /kartlara dön/i })[0]!);
    expect(await screen.findByTestId('deck')).toBeInTheDocument();
  });

  it('kaydet defter çağrısı yapar ve bildirim gösterir', async () => {
    render(<Generator onGenerated={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /üret/i }));
    await screen.findByTestId('deck');
    await userEvent.click(screen.getByRole('button', { name: /bunu kullan/i }));
    await screen.findByTestId('detail');
    await userEvent.click(screen.getByRole('button', { name: /defter/i }));

    expect(await screen.findByRole('status')).toHaveTextContent(/kaydedildi/i);
  });

  it('başka üret yüklenme ekranına döner', async () => {
    render(<Generator onGenerated={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /üret/i }));
    await screen.findByTestId('deck');
    await userEvent.click(screen.getByRole('button', { name: /bunu kullan/i }));
    await screen.findByTestId('detail');

    await userEvent.click(screen.getByRole('button', { name: /başka üret/i }));
    await waitFor(() => expect(screen.queryByTestId('detail')).toBeNull());
  });
});
