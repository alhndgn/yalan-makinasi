import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Ledger } from '../../src/web/src/screens/Ledger.tsx';

const DAY = 86_400_000;
const now = Date.now();

const lies = [
  {
    id: 'a',
    person: 'Ayşe',
    source: 'ai',
    channel: 'whatsapp',
    target: 'sevgili',
    situation: 'aile_saglik',
    text: 'annem rahatsızlandı hastaneye götürdüm dün akşam',
    status: 'tuttu',
    riskScore: 40,
    createdAt: now - 2 * DAY,
    queries: [],
  },
  {
    id: 'b',
    person: 'Ayşe',
    source: 'manual',
    channel: 'whatsapp',
    target: 'sevgili',
    situation: 'aile_saglik',
    text: 'dün akşam annem rahatsızlandı hastaneye götürdüm',
    status: 'tutmadı',
    riskScore: 55,
    createdAt: now - 4 * DAY,
    queries: [],
  },
];

const people = [{ person: 'Ayşe', count: 2, lastAt: now, pending: 0, conflicts: 1, targets: ['sevgili'] }];

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const u = String(url);
      if (u.includes('/api/lies/people')) return new Response(JSON.stringify({ people }), { status: 200 });
      if (u.includes('/api/lies/person/')) return new Response(JSON.stringify({ items: lies }), { status: 200 });
      return new Response(JSON.stringify({ items: lies }), { status: 200 });
    }),
  );
});

describe('defter içgörüleri', () => {
  it('kişi ekranında karne ve çelişki şeridi görünür', async () => {
    render(<Ledger />);
    await userEvent.click(await screen.findByText('Ayşe'));

    const card = await screen.findByTestId('profile-card');
    expect(card).toBeInTheDocument();
    expect(screen.getByTestId('danger-gauge')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByTestId('conflict-strip')).toBeInTheDocument();
  });

  it('çelişki şeridine dokununca iki kayıt yan yana gelir', async () => {
    render(<Ledger />);
    await userEvent.click(await screen.findByText('Ayşe'));
    await userEvent.click(await screen.findByTestId('conflict-strip'));

    expect(await screen.findByTestId('conflicts')).toBeInTheDocument();
    expect(screen.getByText('aynı cümle')).toBeInTheDocument();
    expect(screen.getAllByText(/rahatsızlandı/).length).toBeGreaterThanOrEqual(2);
  });

  it('takvim görünümü 30 gün gösterir', async () => {
    render(<Ledger />);
    await screen.findByTestId('people-list');
    await userEvent.click(screen.getByRole('button', { name: 'Takvim' }));

    const cal = await screen.findByTestId('calendar');
    expect(cal.querySelectorAll('.heat-cell')).toHaveLength(30);
  });
});
