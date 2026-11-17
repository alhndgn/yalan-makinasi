import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Generator } from '../../src/web/src/screens/Generator.tsx';
import { fillGenerator } from './support/fill.ts';

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ variants: [], provider: 'template' }), { status: 200 })));
});

describe('kayıtlı varsayılanlar', () => {
  it('ayarlarda seçilen ton ve şiddet üretim isteğine yansır', async () => {
    localStorage.setItem('ym_defaults', JSON.stringify({ style: 'esprili', intensity: 8 }));
    render(<Generator onGenerated={() => {}} />);
    await fillGenerator(userEvent);
    await userEvent.click(screen.getByRole('button', { name: /üret/i }));

    const calls = (fetch as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
    const gen = calls.find(([url]) => String(url).includes('/api/generate'))!;
    const payload = JSON.parse(String(gen[1].body));
    expect(payload.style).toBe('esprili');
    expect(payload.intensity).toBe(8);
  });

  it('bozuk ayar kaydı üretimi bozmaz', async () => {
    localStorage.setItem('ym_defaults', '{bozuk');
    render(<Generator onGenerated={() => {}} />);
    await fillGenerator(userEvent);
    await userEvent.click(screen.getByRole('button', { name: /üret/i }));
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
