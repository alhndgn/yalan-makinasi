import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GeneratingScreen } from '../../src/web/src/components/GeneratingScreen.tsx';

describe('yüklenme ekranı', () => {
  it('ilerleme zamana bağlı: geç başlamışsa kaldığı adımdan devam eder', () => {
    render(<GeneratingScreen estimateMs={16000} startedAt={Date.now() - 9000} />);
    const active = screen.getByTestId('gen-active');
    expect(active.textContent).not.toMatch(/durum değerlendiriliyor/);
    const bar = document.querySelector('.gen-bar i') as HTMLElement;
    expect(Number.parseInt(bar.style.width, 10)).toBeGreaterThan(40);
  });

  it('yeni başlamışsa ilk adımda', () => {
    render(<GeneratingScreen estimateMs={16000} startedAt={Date.now()} />);
    expect(screen.getByTestId('gen-active').textContent).toMatch(/durum değerlendiriliyor/);
  });
});
