import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Generator } from '../../src/web/src/screens/Generator.tsx';

const variants = [
  { text: 'Trafik vardı.', strategy: 'sade', riskScore: 20, riskLevel: 'dusuk', riskReasons: [], queries: [] },
  { text: 'Annemdeydim.', strategy: 'detayli', riskScore: 45, riskLevel: 'orta', riskReasons: ['konum'], queries: [{ q: 'Neredeydin?', a: 'Annemde.' }] },
  { text: 'Yolda kaldım.', strategy: 'duygusal', riskScore: 30, riskLevel: 'dusuk', riskReasons: [], queries: [] },
];

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ variants }), { status: 200 })),
  );
});

describe('Generator', () => {
  it('üret butonu varsayılanlarla istek atar ve 3 kart gösterir', async () => {
    render(<Generator onGenerated={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /üret/i }));
    expect(screen.getAllByTestId('variant-card')).toHaveLength(3);

    const calls = (fetch as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
    const generateCall = calls.find(([url]) => String(url).includes('/api/generate'))!;
    const body = JSON.parse(String(generateCall[1].body));
    expect(body).toMatchObject({ target: 'arkadas', channel: 'whatsapp', style: 'ciddi', intensity: 5 });
  });

  it('429 gelirse kullanıcı mesajı gösterir', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: { code: 'RATE_LIMITED', message: 'x' } }), { status: 429 })),
    );
    render(<Generator onGenerated={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /üret/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/biraz bekle/i);
  });

  it('ABUSE_BLOCKED mesajı gösterilir', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: { code: 'ABUSE_BLOCKED', message: 'x' } }), { status: 400 })),
    );
    render(<Generator onGenerated={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /üret/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/üretemem/i);
  });
});
