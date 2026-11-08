import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TeqSplash } from '../../src/web/src/components/TeqSplash.tsx';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('TeqSplash', () => {
  it('uygulama adını, vaadi ve Teq Studio imzasını gösterir', () => {
    render(<TeqSplash appName="Yalan Makinası" tagline="bir bahane değil, savunulabilir bir hikâye" />);
    expect(screen.getByText('Yalan Makinası')).toBeInTheDocument();
    expect(screen.getByText(/savunulabilir bir hikâye/i)).toBeInTheDocument();
    expect(screen.getByText(/Developed by Teq Studio/i)).toBeInTheDocument();
  });

  it('süre bitince onDone çağrılır', () => {
    const onDone = vi.fn();
    render(<TeqSplash appName="X" tagline="y" onDone={onDone} durationMs={1000} />);
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('hold modunda kapanmaz (tasarım incelemesi)', () => {
    const onDone = vi.fn();
    render(<TeqSplash appName="X" tagline="y" onDone={onDone} hold />);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onDone).not.toHaveBeenCalled();
  });
});
