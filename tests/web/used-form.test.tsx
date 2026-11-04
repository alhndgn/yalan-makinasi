import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Generator } from '../../src/web/src/screens/Generator.tsx';

const variants = [
  { text: 'Trafik vardı.', strategy: 'sade', riskScore: 20, riskLevel: 'dusuk', riskReasons: [], queries: [] },
  { text: 'Annemdeydim.', strategy: 'detayli', riskScore: 45, riskLevel: 'orta', riskReasons: [], queries: [] },
  { text: 'Yolda kaldım.', strategy: 'duygusal', riskScore: 30, riskLevel: 'dusuk', riskReasons: [], queries: [] },
];

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ variants, provider: 'template' }), { status: 200 })));
});

describe('üretim anındaki form', () => {
  it('üretimden sonra hedef değişse de kayıt üretilen hedefe yazılır', async () => {
    render(<Generator onGenerated={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /üret/i }));
    await screen.findAllByTestId('variant-card');

    // üretimden sonra "Kime?" değiştir
    await userEvent.click(screen.getByRole('button', { name: 'Patron' }));
    await userEvent.click(screen.getAllByRole('button', { name: /defter/i })[0]!);

    const calls = (fetch as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
    const save = calls.find(([url]) => String(url).endsWith('/api/lies'))!;
    expect(JSON.parse(String(save[1].body)).form.target).toBe('arkadas');
  });
});
