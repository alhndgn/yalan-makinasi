import { useEffect, useMemo, useState } from 'react';
import type { ManualLieInput, PersonProfile, PersonSummary, SavedLie } from '../../../shared/schema.ts';
import type { Status } from '../../../shared/constants.ts';
import { CHANNELS, SITUATIONS, TARGETS } from '../../../shared/constants.ts';
import { findConflicts, type Conflict, type LieLike } from '../../../engine/conflict.ts';
import { calendar, scorecard, stalePending, streakDays } from '../../../engine/insights.ts';
import { fallbackAnswer } from '../../../engine/prompt.ts';
import { aiReady, readAiConfig } from '../lib/aiConfig.ts';
import { answerWithAi } from '../lib/aiProvider.ts';
import { data } from '../lib/data.ts';
import { formatWhen } from '../lib/format.ts';
import { sourceLabel } from '../lib/personView.ts';
import { useI18n } from '../lib/lang.tsx';
import { onDataChanged, notifyDataChanged } from '../lib/events.ts';
import { pendingReminderCount, syncReminders } from '../lib/reminder.ts';

type View =
  | { kind: 'people' }
  | { kind: 'person'; person: string }
  | { kind: 'conflicts'; person: string }
  | { kind: 'lie'; lie: SavedLie }
  | { kind: 'new' }
  | { kind: 'profile'; person: string };

const NEXT_STATUS: Record<Status, Status> = { beklemede: 'tuttu', tuttu: 'tutmadı', 'tutmadı': 'beklemede' };

