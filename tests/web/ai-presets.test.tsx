import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { Settings } from '../../src/web/src/screens/Settings.tsx';
import { readAiConfig } from '../../src/web/src/lib/aiConfig.ts';

beforeEach(() => localStorage.clear());

describe('AI hazır ayarları', () => {
  it('opencode-go düğmesi adres ve modeli doldurur', async () => {
    render(<Settings aiMode="off" onBack={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /opencode-go/i }));
    const cfg = readAiConfig();
    expect(cfg.baseUrl).toBe('https://api.yelsoft.online/v1');
    expect(cfg.model).toBe('ollamacloud/deepseek-v4.1-flash');
  });

  it('yerel VM düğmesi adresi doldurur', async () => {
    render(<Settings aiMode="off" onBack={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /yerel vm/i }));
    expect(readAiConfig().baseUrl).toBe('http://192.168.1.12/ai/v1');
  });
});
