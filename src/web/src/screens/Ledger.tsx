import { useEffect, useMemo, useState } from 'react';
import type { ManualLieInput, PersonProfile, PersonSummary, SavedLie } from '../../../shared/schema.ts';
import type { Status } from '../../../shared/constants.ts';
import { CHANNELS, SITUATIONS, TARGETS } from '../../../shared/constants.ts';
import { fallbackAnswer } from '../../../engine/prompt.ts';
import { aiReady, readAiConfig } from '../lib/aiConfig.ts';
import { answerWithAi } from '../lib/aiProvider.ts';
import { data } from '../lib/data.ts';
import { formatWhen } from '../lib/format.ts';
import { sourceLabel } from '../lib/personView.ts';
import { useI18n } from '../lib/lang.tsx';

type View =
  | { kind: 'people' }
  | { kind: 'person'; person: string }
  | { kind: 'lie'; lie: SavedLie }
  | { kind: 'new' }
  | { kind: 'profile'; person: string };

const NEXT_STATUS: Record<Status, Status> = { beklemede: 'tuttu', tuttu: 'tutmadı', 'tutmadı': 'beklemede' };

export function Ledger() {
  const { t, lang, label } = useI18n();
  const [people, setPeople] = useState<PersonSummary[] | null>(null);
  const [lies, setLies] = useState<SavedLie[]>([]);
  const [view, setView] = useState<View>({ kind: 'people' });
  const [query, setQuery] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const statusLabel = (status: Status) => t(`status.${status}`);

  async function refreshPeople() {
    try {
      const result = await data.people();
      setPeople(Array.isArray(result?.people) ? result.people : []);
    } catch {
      setPeople([]);
    }
  }

  useEffect(() => {
    void refreshPeople();
    data
      .listLies()
      .then((r) => setLies(Array.isArray(r?.items) ? r.items : []))
      .catch(() => setLies([]));
  }, []);

  function flash(message: string) {
    setNote(message);
    setTimeout(() => setNote(null), 2200);
  }

  async function openPerson(person: string) {
    setView({ kind: 'person', person });
    try {
      const result = await data.byPerson(person);
      setLies(Array.isArray(result?.items) ? result.items : []);
    } catch {
      setLies([]);
    }
  }

  async function cycleStatus(lie: SavedLie) {
    const next = NEXT_STATUS[lie.status];
    setView({ kind: 'lie', lie: { ...lie, status: next } });
    setLies((prev) => prev.map((item) => (item.id === lie.id ? { ...item, status: next } : item)));
    try {
      await data.updateStatus(lie.id, next);
      await refreshPeople();
    } catch {
      flash(t('ledger.statusFailed'));
    }
  }

  async function remove(id: string) {
    await data.deleteLie(id).catch(() => null);
    setLies((prev) => prev.filter((item) => item.id !== id));
    await refreshPeople();
    setView({ kind: 'people' });
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
      await refreshPeople();
      const result = await data.listLies();
      setLies(Array.isArray(result?.items) ? result.items : []);
      setView({ kind: 'person', person: input.person.trim() });
      flash(t('ledger.added'));
    } catch {
      flash(t('ledger.saveFailed'));
    } finally {
      setBusy(false);
    }
  }

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

          <h1 className="h1">{t('ledger.heading')}</h1>
          <p className="muted">{t('app.slogan')}</p>

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
              {filteredPeople.map((person) => (
                <li key={person.person || 'unnamed'}>
                  <button type="button" className="person-card" onClick={() => void openPerson(person.person)}>
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
                      {person.conflicts > 0 && <span className="dot dot-red" title="!" />}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {view.kind === 'person' && (
        <>
          <header className="detail-top">
            <button type="button" className="round" onClick={() => setView({ kind: 'people' })} aria-label={t('ledger.back')}>
              ‹
            </button>
            <span className="detail-title">{view.person || t('ledger.unnamed')}</span>
            <span className="spacer" />
            <button type="button" className="ghost" onClick={() => setView({ kind: 'profile', person: view.person })}>
              {t('ledger.profile')}
            </button>
            <button type="button" className="ghost" onClick={() => setView({ kind: 'new' })}>
              {t('ledger.addShort')}
            </button>
          </header>

          {lies.filter((lie) => (lie.person ?? '') === view.person).length === 0 ? (
            <p className="muted">{t('ledger.noneForPerson')}</p>
          ) : (
            <ul className="lies" data-testid="person-lies">
              {lies
                .filter((lie) => (lie.person ?? '') === view.person)
                .map((lie) => (
                  <li key={lie.id}>
                    <button type="button" className="lie-row" onClick={() => setView({ kind: 'lie', lie })}>
                      <span className="lie-row-top">
                        <span className={`badge badge-${lie.status}`}>{statusLabel(lie.status)}</span>
                        <span className="small faint">{formatWhen(lie.createdAt, lang)}</span>
                      </span>
                      <span className="lie-row-text">{lie.text}</span>
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </>
      )}

      {view.kind === 'lie' && (
        <LieDetail
          lie={view.lie}
          onBack={() => void openPerson(view.lie.person ?? '')}
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
            await refreshPeople();
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

function ProfileEditor({
  person,
  onBack,
  onSaved,
}: {
  person: string;
  onBack: () => void;
  onSaved: () => Promise<void>;
}) {
  const { t, lang, label } = useI18n();
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
