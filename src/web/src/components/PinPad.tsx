import { useEffect, useState } from 'react';

type Props = {
  length?: number;
  disabled?: boolean;
  /** 4 hane dolunca çağrılır; hatalıysa false dönmeli. */
  onSubmit: (value: string) => boolean | Promise<boolean>;
  /** Hatalı girişten sonra alanı temizlemek için artan sayaç. */
  resetKey?: number;
};

/** Rakam tuş takımı: 4 hane dolunca kendiliğinden gönderir. */
export function PinPad({ length = 4, disabled = false, onSubmit, resetKey = 0 }: Props) {
  const [value, setValue] = useState('');

  useEffect(() => {
    setValue('');
  }, [resetKey]);

  useEffect(() => {
    if (value.length !== length) return;
    let alive = true;
    void (async () => {
      const ok = await onSubmit(value);
      if (alive && !ok) setValue('');
    })();
    return () => {
      alive = false;
    };
  }, [value, length, onSubmit]);

  function press(digit: string) {
    if (disabled) return;
    setValue((prev) => (prev.length >= length ? prev : prev + digit));
  }

  return (
    <div className="pin-pad">
      <div className="pin-dots" aria-label={`${value.length}/${length}`}>
        {Array.from({ length }).map((_, i) => (
          <span key={i} className={`pin-dot ${i < value.length ? 'is-filled' : ''}`} />
        ))}
      </div>

      <div className="pin-keys">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button key={digit} type="button" className="pin-key" onClick={() => press(digit)} disabled={disabled}>
            {digit}
          </button>
        ))}
        <span className="pin-key is-empty" aria-hidden="true" />
        <button type="button" className="pin-key" onClick={() => press('0')} disabled={disabled}>
          0
        </button>
        <button
          type="button"
          className="pin-key pin-key-soft"
          onClick={() => setValue((prev) => prev.slice(0, -1))}
          aria-label="sil"
          disabled={disabled}
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
