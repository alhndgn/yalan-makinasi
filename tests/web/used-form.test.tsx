import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Generator } from '../../src/web/src/screens/Generator.tsx';
import { fillGenerator } from './support/fill.ts';

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
  it('kayıt üretilen kişiye yazılır', async () => {
    render(<Generator onGenerated={() => {}} />);
    await fillGenerator(userEvent, { person: 'Ayşe' });
    await userEvent.click(screen.getByRole('button', { name: /üret/i }));
    await screen.findByTestId('deck');

    await userEvent.click(screen.getByRole('button', { name: /bunu kullan/i }));
    await screen.findByTestId('detail');
    await userEvent.click(screen.getByTestId('dock-save'));

    const calls = (fetch as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
    const save = calls.find(([url]) => String(url).endsWith('/api/lies'))!;
    expect(JSON.parse(String(save[1].body)).form.person).toBe('Ayşe');
  });
});
