import { useEffect, useState } from 'react';
import type { AiMode } from '../../shared/constants.ts';
import { TeqSplash } from './components/TeqSplash.tsx';
import { YalanMark } from './components/YalanMark.tsx';
import { Generator } from './screens/Generator.tsx';
import { LanguagePicker } from './screens/LanguagePicker.tsx';
import { readLang, type Lang } from './lib/i18n.ts';
import { LockScreen } from './screens/LockScreen.tsx';
import { hasPin, isUnlocked, markLocked, shouldRelock } from './lib/lock.ts';
import { useI18n } from './lib/lang.tsx';
import { Ledger } from './screens/Ledger.tsx';
import { Settings } from './screens/Settings.tsx';

type Tab = 'defter' | 'uret' | 'ayarlar';

const SPLASH_FLAG = 'ym_splash_done';
/** Açılış ekranının ekranda kalma süresi (ms). Yayın öncesi 1500-2000'e indirilebilir. */
const SPLASH_MS = 5000;

function splashParam(): 'hold' | 'off' | null {
  if (typeof window === 'undefined') return null;
  const value = new URLSearchParams(window.location.search).get('splash');
  return value === 'hold' || value === 'off' ? value : null;
}

function splashHoldRequested(): boolean {
  return splashParam() === 'hold';
}

function splashSkipped(): boolean {
  return splashParam() === 'off';
}

function splashAlreadySeen(): boolean {
  try {
    return sessionStorage.getItem(SPLASH_FLAG) === '1';
  } catch {
    return false;
  }
}

function initialTab(): Tab {
  if (typeof window === 'undefined') return 'defter';
  const value = new URLSearchParams(window.location.search).get('tab');
  return value === 'uret' || value === 'ayarlar' ? value : 'defter';
}

export function App() {
  const { t, setLang } = useI18n();
  const [chosen, setChosen] = useState<Lang | null>(() => readLang());
  const [tab, setTab] = useState<Tab>(initialTab);
  const [locked, setLocked] = useState(() => hasPin() && !isUnlocked());
  const [showSplash, setShowSplash] = useState(() => splashHoldRequested() || (!splashSkipped() && !splashAlreadySeen()));

  // Arka planda 5 dakikadan fazla kalınca defter tekrar kilitlenir.
  useEffect(() => {
    let hiddenAt: number | null = null;
    function onVisibility() {
      if (document.hidden) {
        hiddenAt = Date.now();
        return;
      }
      if (hiddenAt !== null && shouldRelock(hiddenAt) && hasPin()) {
        markLocked();
        setLocked(true);
      }
      hiddenAt = null;
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);



  if (!chosen) {
    return (
      <main className="shell">
        <LanguagePicker
          onPick={(lang) => {
            setLang(lang);
            setChosen(lang);
          }}
        />
      </main>
    );
  }

  return (
    <main className="shell">
      {showSplash && (
        <TeqSplash
          appName={t('app.name')}
          tagline={t('app.slogan')}
          accent="#A83A30"
          mark={<YalanMark size={72} color="#A83A30" needle="#1C1A17" />}
          durationMs={SPLASH_MS}
          hold={splashHoldRequested()}
          onDone={() => {
            try {
              sessionStorage.setItem(SPLASH_FLAG, '1');
            } catch {
              /* yoksay */
            }
            setShowSplash(false);
          }}
        />
      )}

      {locked ? (
        <LockScreen onUnlock={() => setLocked(false)} />
      ) : (
        <>
          {/* Sekmeler açık kalır: üretim sürerken deftere bakabilir, dönünce sonucu bulabilirsin. */}
      <div hidden={tab !== 'defter'}>
        <Ledger />
      </div>
      <div hidden={tab !== 'uret'}>
        <Generator onGenerated={() => {}} />
      </div>
      {tab === 'ayarlar' && <Settings onBack={() => setTab('uret')} />}

          <nav className="tabbar" aria-label="Bölümler">
        <button type="button" className={tab === 'defter' ? 'is-active' : ''} onClick={() => setTab('defter')}>
          {t('tab.ledger')}
        </button>
        <button type="button" className={tab === 'uret' ? 'is-active' : ''} onClick={() => setTab('uret')}>
          {t('tab.generate')}
        </button>
            <button type="button" className={tab === 'ayarlar' ? 'is-active' : ''} onClick={() => setTab('ayarlar')}>
              {t('tab.settings')}
            </button>
          </nav>
        </>
      )}
    </main>
  );
}
