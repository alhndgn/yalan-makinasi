import { useState } from 'react';
import { DEFAULT_FORM, INTENSITY_MAX, INTENSITY_MIN, STYLES } from '../../../shared/constants.ts';
import type { AiMode } from '../../../shared/constants.ts';
import { readAiConfig, writeAiConfig, type AiConfig } from '../lib/aiConfig.ts';
import { generateWithAi } from '../lib/aiProvider.ts';
import { data } from '../lib/data.ts';
import { readDefaults, writeDefaults, type Defaults } from '../lib/defaults.ts';

type Props = { aiMode: AiMode; onBack: () => void };

const AI_LABEL: Record<AiMode, string> = {
  off: 'Şablon motoru · ağ kullanılmıyor',
  ollama: 'Yerel model (Ollama · 3090)',
  openrouter: 'Bulut (OpenRouter)',
};

export function Settings({ aiMode, onBack }: Props) {
  const [defaults, setDefaults] = useState<Defaults>(readDefaults);
  const [note, setNote] = useState<string | null>(null);
  const [ai, setAi] = useState<AiConfig>(readAiConfig);
  const [testing, setTesting] = useState(false);

  function updateAi(patch: Partial<AiConfig>) {
    const next = { ...ai, ...patch };
    setAi(next);
    writeAiConfig(next);
  }

  async function testAi() {
    setTesting(true);
    setNote(null);
    const started = Date.now();
    try {
      const variants = await generateWithAi({ ...DEFAULT_FORM, intensity: 5 }, ai, 15000);
      setNote(`Bağlantı tamam · ${Date.now() - started} ms · ${variants.length} varyant geldi`);
    } catch (err) {
      setNote(`Bağlanamadım: ${err instanceof Error ? err.message : 'bilinmeyen hata'}`);
    } finally {
      setTesting(false);
    }
  }

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
      link.download = 'yalan-defteri.json';
      link.click();
      const href = link.href;
      setTimeout(() => URL.revokeObjectURL(href), 1000);
      setNote(`${ledger.items.length} kayıt dışa aktarıldı.`);
    } catch {
      setNote('Dışa aktarma başarısız.');
    }
  }

  async function deleteAll() {
    if (typeof confirm === 'function' && !confirm('Defterdeki tüm kayıtlar silinecek. Emin misin?')) return;
    try {
      const res = await data.deleteAll();
      setNote(`${res.deleted} kayıt silindi.`);
    } catch {
      setNote('Silme başarısız.');
    }
  }

  return (
    <section className="stack">
      <h1 className="h1">Ayarlar</h1>
      <p className="muted">Motor, varsayılanlar ve verilerin.</p>

      <div className="card">
        <p className="label">Yapay zekâ</p>
        <p className="setting-value">{AI_LABEL[aiMode]}</p>
        <p className="muted small">
          Şablon motoru her zaman çalışır. Model seçiliyse metinler önce modelden istenir; model yanıt vermezse
          sessizce şablona dönülür.
        </p>
      </div>

      <div className="card">
        <p className="label">AI sunucusu</p>
        <button
          type="button"
          className={`toggle${ai.enabled ? ' is-on' : ''}`}
          aria-pressed={ai.enabled}
          onClick={() => updateAi({ enabled: !ai.enabled })}
        >
          {ai.enabled ? 'AI açık — önce AI denenir' : 'AI kapalı — şablon motoru'}
        </button>
        <input
          className="input"
          placeholder="http://192.168.1.12/ai/v1"
          value={ai.baseUrl}
          onChange={(e) => updateAi({ baseUrl: e.target.value })}
        />
        <input
          className="input"
          placeholder="model (örn. qwen2.5:14b-instruct-q4_K_M)"
          value={ai.model}
          onChange={(e) => updateAi({ model: e.target.value })}
        />
        <input
          className="input"
          placeholder="API anahtarı (proxy istiyorsa)"
          value={ai.apiKey}
          onChange={(e) => updateAi({ apiKey: e.target.value })}
        />
        <button type="button" className="btn-ghost" onClick={() => void testAi()} disabled={testing}>
          {testing ? 'Deniyorum…' : 'Bağlantıyı test et'}
        </button>
        <p className="muted small">
          AI'ya ulaşılamazsa şablon motoru devreye girer; cevap yine gelir ama daha kuru olur.
        </p>
      </div>

      <div className="card">
        <p className="label">Varsayılan ton</p>
        <div className="seg">
          {STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={defaults.style === s.id ? 'is-active' : ''}
              onClick={() => saveDefaults({ ...defaults, style: s.id })}
            >
              {s.label}
            </button>
          ))}
        </div>

        <p className="label">Varsayılan yalan şiddeti</p>
        <input
          className="input"
          type="number"
          min={INTENSITY_MIN}
          max={INTENSITY_MAX}
          value={defaults.intensity}
          onChange={(e) => saveDefaults({ ...defaults, intensity: Number(e.target.value) })}
        />
      </div>

      <div className="card">
        <p className="label">Verilerim</p>
        <div className="settings-actions">
          <button type="button" onClick={() => void exportLedger()}>
            Defteri dışa aktar (JSON)
          </button>
          <button type="button" className="danger" onClick={() => void deleteAll()}>
            Tüm kayıtları sil
          </button>
        </div>
      </div>

      <div className="card">
        <p className="label">KVKK ve kullanım</p>
        <p className="muted small">
          Bu uygulama eğlence amaçlıdır. Resmî belge, sağlık raporu veya imza içeren içerik üretmez. Hesap
          açılmaz; cihazında üretilen rastgele bir kimlik dışında kimlik bilgisi toplanmaz, IP adresi
          kaydedilmez. Kayıtlarını istediğin an silebilir veya dışa aktarabilirsin. Veriler yalnızca bu
          uygulamanın sunucusunda saklanır; üçüncü taraflarla paylaşılmaz.
        </p>
        <p className="muted small">
          Uygulama hukuki danışmanlık vermez. Başkalarına zarar vermek, iftira atmak veya dolandırıcılık
          amacıyla kullanılamaz.
        </p>
      </div>

      <button type="button" className="btn-ghost" onClick={onBack}>
        ← Üreticiye dön
      </button>

      {note && (
        <p className="toast" role="status">
          {note}
        </p>
      )}

      <p className="fineprint">Yalan Makinası · v0.2.0</p>
    </section>
  );
}
