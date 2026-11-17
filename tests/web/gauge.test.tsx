import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { IntensityGauge } from '../../src/web/src/components/IntensityGauge.tsx';

describe('ibre (şiddet göstergesi)', () => {
  it('değeri ve bandı gösterir', () => {
    render(<IntensityGauge value={6} onChange={vi.fn()} />);
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '6');
    expect(screen.getByText(/kıvırma/i)).toBeInTheDocument();
  });

  it('klavye ile artırılıp azaltılır', async () => {
    const onChange = vi.fn();
    render(<IntensityGauge value={5} onChange={onChange} />);
    const slider = screen.getByRole('slider');

    slider.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith(6);

    await userEvent.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenLastCalledWith(4);

    await userEvent.keyboard('{End}');
    expect(onChange).toHaveBeenLastCalledWith(10);

    await userEvent.keyboard('{Home}');
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it('sınırların dışına çıkmaz', async () => {
    const onChange = vi.fn();
    render(<IntensityGauge value={10} onChange={onChange} />);
    screen.getByRole('slider').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith(10);
  });
});
