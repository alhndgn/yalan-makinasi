import { useState } from 'react';
import { STYLES } from '../../../shared/constants.ts';
import type { AiMode } from '../../../shared/constants.ts';
import { data } from '../lib/data.ts';
import { readDefaults, writeDefaults, type Defaults } from '../lib/defaults.ts';

type Props = { onBack: () => void };

export function Settings({ onBack }: Props) {
  const [defaults, setDefaults] = useState<Defaults>(readDefaults);
  const [note, setNote] = useState<string | null>(null);
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
      <p className="muted">Varsayılanlar ve verilerin.</p>

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

      <p className="fineprint">Yalan Makinası · v0.7.0</p>
    </section>
  );
}
