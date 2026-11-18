import { useState } from 'react';
import { STYLES } from '../../../shared/constants.ts';
import { PinSetup } from '../components/PinSetup.tsx';
import { data } from '../lib/data.ts';
import { readDefaults, writeDefaults, type Defaults } from '../lib/defaults.ts';
import { useI18n } from '../lib/lang.tsx';
import { clearPin, hasPin, markUnlocked, setPin } from '../lib/lock.ts';

type Props = { onBack: () => void };

export function Settings({ onBack }: Props) {
  const { t, lang, setLang, label } = useI18n();
  const [defaults, setDefaults] = useState<Defaults>(readDefaults);
  const [note, setNote] = useState<string | null>(null);
  const [locked, setLocked] = useState(() => hasPin());
  const [pinMode, setPinMode] = useState<null | 'create' | 'change'>(null);

  function saveDefaults(next: Defaults) {
    setDefaults(next);
    writeDefaults(next);
  }

  async function exportLedger() {
    try {
      const ledger = await data.listLies();
      const blob = new Blob([JSON.stringify(ledger.items, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'lie-ledger.json';
      link.click();
      const href = link.href;
      setTimeout(() => URL.revokeObjectURL(href), 1000);
      setNote(t('settings.exported', { count: ledger.items.length }));
    } catch {
      setNote(t('settings.exportFailed'));
    }
  }

  async function deleteAll() {
    if (typeof confirm === 'function' && !confirm(t('settings.confirmDelete'))) return;
    try {
      const res = await data.deleteAll();
      setNote(t('settings.deleted', { count: res.deleted }));
    } catch {
      setNote(t('settings.deleteFailed'));
    }
  }

  return (
    <section className="stack">
      <h1 className="h1">{t('settings.title')}</h1>
      <p className="muted">{t('settings.subtitle')}</p>

      <div className="card">
        <p className="label">{t('settings.language')}</p>
        <div className="seg" data-testid="language-switch">
          <button type="button" className={lang === 'tr' ? 'is-active' : ''} onClick={() => setLang('tr')}>
            Türkçe
          </button>
          <button type="button" className={lang === 'en' ? 'is-active' : ''} onClick={() => setLang('en')}>
            English
          </button>
        </div>
      </div>

      <div className="card">
        <p className="label">{t('settings.defaultStyle')}</p>
        <div className="seg">
          {STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={defaults.style === s.id ? 'is-active' : ''}
              onClick={() => saveDefaults({ ...defaults, style: s.id })}
            >
              {label('style', s.id)}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <p className="label">{t('settings.lock')}</p>
        {pinMode ? (
          <PinSetup
            changing={pinMode === 'change'}
            onCancel={() => setPinMode(null)}
            onDone={async (pin) => {
              await setPin(pin);
              markUnlocked();
              setLocked(true);
              setPinMode(null);
              setNote(t('settings.lockEnabled'));
            }}
          />
        ) : (
          <>
            <p className="muted small">{t('settings.lockBody')}</p>
            <div className="settings-actions">
              {locked ? (
                <>
                  <button type="button" onClick={() => setPinMode('change')}>
                    {t('settings.lockChange')}
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => {
                      if (typeof confirm === 'function' && !confirm(t('settings.lockRemoveConfirm'))) return;
                      clearPin();
                      markUnlocked();
                      setLocked(false);
                      setNote(t('settings.lockDisabled'));
                    }}
                  >
                    {t('settings.lockOff')}
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => setPinMode('create')}>
                  {t('settings.lockOn')}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <div className="card">
        <p className="label">{t('settings.data')}</p>
        <div className="settings-actions">
          <button type="button" onClick={() => void exportLedger()}>
            {t('settings.export')}
          </button>
          <button type="button" className="danger" onClick={() => void deleteAll()}>
            {t('settings.deleteAll')}
          </button>
        </div>
      </div>

      <div className="card">
        <p className="label">{t('settings.legalTitle')}</p>
        <p className="muted small">{t('settings.legal1')}</p>
        <p className="muted small">{t('settings.legal2')}</p>
      </div>

      <button type="button" className="btn-ghost" onClick={onBack}>
        {t('settings.back')}
      </button>

      {note && (
        <p className="toast" role="status">
          {note}
        </p>
      )}

      <p className="fineprint">{t('app.name')} · v0.8.0</p>
    </section>
  );
}
