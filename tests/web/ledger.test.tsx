import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Ledger } from '../../src/web/src/screens/Ledger.tsx';

const items = [
  { id: 'l1', target: 'sevgili', text: 'Annem rahatsızdı.', status: 'beklemede', riskScore: 40, createdAt: 1700000000000, situation: 'gidemedim' },
];

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ items }), { status: 200 })));
});

describe('Ledger', () => {
  it('kayıtları listeler', async () => {
    render(<Ledger conflicts={[]} />);
    expect(await screen.findByText('Annem rahatsızdı.')).toBeInTheDocument();
  });

  it('boş defterde boş durum gösterir', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ items: [] }), { status: 200 })));
    render(<Ledger conflicts={[]} />);
    expect(await screen.findByText(/defter boş/i)).toBeInTheDocument();
  });

  it('çelişki varsa uyarı bandı görünür', async () => {
    render(<Ledger conflicts={[{ lieId: 'l1', createdAt: 1700000000000, text: 'Annem rahatsızdı.' }]} />);
    expect(await screen.findByRole('status')).toHaveTextContent(/çeliş/i);
  });

  it('durum rozetine tıklayınca sunucuya yazar', async () => {
    render(<Ledger conflicts={[]} />);
    const badge = await screen.findByRole('button', { name: /beklemede/i });
    await userEvent.click(badge);
    const calls = (fetch as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
    const patchCall = calls.find(([, init]) => init?.method === 'PATCH');
    expect(patchCall).toBeTruthy();
  });
});
