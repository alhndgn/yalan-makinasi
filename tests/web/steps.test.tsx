import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Generator } from '../../src/web/src/screens/Generator.tsx';

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ variants: [], provider: 'template' }), { status: 200 })));
});

describe('üç adımlı akış', () => {
  it('hedef seçilince birinci adım kapanır, ikinci adım açılır', async () => {
    render(<Generator onGenerated={() => {}} />);

    // başlangıç: 1. adım açık (tüm hedefler görünür)
    expect(screen.getByRole('button', { name: 'Anne-baba' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Patron' }));

    // 1. adım kapandı: diğer hedefler DOM'da yok
    expect(screen.queryByRole('button', { name: 'Anne-baba' })).toBeNull();
    // 2. adım açıldı: durum çipleri görünür
    expect(screen.getByRole('button', { name: 'Gidemedim' })).toBeInTheDocument();
  });

  it('kapalı adıma dokununca yeniden açılır', async () => {
    render(<Generator onGenerated={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Patron' }));
    await userEvent.click(screen.getByRole('button', { name: /Kime/i }));
    expect(screen.getByRole('button', { name: 'Anne-baba' })).toBeInTheDocument();
  });

  it('ton ve kanal varsayılan olarak gizli, açılınca görünür', async () => {
    render(<Generator onGenerated={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Esprili' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: /Ton · Kanal/i }));
    expect(screen.getByRole('button', { name: 'Esprili' })).toBeInTheDocument();
  });
});
