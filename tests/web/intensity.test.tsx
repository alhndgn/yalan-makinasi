import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { IntensitySlider } from '../../src/web/src/components/IntensitySlider.tsx';
import { intensityBand } from '../../src/web/src/lib/intensity.ts';

describe('IntensitySlider', () => {
  it('bant etiketleri doğru', () => {
    expect(intensityBand(1).label).toBe('Beyaz yalan');
    expect(intensityBand(6).label).toBe('Kıvırma');
    expect(intensityBand(10).label).toBe('Senaryo');
  });

  it('ok tuşu değeri artırır ve sınırda durur', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<IntensitySlider value={10} onChange={onChange} />);
    const slider = screen.getByRole('slider');
    await userEvent.click(slider);
    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith(10);

    rerender(<IntensitySlider value={5} onChange={onChange} />);
    await userEvent.click(slider);
    await userEvent.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenLastCalledWith(4);
  });

  it('aria değerleri ve etiket görünür', () => {
    render(<IntensitySlider value={7} onChange={() => {}} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuemin', '1');
    expect(slider).toHaveAttribute('aria-valuemax', '10');
    expect(slider).toHaveAttribute('aria-valuenow', '7');
    expect(slider).toHaveAttribute('aria-valuetext', 'Cesur');
  });
});