export function Ledger() {
  const { t, lang, label } = useI18n();
  const [people, setPeople] = useState<PersonSummary[] | null>(null);
  const [lies, setLies] = useState<SavedLie[]>([]);
  const [view, setView] = useState<View>({ kind: 'people' });
  const [mode, setMode] = useState<'people' | 'calendar'>('people');
  const [query, setQuery] = useState('');
  const [dayKey, setDayKey] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const statusLabel = (status: Status) => t(`status.${status}`);

  async function refreshAll() {
    try {
      const [peopleResult, liesResult] = await Promise.all([data.people(), data.listLies()]);
      setPeople(Array.isArray(peopleResult?.people) ? peopleResult.people : []);
      setLies(Array.isArray(liesResult?.items) ? liesResult.items : []);
    } catch {
      setPeople([]);
    }
  }

  useEffect(() => {
    void refreshAll();
    // Üretici sekmesinde kaydedilen yalan burada anında görünsün.
    return onDataChanged(() => {
      void refreshAll();
    });
  }, []);

  // Bildirimler: native'de 48 saat sonrası için zamanlanır, web'de bant gösterilir.
  useEffect(() => {
    if (lies.length === 0) return;
    void syncReminders(lies, lang);
  }, [lies, lang]);

  function flash(message: string) {
    setNote(message);
    setTimeout(() => setNote(null), 2200);
  }

  function openPerson(person: string) {
    setView({ kind: 'person', person });
  }

  async function cycleStatus(lie: SavedLie) {
    const next = NEXT_STATUS[lie.status];
    setView({ kind: 'lie', lie: { ...lie, status: next } });
    setLies((prev) => prev.map((item) => (item.id === lie.id ? { ...item, status: next } : item)));
    try {
      await data.updateStatus(lie.id, next);
      notifyDataChanged();
    } catch {
      flash(t('ledger.statusFailed'));
    }
  }

  async function remove(id: string) {
    const person = view.kind === 'lie' ? (view.lie.person ?? '') : '';
    await data.deleteLie(id).catch(() => null);
    setLies((prev) => prev.filter((item) => item.id !== id));
    notifyDataChanged();
    setView(person ? { kind: 'person', person } : { kind: 'people' });
    flash(t('ledger.deleted'));
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      flash(t('ledger.copied'));
    } catch {
      flash(t('ledger.copyFailed'));
    }
  }

  async function saveManual(input: ManualLieInput) {
    setBusy(true);
    try {
      await data.saveManual(input);
      await refreshAll();
      notifyDataChanged();
      setView({ kind: 'person', person: input.person.trim() });
      flash(t('ledger.added'));
    } catch {
      flash(t('ledger.saveFailed'));
    } finally {
      setBusy(false);
    }
  }

  /** Kişi başına çelişki sayısı — kart üzerindeki kırmızı nokta. */
  const conflictsByPerson = useMemo(() => {
    const map = new Map<string, Conflict[]>();
    const grouped = new Map<string, SavedLie[]>();
    for (const lie of lies) {
      const key = lie.person ?? '';
      grouped.set(key, [...(grouped.get(key) ?? []), lie]);
    }
    for (const [person, items] of grouped) map.set(person, findConflicts(items));
    return map;
  }, [lies]);

  const streak = useMemo(() => streakDays(lies), [lies]);
  const reminderCount = useMemo(() => pendingReminderCount(lies), [lies]);
  const calendarDays = useMemo(() => calendar(lies, 30), [lies]);

  const filteredPeople = useMemo(() => {
    const list = people ?? [];
    const needle = query.trim().toLocaleLowerCase(lang === 'tr' ? 'tr' : 'en');
    if (!needle) return list;

    const matches = new Set(
      list.filter((p) => p.person.toLocaleLowerCase(lang === 'tr' ? 'tr' : 'en').includes(needle)).map((p) => p.person),
    );
    for (const lie of lies) {
      if (lie.text.toLocaleLowerCase(lang === 'tr' ? 'tr' : 'en').includes(needle)) matches.add(lie.person ?? '');
    }
    return list.filter((p) => matches.has(p.person));
  }, [people, query, lies, lang]);

  if (people === null) return <p className="muted">{t('ledger.loading')}</p>;

  return (
    <section className="screen" data-testid="ledger">
      {view.kind === 'people' && (
        <>
          <header className="brandbar">
            <div className="brand">
              <span className="seal-sm">Y</span>
              <span>{t('ledger.title')}</span>
            </div>
            <button type="button" className="ghost" onClick={() => setView({ kind: 'new' })}>
              {t('ledger.add')}
            </button>
          </header>

          <div className="ledger-head">
            <h1 className="h1">{t('ledger.heading')}</h1>
            <div className="ledger-meta">
              <span className="streak" data-testid="streak">
                🕯 {streak > 0 ? t('ledger.streak', { days: streak }) : t('ledger.streakZero')}
              </span>
              <div className="seg seg-tiny" data-testid="ledger-mode">
                <button type="button" className={mode === 'people' ? 'is-active' : ''} onClick={() => setMode('people')}>
                  {t('ledger.people')}
                </button>
                <button
                  type="button"
                  className={mode === 'calendar' ? 'is-active' : ''}
                  onClick={() => setMode('calendar')}
                >
                  {t('ledger.calendar')}
                </button>
              </div>
            </div>
          </div>

          {reminderCount > 0 && (
            <button type="button" className="remind-banner" data-testid="reminder-banner" onClick={() => setMode('calendar')}>
              <span className="remind-dot" aria-hidden="true" />
              {reminderCount === 1 ? t('ledger.reminderOne') : t('ledger.reminder', { count: reminderCount })}
            </button>
          )}

          {mode === 'people' ? (
            <>
              <input
                className="input search"
                placeholder={t('ledger.search')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label={t('ledger.searchAria')}
              />

              {filteredPeople.length === 0 ? (
                <div className="card empty">
                  <p className="empty-title">{people.length === 0 ? t('ledger.emptyTitle') : t('ledger.noResult')}</p>
                  <p className="muted">{people.length === 0 ? t('ledger.emptyBody') : t('ledger.noResultBody')}</p>
                  <button type="button" className="cta" onClick={() => setView({ kind: 'new' })}>
                    {t('ledger.emptyAction')}
                  </button>
                </div>
              ) : (
                <ul className="people" data-testid="people-list">
                  {filteredPeople.map((person) => {
                    const conflictTotal = conflictsByPerson.get(person.person)?.length ?? 0;
                    return (
                      <li key={person.person || 'unnamed'}>
                        <button type="button" className="person-card" onClick={() => openPerson(person.person)}>
                          <span className="person-avatar" aria-hidden="true">
                            {(person.person.trim()[0] ?? '?').toLocaleUpperCase(lang === 'tr' ? 'tr' : 'en')}
                          </span>
                          <span className="person-main">
                            <span className="person-name">{person.person || t('ledger.unnamed')}</span>
                            <span className="person-meta">
                              {person.targets.map((target) => label('target', target)).join(' · ')}
                              {person.closeness ? ` · ${t('gen.closeness')} ${person.closeness}/10` : ''}
                            </span>
                          </span>
                          <span className="person-side">
                            <span className="person-count">{person.count}</span>
                            {conflictTotal > 0 && (
                              <span className="dot dot-red" title={t('ledger.conflictCount', { count: conflictTotal })} />
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          ) : (
            <CalendarView
              days={calendarDays}
              lies={lies}
              activeKey={dayKey}
              onPick={(key) => setDayKey(key === dayKey ? null : key)}
            />
          )}
        </>
      )}

      {view.kind === 'person' && (
        <PersonView
          person={view.person}
          lies={lies}
          conflicts={conflictsByPerson.get(view.person) ?? []}
          onBack={() => setView({ kind: 'people' })}
          onProfile={() => setView({ kind: 'profile', person: view.person })}
          onAdd={() => setView({ kind: 'new' })}
          onOpenLie={(lie) => setView({ kind: 'lie', lie })}
          onConflicts={() => setView({ kind: 'conflicts', person: view.person })}
        />
      )}

      {view.kind === 'conflicts' && (
        <ConflictsView
          person={view.person}
          conflicts={conflictsByPerson.get(view.person) ?? []}
          onBack={() => setView({ kind: 'person', person: view.person })}
          onOpenLie={(lie) => setView({ kind: 'lie', lie: lie as SavedLie })}
        />
      )}

      {view.kind === 'lie' && (
        <LieDetail
          lie={view.lie}
          onBack={() => openPerson(view.lie.person ?? '')}
          onCopy={() => void copy(view.lie.text)}
          onCycle={() => void cycleStatus(view.lie)}
          onDelete={() => void remove(view.lie.id)}
          onNote={flash}
        />
      )}

      {view.kind === 'new' && <NewLie onCancel={() => setView({ kind: 'people' })} onSave={saveManual} busy={busy} />}

      {view.kind === 'profile' && (
        <ProfileEditor
          person={view.person}
          onBack={() => setView({ kind: 'person', person: view.person })}
          onSaved={async () => {
            await refreshAll();
            flash(t('ledger.profileSaved'));
            setView({ kind: 'person', person: view.person });
          }}
        />
      )}

      {note && (
        <p className="toast" role="status">
          {note}
        </p>
      )}
    </section>
  );
}

/* ------------------------------ kişi görünümü ------------------------------ */

function PersonView({
  person,
  lies,
  conflicts,
  onBack,
  onProfile,
  onAdd,
  onOpenLie,
  onConflicts,
}: {
  person: string;
  lies: SavedLie[];
  conflicts: Conflict[];
  onBack: () => void;
  onProfile: () => void;
  onAdd: () => void;
  onOpenLie: (lie: SavedLie) => void;
  onConflicts: () => void;
}) {
  const { t, lang, label } = useI18n();
  const mine = lies.filter((lie) => (lie.person ?? '') === person);
  const card = scorecard(mine);
  const bars = calendar(mine, 14);

  return (
    <>
      <header className="detail-top">
        <button type="button" className="round" onClick={onBack} aria-label={t('ledger.back')}>
          ‹
        </button>
        <span className="detail-title">{person || t('ledger.unnamed')}</span>
        <span className="spacer" />
        <button type="button" className="ghost" onClick={onProfile}>
          {t('ledger.profile')}
        </button>
        <button type="button" className="ghost" onClick={onAdd}>
          {t('ledger.addShort')}
        </button>
      </header>

      <div className="scorecard" data-testid="scorecard">
        <div className="score-main">
          <span className="score-value">{card.heldRate === null ? '—' : `${card.heldRate}%`}</span>
          <span className="score-label">{t('score.held')}</span>
        </div>
        <div className="score-cells">
          <span>
            <b>{card.total}</b> {t('score.total')}
          </span>
          <span>
            <b>{card.held}</b> {t('score.kept')}
          </span>
          <span>
            <b>{card.failed}</b> {t('score.failed')}
          </span>
          <span>
            <b>{card.pending}</b> {t('score.pending')}
          </span>
        </div>
        {card.topSituation && (
          <p className="score-note">
            {t('score.top')}: {label('situation', card.topSituation)} · {card.topSituationCount}×
          </p>
        )}
        <div className="score-bars" aria-hidden="true">
          {bars.map((bar) => (
            <span key={bar.key} className={`score-bar ${bar.count > 0 ? 'is-on' : ''}`} title={bar.key} />
          ))}
        </div>
      </div>

      {conflicts.length > 0 && (
        <button type="button" className="conflict-strip" data-testid="conflict-strip" onClick={onConflicts}>
          <span className="conflict-count">{conflicts.length}</span>
          <span className="conflict-text">
            {t('ledger.conflictStrip')}
            <span className="conflict-sub">{t('ledger.conflictStripHint')}</span>
          </span>
          <span aria-hidden="true">›</span>
        </button>
      )}

      {mine.length === 0 ? (
        <p className="muted">{t('ledger.noneForPerson')}</p>
      ) : (
        <ul className="lies" data-testid="person-lies">
          {mine.map((lie) => (
            <li key={lie.id}>
              <button type="button" className="lie-row" onClick={() => onOpenLie(lie)}>
                <span className="lie-row-top">
                  <span className={`badge badge-${lie.status}`}>{t(`status.${lie.status}`)}</span>
                  <span className="small faint">{formatWhen(lie.createdAt, lang)}</span>
                </span>
                <span className="lie-row-text">{lie.text}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/* ------------------------------ çelişkiler ------------------------------ */

function ConflictsView({
  person,
  conflicts,
  onBack,
  onOpenLie,
}: {
  person: string;
  conflicts: Conflict[];
  onBack: () => void;
  onOpenLie: (lie: LieLike) => void;
}) {
  const { t, lang } = useI18n();

  return (
    <div className="conflicts" data-testid="conflicts">
      <header className="detail-top">
        <button type="button" className="round" onClick={onBack} aria-label={t('ledger.back')}>
          ‹
        </button>
        <span className="detail-title">{person}</span>
        <span className="spacer" />
        <span className="small faint">
          {conflicts.length} {t('conflict.count')}
        </span>
      </header>

      <p className="muted small">{t('conflict.intro')}</p>

      {conflicts.length === 0 && <p className="muted">{t('conflict.none')}</p>}

      <ul className="conflict-list">
        {conflicts.map((conflict) => (
          <li key={conflict.id} className={`conflict-card sev-${conflict.severity}`}>
            <div className="conflict-head">
              <span className={`conflict-kind kind-${conflict.kind}`}>{t(`conflict.kind.${conflict.kind}`)}</span>
              <span className={`severity sev-${conflict.severity}`}>{t(`conflict.sev.${conflict.severity}`)}</span>
            </div>

            <button type="button" className="conflict-item" onClick={() => onOpenLie(conflict.a)}>
              <span className="small faint">{formatWhen(conflict.a.createdAt, lang)}</span>
              <span className="conflict-quote">“{conflict.a.text}”</span>
            </button>
            <button type="button" className="conflict-item" onClick={() => onOpenLie(conflict.b)}>
              <span className="small faint">{formatWhen(conflict.b.createdAt, lang)}</span>
              <span className="conflict-quote">“{conflict.b.text}”</span>
            </button>

            <p className="conflict-why">
              {conflict.kind === 'detail' && conflict.pair
                ? t('conflict.why.detail', { a: conflict.pair[0], b: conflict.pair[1] })
                : t(`conflict.why.${conflict.kind}`)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------ takvim ------------------------------ */

function CalendarView({
  days,
  lies,
  activeKey,
  onPick,
}: {
  days: { key: string; label: string; count: number }[];
  lies: SavedLie[];
  activeKey: string | null;
  onPick: (key: string) => void;
}) {
  const { t, lang } = useI18n();
  const max = Math.max(1, ...days.map((day) => day.count));
  const dayItems = activeKey
    ? lies.filter((lie) => {
        const d = new Date(lie.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return key === activeKey;
      })
    : [];

  return (
    <div className="calendar" data-testid="calendar">
      <div className="heat">
        {days.map((day) => {
          const level = day.count === 0 ? 0 : Math.min(4, Math.ceil((day.count / max) * 4));
          return (
            <button
              key={day.key}
              type="button"
              className={`heat-cell lvl-${level} ${activeKey === day.key ? 'is-active' : ''}`}
              onClick={() => onPick(day.key)}
              aria-label={`${day.key}: ${day.count}`}
              title={`${day.key} · ${day.count}`}
            >
              {day.label}
            </button>
          );
        })}
      </div>

      <p className="small faint heat-legend">{t('calendar.legend')}</p>

      {activeKey ? (
        dayItems.length === 0 ? (
          <p className="muted">{t('calendar.emptyDay')}</p>
        ) : (
          <ul className="lies">
            {dayItems.map((lie) => (
              <li key={lie.id}>
                <div className="lie-row is-static">
                  <span className="lie-row-top">
                    <span className={`badge badge-${lie.status}`}>{t(`status.${lie.status}`)}</span>
                    <span className="small faint">
                      {lie.person} · {formatWhen(lie.createdAt, lang)}
                    </span>
                  </span>
                  <span className="lie-row-text">{lie.text}</span>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : (
        <p className="small faint">{t('calendar.hint')}</p>
      )}
    </div>
  );
}

/* ------------------------------ kayıt detayı ------------------------------ */

function LieDetail({
  lie,
  onBack,
  onCopy,
  onCycle,
  onDelete,
  onNote,
}: {
  lie: SavedLie;
  onBack: () => void;
  onCopy: () => void;
  onCycle: () => void;
  onDelete: () => void;
  onNote: (message: string) => void;
}) {
  const { t, lang } = useI18n();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function ask() {
    const clean = question.trim();
    if (clean.length < 2) return;
    setThinking(true);
    setAnswer(null);
    try {
      const ai = readAiConfig();
      if (aiReady(ai)) {
        setAnswer(await answerWithAi({ lieText: lie.text, question: clean, person: lie.person, lang }, ai));
      } else {
        setAnswer(fallbackAnswer(clean, lie.queries ?? [], lie.text, lang));
      }
    } catch {
      setAnswer(fallbackAnswer(clean, lie.queries ?? [], lie.text, lang));
    } finally {
      setThinking(false);
    }
  }

  return (
    <div className="lie-detail" data-testid="lie-detail">
      <header className="detail-top">
        <button type="button" className="round" onClick={onBack} aria-label={t('ledger.back')}>
          ‹
        </button>
        <span className="detail-title">{lie.person || t('ledger.unnamed')}</span>
        <span className="spacer" />
        <span className="small faint">{formatWhen(lie.createdAt, lang)}</span>
      </header>

      <p className="detail-text" data-testid="lie-text">
        {lie.text}
      </p>

      <div className="lie-meta">
        <button type="button" className={`badge badge-${lie.status}`} onClick={onCycle}>
          {t(`status.${lie.status}`)} · {t('ledger.changeStatus')}
        </button>
        <span className="small muted">
          {sourceLabel(lie.source, t)} · {t('detail.risk')} {lie.riskScore}/100
        </span>
      </div>

      {(lie.queries?.length ?? 0) > 0 && (
        <div className="detail-queries">
          <h4>{t('detail.questions')}</h4>
          {lie.queries.map((q, i) => (
            <div key={`${q.q}-${i}`} className="qa-block">
              <p className="q">{q.q}</p>
              <p className="a">{q.a}</p>
            </div>
          ))}
        </div>
      )}

      <div className="ask-box">
        <h4>{t('ledger.askTitle')}</h4>
        <p className="small muted">{t('ledger.askBody')}</p>
        <input
          className="input"
          placeholder={t('ledger.askPlaceholder')}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void ask();
          }}
        />
        <button type="button" className="cta small-cta" onClick={() => void ask()} disabled={thinking}>
          {thinking ? t('ledger.asking') : t('ledger.askCta')}
        </button>
        {answer && (
          <div className="answer-box" role="status" data-testid="answer">
            <p className="answer-text">{answer}</p>
            <button
              type="button"
              className="ghost"
              onClick={() => {
                void navigator.clipboard.writeText(answer).then(() => onNote(t('ledger.answerCopied')));
              }}
            >
              {t('ledger.copy')}
            </button>
          </div>
        )}
      </div>

      <div className="detail-actions">
        <button type="button" className="act" onClick={onCopy}>
          {t('ledger.copyLie')}
        </button>
        <button type="button" className="act ghost" onClick={onCycle}>
          {t('ledger.cycle')}
        </button>
        {confirmDelete ? (
          <button type="button" className="act ghost danger" onClick={onDelete}>
            {t('ledger.deleteConfirm')}
          </button>
        ) : (
          <button type="button" className="act ghost" onClick={() => setConfirmDelete(true)}>
            {t('ledger.delete')}
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ yeni kayıt ------------------------------ */

function NewLie({
  onCancel,
  onSave,
  busy,
}: {
  onCancel: () => void;
  onSave: (input: ManualLieInput) => Promise<void>;
  busy: boolean;
}) {
  const { t, label } = useI18n();
  const [person, setPerson] = useState('');
  const [text, setText] = useState('');
  const [channel, setChannel] = useState<ManualLieInput['channel']>('yuz_yuze');
  const [target, setTarget] = useState<ManualLieInput['target']>('arkadas');
  const [situation, setSituation] = useState<ManualLieInput['situation']>('ozel');

  return (
    <div className="new-lie" data-testid="new-lie">
      <header className="detail-top">
        <button type="button" className="round" onClick={onCancel} aria-label={t('new.back')}>
          ‹
        </button>
        <span className="detail-title">{t('new.title')}</span>
        <span className="spacer" />
      </header>

      <p className="muted small">{t('new.intro')}</p>

      <label className="field-label" htmlFor="new-person">
        {t('new.who')}
      </label>
      <input
        id="new-person"
        className="input"
        placeholder={t('new.whoPlaceholder')}
        maxLength={40}
        value={person}
        onChange={(e) => setPerson(e.target.value)}
      />

      <label className="field-label" htmlFor="new-text">
        {t('new.text')}
      </label>
      <textarea
        id="new-text"
        className="input textarea"
        placeholder={t('new.textPlaceholder')}
        maxLength={1000}
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <p className="field-label">{t('new.situation')}</p>
      <div className="chips">
        {SITUATIONS.filter((s) => s.id !== 'ozel').map((s) => (
          <button
            key={s.id}
            type="button"
            className={`chip ${situation === s.id ? 'is-active' : ''}`}
            onClick={() => setSituation(s.id)}
          >
            {label('situation', s.id)}
          </button>
        ))}
      </div>

      <p className="field-label">{t('new.channel')}</p>
      <div className="seg">
        {CHANNELS.map((c) => (
          <button
            key={c.id}
            type="button"
            className={channel === c.id ? 'is-active' : ''}
            onClick={() => setChannel(c.id)}
          >
            {label('channel', c.id)}
          </button>
        ))}
      </div>

      <p className="field-label">{t('new.kind')}</p>
      <div className="chips">
        {TARGETS.filter((item) => item.id !== 'ozel').map((item) => (
          <button
            key={item.id}
            type="button"
            className={`chip ${target === item.id ? 'is-active' : ''}`}
            onClick={() => setTarget(item.id)}
          >
            {label('target', item.id)}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="cta"
        disabled={busy || person.trim().length === 0 || text.trim().length < 3}
        onClick={() => void onSave({ person, text, channel, target, situation })}
      >
        {busy ? t('new.saving') : t('new.cta')}
      </button>
    </div>
  );
}

/* ------------------------------ kişi profili ------------------------------ */

function ProfileEditor({
  person,
  onBack,
  onSaved,
}: {
  person: string;
  onBack: () => void;
  onSaved: () => Promise<void>;
}) {
  const { t, label } = useI18n();
  const [profile, setProfile] = useState<PersonProfile | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    data
      .getPersonProfile(person)
      .then((existing) => {
        if (!alive) return;
        setProfile(existing ?? { name: person, relation: 'arkadas', gender: 'belirsiz', closeness: 5, notes: '' });
      })
      .catch(() => {
        if (!alive) return;
        setProfile({ name: person, relation: 'arkadas', gender: 'belirsiz', closeness: 5, notes: '' });
      });
    return () => {
      alive = false;
    };
  }, [person]);

  if (!profile) return <p className="muted">{t('ledger.loading')}</p>;

  async function save() {
    if (!profile) return;
    setBusy(true);
    try {
      await data.savePersonProfile(profile);
      await onSaved();
    } finally {
      setBusy(false);
    }
  }

  const closenessHint =
    profile.closeness <= 3
      ? t('profile.close1')
      : profile.closeness <= 6
        ? t('profile.close2')
        : profile.closeness <= 8
          ? t('profile.close3')
          : t('profile.close4');

  return (
    <div className="profile-editor" data-testid="profile-editor">
      <header className="detail-top">
        <button type="button" className="round" onClick={onBack} aria-label={t('profile.back')}>
          ‹
        </button>
        <span className="detail-title">{person}</span>
        <span className="spacer" />
      </header>

      <p className="muted small">{t('profile.intro')}</p>

      <p className="field-label">{t('profile.relation')}</p>
      <div className="chips">
        {TARGETS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`chip ${profile.relation === item.id ? 'is-active' : ''}`}
            onClick={() => setProfile({ ...profile, relation: item.id })}
          >
            {label('target', item.id)}
          </button>
        ))}
      </div>

      <p className="field-label">{t('profile.gender')}</p>
      <div className="seg">
        {[
          { id: 'kadin', labelKey: 'profile.genderWoman' },
          { id: 'erkek', labelKey: 'profile.genderMan' },
          { id: 'belirsiz', labelKey: 'profile.genderNone' },
        ].map((g) => (
          <button
            key={g.id}
            type="button"
            className={profile.gender === g.id ? 'is-active' : ''}
            onClick={() => setProfile({ ...profile, gender: g.id as PersonProfile['gender'] })}
          >
            {t(g.labelKey)}
          </button>
        ))}
      </div>

      <p className="field-label">
        {t('profile.closeness')}: <strong>{profile.closeness}/10</strong>
      </p>
      <input
        className="range"
        type="range"
        min={1}
        max={10}
        step={1}
        value={profile.closeness}
        onChange={(e) => setProfile({ ...profile, closeness: Number(e.target.value) })}
        aria-label={t('profile.closenessAria')}
      />
      <p className="small faint closeness-hint">{closenessHint}</p>

      <label className="field-label" htmlFor="profile-notes">
        {t('profile.notes')}
      </label>
      <textarea
        id="profile-notes"
        className="input textarea"
        placeholder={t('profile.notesPlaceholder')}
        maxLength={300}
        rows={3}
        value={profile.notes}
        onChange={(e) => setProfile({ ...profile, notes: e.target.value })}
      />

      <button type="button" className="cta" onClick={() => void save()} disabled={busy}>
        {busy ? t('profile.saving') : t('profile.save')}
      </button>
    </div>
  );
}
