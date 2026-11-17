import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Generator } from '../../src/web/src/screens/Generator.tsx';
import { fillGenerator } from './support/fill.ts';

const variants = [
  { text: 'Trafik vardı.', strategy: 'sade', riskScore: 20, riskLevel: 'dusuk', riskReasons: [], queries: [] },
  { text: 'Annemdeydim.', strategy: 'detayli', riskScore: 45, riskLevel: 'orta', riskReasons: [], queries: [{ q: 'Neredeydin?', a: 'Annemde.' }] },
  { text: 'Yolda kaldım.', strategy: 'duygusal', riskScore: 30, riskLevel: 'dusuk', riskReasons: [], queries: [] },
];

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ variants }), { status: 200 })));
});

describe('Generator', () => {
  it('form doldurulunca üretir ve desteye geçer', async () => {
    render(<Generator onGenerated={() => {}} />);
    await fillGenerator(userEvent);
    await userEvent.click(screen.getByRole('button', { name: /üret/i }));

    expect(await screen.findByTestId('deck')).toBeInTheDocument();
    expect(screen.getByTestId('deck-text')).toHaveTextContent('Trafik vardı.');
  });

  it('429 gelirse kullanıcı mesajı gösterir', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: { code: 'RATE_LIMITED', message: 'x' } }), { status: 429 })),
    );
    render(<Generator onGenerated={() => {}} />);
    await fillGenerator(userEvent);
    await userEvent.click(screen.getByRole('button', { name: /üret/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/biraz bekle/i);
  });

  it('ABUSE_BLOCKED mesajı gösterilir', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: { code: 'ABUSE_BLOCKED', message: 'x' } }), { status: 400 })),
    );
    render(<Generator onGenerated={() => {}} />);
    await fillGenerator(userEvent);
    await userEvent.click(screen.getByRole('button', { name: /üret/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/üretemem/i);
  });
});
