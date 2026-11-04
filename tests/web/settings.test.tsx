import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Settings } from '../../src/web/src/screens/Settings.tsx';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ deleted: 2 }), { status: 200 })));
});

describe('Settings', () => {
  it('tüm kayıtları siler ve onay ister', async () => {
    const confirmSpy = vi.fn(() => true);
    vi.stubGlobal('confirm', confirmSpy);
    render(<Settings aiMode="off" onBack={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /tüm kayıtları sil/i }));
    expect(confirmSpy).toHaveBeenCalled();
    expect(await screen.findByRole('status')).toHaveTextContent(/2 kayıt silindi/i);
  });

  it('KVKK ve kötüye kullanım metni görünür', () => {
    render(<Settings aiMode="off" onBack={() => {}} />);
    expect(screen.getByText(/eğlence amaçlıdır/i)).toBeInTheDocument();
    expect(screen.getByText(/KVKK/i)).toBeInTheDocument();
  });

  it('AI modunu gösterir', () => {
    render(<Settings aiMode="ollama" onBack={() => {}} />);
    expect(screen.getByText(/yerel model/i)).toBeInTheDocument();
  });
});
