import { useEffect, useState } from 'react';
import type { SavedLie } from '../../../shared/schema.ts';
import type { Status } from '../../../shared/constants.ts';
import { api } from '../lib/api.ts';
import { TARGET_LABEL, formatWhen } from '../lib/format.ts';

type Conflict = { lieId: string; createdAt: number; text: string };

type Props = { conflicts?: Conflict[] };

const NEXT_STATUS: Record<Status, Status> = { beklemede: 'tuttu', tuttu: 'tutmadı', 'tutmadı': 'beklemede' };

export function Ledger({ conflicts = [] }: Props) {
  const [items, setItems] = useState<SavedLie[] | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    api
      .listLies()
      .then((r) => setItems(r.items))
      .catch(() => setItems([]));
  }, []);

  async function cycleStatus(item: SavedLie) {
    const next = NEXT_STATUS[item.status];
    setItems((prev) => prev?.map((p) => (p.id === item.id ? { ...p, status: next } : p)) ?? null);
    try {
      await api.updateStatus(item.id, next === 'beklemede' ? 'tuttu' : next);
    } catch {
      setNote('Durum güncellenemedi.');
    }
  }

  async function remove(id: string) {
    setItems((prev) => prev?.filter((p) => p.id !== id) ?? null);
    try {
      await api.deleteLie(id);
    } catch {
      setNote('Kayıt silinemedi.');
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNote('Kopyalandı.');
      setTimeout(() => setNote(null), 1600);
    } catch {
      setNote('Kopyalanamadı.');
    }
  }

  if (items === null) return <p className="muted">Yükleniyor…</p>;

  return (
    <section className="stack">
      <header className="hero">
        <p className="eyebrow">geçmiş</p>
        <h1 className="title">Yalan Defteri</h1>
        <p className="muted">Kime ne dedin, tuttu mu — hepsi burada.</p>
      </header>

      {conflicts.length > 0 && (
        <div className="conflict-banner" role="status">
          <strong>Çelişki var.</strong> Bu kişiye son 30 günde {conflicts.length} bahane söyledin; biriyle
          çakışıyor olabilir.
          <ul>
            {conflicts.slice(0, 2).map((c) => (
              <li key={c.lieId}>“{c.text}”</li>
            ))}
          </ul>
        </div>
      )}

      {items.length === 0 ? (
        <div className="card empty">
          <p className="empty-title">Defter boş</p>
          <p className="muted">Henüz kaydettiğin bir bahane yok. Üret, beğendiğini deftere at.</p>
        </div>
      ) : (
        <ul className="ledger">
          {items.map((item) => (
            <li key={item.id} className="card ledger-item">
              <div className="ledger-head">
                <span className="tag">
                  {TARGET_LABEL[item.target] ?? item.target} · {formatWhen(item.createdAt)}
                </span>
                <button type="button" className={`badge badge-${item.status}`} onClick={() => cycleStatus(item)}>
                  {item.status}
                </button>
              </div>
              <p className="ledger-text">{item.text}</p>
              <div className="ledger-actions">
                <button type="button" onClick={() => copy(item.text)}>
                  Kopyala
                </button>
                <button type="button" onClick={() => remove(item.id)}>
                  Sil
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {note && (
        <p className="toast" role="status">
          {note}
        </p>
      )}
    </section>
  );
}
