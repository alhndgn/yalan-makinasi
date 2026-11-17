import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Settings } from '../../src/web/src/screens/Settings.tsx';

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ deleted: 2 }), { status: 200 })));
});

describe('Settings', () => {
  it('tüm kayıtları siler ve onay ister', async () => {
    const confirmSpy = vi.fn(() => true);
    vi.stubGlobal('confirm', confirmSpy);
    render(<Settings onBack={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /tüm kayıtları sil/i }));
    expect(confirmSpy).toHaveBeenCalled();
    expect(await screen.findByRole('status')).toHaveTextContent(/2 kayıt silindi/i);
  });

  it('KVKK ve kötüye kullanım metni görünür', () => {
    render(<Settings onBack={() => {}} />);
    expect(screen.getByText(/eğlence amaçlıdır/i)).toBeInTheDocument();
    expect(screen.getByText(/KVKK/i)).toBeInTheDocument();
  });

  it('şablon motoru / AI bölümü artık gösterilmez', () => {
    render(<Settings onBack={() => {}} />);
    expect(screen.queryByText(/şablon motoru/i)).toBeNull();
    expect(screen.queryByText(/yerel model/i)).toBeNull();
  });

  it('varsayılan ton seçimi kaydedilir', async () => {
    render(<Settings onBack={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Esprili' }));
    const saved = JSON.parse(localStorage.getItem('ym_defaults') ?? '{}');
    expect(saved.style).toBe('esprili');
  });
});
