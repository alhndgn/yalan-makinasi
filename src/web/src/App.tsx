import { useEffect, useState } from 'react';
import type { AiMode } from '../../shared/constants.ts';
import { Generator } from './screens/Generator.tsx';
import { Ledger } from './screens/Ledger.tsx';
import { Settings } from './screens/Settings.tsx';

type Tab = 'uret' | 'defter' | 'ayarlar';

export function App() {
  const [tab, setTab] = useState<Tab>('uret');
  const [aiMode, setAiMode] = useState<AiMode>('off');

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((data: { aiMode?: AiMode }) => setAiMode(data.aiMode ?? 'off'))
      .catch(() => setAiMode('off'));
  }, []);

  return (
    <main className="shell">
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
