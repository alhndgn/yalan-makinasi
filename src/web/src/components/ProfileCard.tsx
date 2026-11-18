import { useEffect, useRef, useState } from 'react';
import type { Danger, Scorecard } from '../../../engine/insights.ts';
import { getAvatar, saveAvatar } from '../lib/avatar.ts';
import { useI18n } from '../lib/lang.tsx';
import { DangerGauge } from './DangerGauge.tsx';

type Props = {
  person: string;
  relationLabel: string;
  closeness?: number;
  danger: Danger;
  card: Scorecard;
  onEdit: () => void;
};

/** Kişi profili: fotoğraf, tehlike ibresi, özet sayılar ve başarı şeridi. */
export function ProfileCard({ person, relationLabel, closeness, danger, card, onEdit }: Props) {
  const { t, lang } = useI18n();
  const [avatar, setAvatar] = useState<string | null>(() => getAvatar(person));
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAvatar(getAvatar(person));
  }, [person]);

  const initial = (person.trim()[0] ?? '?').toLocaleUpperCase(lang === 'tr' ? 'tr' : 'en');
  const judged = card.held + card.failed;

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      setAvatar(await saveAvatar(person, file));
    } catch {
      /* görsel okunamadı: mevcut hâli koru */
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="profile-hero" data-testid="profile-card">
      <div className="profile-top">
        <button
          type="button"
          className={`avatar-btn ${busy ? 'is-busy' : ''}`}
          onClick={() => inputRef.current?.click()}
          aria-label={t('profile.avatarPick')}
          data-testid="avatar-btn"
        >
          {avatar ? <img src={avatar} alt={person} /> : <span className="avatar-initial">{initial}</span>}
          <span className="avatar-badge" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M4 8.5h3l1.4-2h7.2L17 8.5h3v10H4z" fill="none" strokeWidth="1.7" />
              <circle cx="12" cy="13.2" r="3.1" fill="none" strokeWidth="1.7" />
            </svg>
          </span>
          <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => void pick(e.target.files?.[0])} />
        </button>

        <div className="profile-id">
          <h2 className="profile-name">{person}</h2>
          <p className="profile-meta">
            {relationLabel}
            {closeness ? ` · ${t('gen.closeness')} ${closeness}/10` : ''}
          </p>
        </div>

        <button type="button" className="ghost profile-edit" onClick={onEdit}>
          {t('ledger.profile')}
        </button>
      </div>

      <DangerGauge danger={danger} />

      <div className="stat-grid">
        <div className="stat">
          <b>{card.total}</b>
          <span>{t('score.total')}</span>
        </div>
        <div className="stat is-good">
          <b>{card.held}</b>
          <span>{t('score.kept')}</span>
        </div>
        <div className="stat is-bad">
          <b>{card.failed}</b>
          <span>{t('score.failed')}</span>
        </div>
        <div className="stat is-wait">
          <b>{card.pending}</b>
          <span>{t('score.pending')}</span>
        </div>
      </div>

      <div className="success-strip">
        <div className="success-head">
          <span className="success-label">{t('score.success')}</span>
          <span className="success-value">{card.heldRate === null ? '—' : `${card.heldRate}%`}</span>
          <span className="success-frac">
            {card.held}/{judged}
          </span>
        </div>
        <div className="success-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={card.heldRate ?? 0}>
          <i style={{ width: `${card.heldRate ?? 0}%` }} />
        </div>
      </div>
    </section>
  );
}
