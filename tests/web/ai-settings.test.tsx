import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Settings } from '../../src/web/src/screens/Settings.tsx';
import { readAiConfig } from '../../src/web/src/lib/aiConfig.ts';

const ok = {
  choices: [{ message: { content: JSON.stringify({ variants: [
    { text: 'a', strategy: 'sade', riskScore: 10, riskLevel: 'dusuk', riskReasons: [], queries: [] },
    { text: 'b', strategy: 'detayli', riskScore: 20, riskLevel: 'dusuk', riskReasons: [], queries: [] },
    { text: 'c', strategy: 'duygusal', riskScore: 30, riskLevel: 'dusuk', riskReasons: [], queries: [] },
  ] }) } }],
};

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe('Ayarlar · AI sunucusu', () => {
  it('adres ve model kaydedilir', async () => {
    render(<Settings aiMode="off" onBack={() => {}} />);
    await userEvent.type(screen.getByPlaceholderText(/192\.168\.1\.12/i), 'http://192.168.1.12/ai/v1');
    expect(readAiConfig().baseUrl).toBe('http://192.168.1.12/ai/v1');
  });

  it('bağlantı testi başarılıysa süre gösterir', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(ok), { status: 200 })));
    render(<Settings aiMode="off" onBack={() => {}} />);
    await userEvent.type(screen.getByPlaceholderText(/192\.168\.1\.12/i), 'http://192.168.1.12/ai/v1');
    await userEvent.click(screen.getByRole('button', { name: /bağlantıyı test et/i }));
    expect(await screen.findByRole('status')).toHaveTextContent(/bağlantı tamam/i);
  });

  it('başarısız testte sebep gösterilir', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('boom', { status: 503 })));
    render(<Settings aiMode="off" onBack={() => {}} />);
    await userEvent.type(screen.getByPlaceholderText(/192\.168\.1\.12/i), 'http://192.168.1.12/ai/v1');
    await userEvent.click(screen.getByRole('button', { name: /bağlantıyı test et/i }));
    expect(await screen.findByRole('status')).toHaveTextContent(/bağlanamadım/i);
  });
});
