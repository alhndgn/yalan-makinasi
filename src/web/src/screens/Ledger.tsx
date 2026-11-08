import { useEffect, useState } from 'react';
import type { SavedLie } from '../../../shared/schema.ts';
import type { Status } from '../../../shared/constants.ts';
import { data } from '../lib/data.ts';
import { TARGET_LABEL, formatWhen } from '../lib/format.ts';

type Conflict = { lieId: string; createdAt: number; text: string };

type Props = { conflicts?: Conflict[] };

const NEXT_STATUS: Record<Status, Status> = { beklemede: 'tuttu', tuttu: 'tutmadı', 'tutmadı': 'beklemede' };
const NEXT_LABEL: Record<Status, string> = { beklemede: 'beklemede', tuttu: 'tuttu', 'tutmadı': 'tutmadı' };

export function Ledger({ conflicts: conflictsProp }: Props) {
  const [items, setItems] = useState<SavedLie[] | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[]>(conflictsProp ?? []);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    data
      .listLies()
      .then((r) => {
        setItems(r.items);
        if (conflictsProp === undefined) {
          data
            .conflicts()
            .then((result) => setConflicts(result.conflicts ?? []))
            .catch(() => setConflicts([]));
        }
      })
      .catch(() => setItems([]));
  }, [conflictsProp]);

  async function cycleStatus(item: SavedLie) {
    const next = NEXT_STATUS[item.status];
    const previous = item.status;
    setItems((prev) => prev?.map((p) => (p.id === item.id ? { ...p, status: next } : p)) ?? null);
    try {
      await data.updateStatus(item.id, next);
    } catch {
      setItems((prev) => prev?.map((p) => (p.id === item.id ? { ...p, status: previous } : p)) ?? null);
      setNote('Durum güncellenemedi.');
    }
  }

  async function remove(id: string) {
    setItems((prev) => prev?.filter((p) => p.id !== id) ?? null);
    try {
      await data.deleteLie(id);
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
      <h1 className="h1">Yalan Defteri</h1>
      <p className="muted">Kime ne dedin, tuttu mu — hepsi burada.</p>

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
                <button
                  type="button"
                  className={`badge badge-${item.status}`}
                  aria-label={`Durum: ${item.status}. Tıkla ve ${NEXT_LABEL[NEXT_STATUS[item.status]]} yap.`}
                  onClick={() => cycleStatus(item)}
                >
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
