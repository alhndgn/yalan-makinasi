import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { VariantCard } from '../../src/web/src/components/VariantCard.tsx';

const v = {
  text: 'Trafik vardı, kusura bakma.',
  strategy: 'sade' as const,
  riskScore: 20,
  riskLevel: 'dusuk' as const,
  riskReasons: ['konum kontrol edilebilir'],
  queries: [{ q: 'Neredeydin?', a: 'Yolda.' }],
};

describe('VariantCard', () => {
  it('risk seviyesini ve sorguları gösterir', () => {
    render(<VariantCard variant={v} onSave={vi.fn()} onRegenerate={vi.fn()} />);
    expect(screen.getByText(/düşük/i)).toBeInTheDocument();
    expect(screen.getByText('Neredeydin?')).toBeInTheDocument();
  });

  it('HTML içeren metin çalışmaz, düz yazı olarak görünür', () => {
    render(<VariantCard variant={{ ...v, text: '<img src=x onerror=alert(1)>' }} onSave={vi.fn()} onRegenerate={vi.fn()} />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByTestId('variant-text').textContent).toContain('<img');
  });

  it('kaydet ve yeniden üret çağrılır', async () => {
    const onSave = vi.fn();
    const onRegen = vi.fn();
    render(<VariantCard variant={v} onSave={onSave} onRegenerate={onRegen} />);
    await userEvent.click(screen.getByRole('button', { name: /defter/i }));
    await userEvent.click(screen.getByRole('button', { name: /yeniden/i }));
    expect(onSave).toHaveBeenCalledOnce();
    expect(onRegen).toHaveBeenCalledOnce();
  });

  it('kopyala panoya yazar', async () => {
    const writeText = vi.fn(async () => {});
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    render(<VariantCard variant={v} onSave={vi.fn()} onRegenerate={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /kopyala/i }));
    expect(writeText).toHaveBeenCalledWith(v.text);
  });
});
