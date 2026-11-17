import { useEffect, useRef, useState } from 'react';
import type { Variant } from '../../../shared/schema.ts';
import { useI18n } from '../lib/lang.tsx';
import { Typewriter } from './Typewriter.tsx';

type Props = {
  variants: Variant[];
  index: number;
  contextLabel: string;
  onIndex: (next: number) => void;
  onUse: () => void;
  onBack: () => void;
  onEdit: (nextText: string) => void;
};

const TUTORIAL_KEY = 'ym_deck_tutorial_seen';

function tutorialSeen(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_KEY) === '1';
  } catch {
    return true;
  }
}

/** Üç alternatifi tek tek gezdirir: oklar, noktalar, parmakla kaydırma, düzenleme. */
export function VariantDeck({ variants, index, contextLabel, onIndex, onUse, onBack, onEdit }: Props) {
  const { t } = useI18n();
  const [dx, setDx] = useState(0);
  const [showTutorial, setShowTutorial] = useState(() => !tutorialSeen());
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const startX = useRef<number | null>(null);
  const variant = variants[index];
  if (!variant) return null;

  const go = (delta: number) => onIndex(Math.min(variants.length - 1, Math.max(0, index + delta)));

  useEffect(() => {
    setEditing(false);
  }, [index]);

  function closeTutorial() {
    setShowTutorial(false);
    try {
      localStorage.setItem(TUTORIAL_KEY, '1');
    } catch {
      /* yoksay */
    }
  }

  function touchStart(e: React.TouchEvent) {
    startX.current = e.touches[0]?.clientX ?? null;
  }
  function touchMove(e: React.TouchEvent) {
    if (startX.current === null) return;
    const current = e.touches[0]?.clientX ?? startX.current;
    setDx(Math.max(-90, Math.min(90, current - startX.current)));
  }
  function touchEnd() {
    if (dx < -50) go(1);
    else if (dx > 50) go(-1);
    setDx(0);
    startX.current = null;
  }

  return (
    <section className="screen deck-screen" data-testid="deck">
      <div className="deck-top">
        <span className="kicker">{t('deck.kicker')}</span>
        <span className="deck-context">{contextLabel}</span>
      </div>

      <div className="deck-dots" aria-hidden="true">
        {variants.map((v, i) => (
          <i key={v.text.slice(0, 12) + i} className={i === index ? 'on' : ''} />
        ))}
      </div>

      <article
        className={`deck-card ${editing ? 'is-editing' : ''}`}
        data-testid="deck-card"
        style={{ transform: `translateX(${dx * 0.35}px) rotate(${dx * 0.01}deg)` }}
        onTouchStart={touchStart}
        onTouchMove={touchMove}
        onTouchEnd={touchEnd}
      >
        <div className="deck-meta">
          <span className="tag">{t(`strategy.${variant.strategy}`)}</span>
          <span className={`risk risk-${variant.riskLevel}`}>
            {t(`risk.${variant.riskLevel}`)} · {variant.riskScore}
          </span>
          <span className="spacer" />
          {!editing && (
            <button
              type="button"
              className="edit-btn"
              aria-label={t('deck.editAria')}
              onClick={() => {
                setDraft(variant.text);
                setEditing(true);
              }}
            >
              ✎ {t('deck.edit')}
            </button>
          )}
        </div>

        {editing ? (
          <div className="deck-edit">
            <textarea
              className="input textarea"
              value={draft}
              rows={6}
              maxLength={1000}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              aria-label={t('deck.editLabel')}
            />
            <p className="small faint">{t('deck.editHint')}</p>
            <div className="deck-edit-actions">
              <button type="button" className="ghost" onClick={() => setEditing(false)}>
                {t('deck.cancel')}
              </button>
              <button
                type="button"
                className="cta small-cta"
                onClick={() => {
                  onEdit(draft.trim());
                  setEditing(false);
                }}
                disabled={draft.trim().length < 3}
              >
                {t('deck.save')}
              </button>
            </div>
          </div>
        ) : (
          <p className="deck-text" data-testid="deck-text">
            <Typewriter text={variant.text} />
          </p>
        )}

        {!editing && (
          <div className="deck-foot">
            <span className="small muted">
              {variant.queries.length > 0 ? t('deck.queries', { count: variant.queries.length }) : t('deck.noQueries')}
            </span>
            <span className="mono small faint">
              {index + 1}/{variants.length}
            </span>
          </div>
        )}
      </article>

      <div className="deck-nav">
        <button type="button" className="round" onClick={() => go(-1)} disabled={index === 0} aria-label={t('deck.prev')}>
          ‹
        </button>
        <button type="button" className="cta deck-use" onClick={onUse} disabled={editing}>
          {t('deck.use')}
        </button>
        <button
          type="button"
          className="round"
          onClick={() => go(1)}
          disabled={index === variants.length - 1}
          aria-label={t('deck.next')}
        >
          ›
        </button>
      </div>

      <button type="button" className="ghost deck-back" onClick={onBack}>
        {t('deck.back')}
      </button>

      {showTutorial && (
        <div className="tutorial" role="dialog" aria-label={t('deck.tutorialTitle')} data-testid="deck-tutorial">
          <div className="tutorial-card">
            <div className="tutorial-hand" aria-hidden="true">
              <span>👆</span>
              <i className="tutorial-arrow">→</i>
            </div>
            <h3>{t('deck.tutorialTitle')}</h3>
            <p>{t('deck.tutorialBody')}</p>
            <button type="button" className="cta" onClick={closeTutorial}>
              {t('deck.tutorialOk')}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
