import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Generator } from '../../src/web/src/screens/Generator.tsx';

const variants = [
  {
    text: 'trafik vardı gelemedim',
    strategy: 'sade',
    riskScore: 30,
    riskLevel: 'dusuk',
    riskReasons: ['basit'],
    queries: [{ q: 'nerede kaldın?', a: 'köprüde' }],
  },
];

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const u = String(url);
      if (u.includes('/api/generate')) return new Response(JSON.stringify({ variants, provider: 'template' }), { status: 200 });
      if (u.includes('/api/lies/people')) return new Response(JSON.stringify({ people: [] }), { status: 200 });
      if (u.includes('/api/lies')) return new Response('nope', { status: 500 });
      return new Response(JSON.stringify({}), { status: 200 });
    }),
  );
});

describe('kayıt hatası', () => {
  it('deftere yazılamazsa kullanıcıya söylenir', async () => {
    render(<Generator onGenerated={() => {}} />);
    await userEvent.type(screen.getByLabelText('Kimin için?'), 'Ayşe');
    await userEvent.type(screen.getByLabelText('Ne oldu?'), 'dün akşam iş çıktı');
    await userEvent.click(screen.getByRole('button', { name: /üret/i }));
    await screen.findByTestId('deck');
    await userEvent.click(screen.getByRole('button', { name: /bunu kullan/i }));
    await screen.findByTestId('detail');

    await userEvent.click(screen.getByTestId('dock-save'));
    expect(await screen.findByText(/kaydedilemedi/i)).toBeInTheDocument();
  });
});
