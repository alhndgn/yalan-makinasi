import { useState } from 'react';
import { PinPad } from './PinPad.tsx';
import { useI18n } from '../lib/lang.tsx';

type Props = {
  /** Mevcut PIN'i değiştirirken true: kayıt zaten var. */
  changing?: boolean;
  onDone: (pin: string) => Promise<void> | void;
  onCancel: () => void;
};

/** Yeni PIN belirleme: iki adım (gir → doğrula). */
export function PinSetup({ changing = false, onDone, onCancel }: Props) {
  const { t } = useI18n();
  const [first, setFirst] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);

  async function submit(pin: string): Promise<boolean> {
    if (!first) {
      setFirst(pin);
      setError(null);
      return true;
    }
    if (pin !== first) {
      setError(t('pin.mismatch'));
      setFirst(null);
      setResetKey((k) => k + 1);
      return false;
    }
    await onDone(pin);
    return true;
  }

  return (
    <div className="pin-setup" data-testid="pin-setup">
      <p className="label">{changing ? t('pin.changeTitle') : t('pin.createTitle')}</p>
      <p className="small muted">{first ? t('pin.confirmBody') : t('pin.createBody')}</p>
      <PinPad onSubmit={submit} resetKey={resetKey} />
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
      <button type="button" className="ghost" onClick={onCancel}>
        {t('pin.cancel')}
      </button>
    </div>
  );
}
