import { useEffect, useState } from 'react';
import type { AiMode } from '../../shared/constants.ts';
import { TeqSplash } from './components/TeqSplash.tsx';
import { YalanMark } from './components/YalanMark.tsx';
import { Generator } from './screens/Generator.tsx';
import { Ledger } from './screens/Ledger.tsx';
import { Settings } from './screens/Settings.tsx';

type Tab = 'uret' | 'defter' | 'ayarlar';

const SPLASH_FLAG = 'ym_splash_done';
/** Açılış ekranının ekranda kalma süresi (ms). Yayın öncesi 1500-2000'e indirilebilir. */
const SPLASH_MS = 5000;
const TAGLINE = 'bir bahane değil, savunulabilir bir hikâye';

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
  if (typeof window === 'undefined') return 'uret';
  const value = new URLSearchParams(window.location.search).get('tab');
  return value === 'defter' || value === 'ayarlar' ? value : 'uret';
}

export function App() {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [aiMode, setAiMode] = useState<AiMode>('off');
  const [showSplash, setShowSplash] = useState(() => splashHoldRequested() || (!splashSkipped() && !splashAlreadySeen()));

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((data: { aiMode?: AiMode }) => setAiMode(data.aiMode ?? 'off'))
      .catch(() => setAiMode('off'));
  }, []);

  return (
    <main className="shell">
      {showSplash && (
        <TeqSplash
          appName="Yalan Makinası"
          tagline={TAGLINE}
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

      {tab === 'uret' && <Generator onGenerated={() => {}} />}
      {tab === 'defter' && <Ledger />}
      {tab === 'ayarlar' && <Settings aiMode={aiMode} onBack={() => setTab('uret')} />}

      <nav className="tabbar" aria-label="Bölümler">
        <button type="button" className={tab === 'uret' ? 'is-active' : ''} onClick={() => setTab('uret')}>
          Üret
        </button>
        <button type="button" className={tab === 'defter' ? 'is-active' : ''} onClick={() => setTab('defter')}>
          Defter
        </button>
        <button type="button" className={tab === 'ayarlar' ? 'is-active' : ''} onClick={() => setTab('ayarlar')}>
          Ayarlar
        </button>
      </nav>
    </main>
  );
}
