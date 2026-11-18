import { useEffect, useState } from 'react';
import { PinPad } from '../components/PinPad.tsx';
import { YalanMark } from '../components/YalanMark.tsx';
import { useI18n } from '../lib/lang.tsx';
import { clearPin, forgotMailUrl, lockedSeconds, markUnlocked, verifyPin } from '../lib/lock.ts';

type Props = { onUnlock: () => void };

/** Uygulama kilidi: 4 haneli PIN. "Unuttum" → destek e-postası. */
export function LockScreen({ onUnlock }: Props) {
  const { t, lang } = useI18n();
  const [error, setError] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [wait, setWait] = useState(() => lockedSeconds());
  const [showForgot, setShowForgot] = useState(false);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setInterval(() => setWait(lockedSeconds()), 1000);
    return () => clearInterval(timer);
  }, [wait]);

  async function submit(pin: string): Promise<boolean> {
    if (lockedSeconds() > 0) return false;
    const ok = await verifyPin(pin);
    if (ok) {
      markUnlocked();
      onUnlock();
      return true;
    }
    setError(true);
    setResetKey((k) => k + 1);
    setWait(lockedSeconds());
    return false;
  }

  return (
    <section className="lock-screen shell" data-testid="lock-screen">
      <div className="lock-head">
        <YalanMark size={44} color="#D0342C" needle="#141312" />
        <h1 className="lock-title">{t('lock.title')}</h1>
        <p className="muted small">{t('lock.subtitle')}</p>
      </div>

      <PinPad onSubmit={submit} disabled={wait > 0} resetKey={resetKey} />

      <div className="lock-foot">
        {wait > 0 && (
          <p className="alert" role="alert">
            {t('lock.wait', { sec: wait })}
          </p>
        )}
        {error && wait === 0 && (
          <p className="alert" role="alert">
            {t('lock.error')}
          </p>
        )}

        {!showForgot ? (
          <button type="button" className="ghost" onClick={() => setShowForgot(true)}>
            {t('lock.forgot')}
          </button>
        ) : (
          <div className="forgot-box">
            <p className="small muted">{t('lock.forgotBody')}</p>
            <a className="cta mail-cta" href={forgotMailUrl(lang)}>
              {t('lock.mail')}
            </a>
            <button
              type="button"
              className="ghost danger"
              onClick={() => {
                if (typeof confirm === 'function' && !confirm(t('lock.resetConfirm'))) return;
                clearPin();
                onUnlock();
              }}
            >
              {t('lock.reset')}
            </button>
            <p className="fineprint">{t('lock.resetHint')}</p>
          </div>
        )}
      </div>
    </section>
  );
}
