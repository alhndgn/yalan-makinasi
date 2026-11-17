import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Ledger } from '../../src/web/src/screens/Ledger.tsx';

const people = [
  { person: 'Ayşe', count: 2, lastAt: Date.now(), pending: 1, conflicts: 1, targets: ['sevgili'] },
  { person: 'Patron Mehmet', count: 1, lastAt: Date.now() - 86400000, pending: 0, conflicts: 0, targets: ['patron'] },
];

const liesForAyse = [
  {
    id: 'l1',
    person: 'Ayşe',
    source: 'ai',
    channel: 'whatsapp',
    target: 'sevgili',
    situation: 'gec_kaldim',
    text: 'trafik vardı, köprüde kaldım.',
    status: 'beklemede',
    riskScore: 42,
    createdAt: 1_760_000_000_000,
    queries: [{ q: 'kiminleydin?', a: 'annemdeydim işte' }],
  },
  {
    id: 'l2',
    person: 'Ayşe',
    source: 'manual',
    channel: 'yuz_yuze',
    target: 'sevgili',
    situation: 'gidemedim',
    text: 'işten çıkamadım.',
    status: 'tuttu',
    riskScore: 30,
    createdAt: 1_759_000_000_000,
    queries: [],
  },
];

function stub(method = 'GET', url = '') {
  if (url.includes('/api/lies/people')) return { people };
  if (url.includes('/api/lies/person/')) return { items: liesForAyse };
  if (method === 'GET' && url.startsWith('/api/lies')) return { items: liesForAyse };
  if (url.includes('/api/lies/manual')) return { id: 'yeni' };
  if (url.includes('/api/lies/')) return { ok: true };
  return {};
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      return new Response(JSON.stringify(stub(method, String(url))), { status: 200 });
    }),
  );
});

describe('Yalan Defteri', () => {
  it('kişileri kayıt sayısıyla listeler', async () => {
    render(<Ledger />);
    expect(await screen.findByText('Ayşe')).toBeInTheDocument();
    expect(screen.getByText('Patron Mehmet')).toBeInTheDocument();
    expect(screen.getByTestId('people-list')).toBeInTheDocument();
  });

  it('kişiye dokununca o kişiye söylenenler listelenir', async () => {
    render(<Ledger />);
    await userEvent.click(await screen.findByText('Ayşe'));
    expect(await screen.findByTestId('person-lies')).toBeInTheDocument();
    expect(screen.getByText(/trafik vardı/)).toBeInTheDocument();
    expect(screen.getByText(/işten çıkamadım/)).toBeInTheDocument();
  });

  it('kayıt detayında "ne diyeyim" cevabı hazırlanır (AI kapalıyken şablon)', async () => {
    render(<Ledger />);
    await userEvent.click(await screen.findByText('Ayşe'));
    await userEvent.click(await screen.findByText(/trafik vardı/));
    expect(await screen.findByTestId('lie-detail')).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText(/kiminleydin/i), 'kiminleydin?');
    await userEvent.click(screen.getByRole('button', { name: /cevap hazırla/i }));

    expect(await screen.findByTestId('answer')).toHaveTextContent(/annemdeydim/i);
  });

  it('yeni yalan kaydedince manual ucu çağrılır', async () => {
    render(<Ledger />);
    await userEvent.click(await screen.findByRole('button', { name: /kaydet/i }));
    await userEvent.type(screen.getByLabelText(/kime/i), 'Kardeşim');
    await userEvent.type(screen.getByLabelText(/ne söyledin/i), 'Arabayı ben almadım.');
    await userEvent.click(screen.getByRole('button', { name: /deftere ekle/i }));

    await waitFor(() => {
      const calls = (fetch as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
      const save = calls.find(([url]) => String(url).includes('/api/lies/manual'));
      expect(save).toBeTruthy();
      expect(JSON.parse(String(save![1].body)).person).toBe('Kardeşim');
    });
  });

  it('boş defterde yönlendirme gösterir', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const empty = String(url).includes('/people') ? { people: [] } : { items: [] };
        return new Response(JSON.stringify(empty), { status: 200 });
      }),
    );
    render(<Ledger />);
    expect(await screen.findByText('Defter boş')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /yalan kaydet/i })).toBeInTheDocument();
  });
});
