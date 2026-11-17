import { useEffect, useMemo, useState } from 'react';
import type { ManualLieInput, PersonSummary, SavedLie } from '../../../shared/schema.ts';
import type { Status } from '../../../shared/constants.ts';
import { CHANNELS, SITUATIONS, TARGETS } from '../../../shared/constants.ts';
import { fallbackAnswer } from '../../../engine/prompt.ts';
import { aiReady, readAiConfig } from '../lib/aiConfig.ts';
import { answerWithAi } from '../lib/aiProvider.ts';
import { data } from '../lib/data.ts';
import { TARGET_LABEL, formatWhen } from '../lib/format.ts';
import { sourceLabel } from '../lib/personView.ts';

type View =
  | { kind: 'people' }
  | { kind: 'person'; person: string }
  | { kind: 'lie'; lie: SavedLie }
  | { kind: 'new' };

const NEXT_STATUS: Record<Status, Status> = { beklemede: 'tuttu', tuttu: 'tutmadı', 'tutmadı': 'beklemede' };
const STATUS_LABEL: Record<Status, string> = { beklemede: 'beklemede', tuttu: 'tuttu', 'tutmadı': 'tutmadı' };

/**
 * Yalan Defteri — uygulamanın merkezi.
 * Kişiye göre gruplu kayıtlar, arama, durum takibi ve "ne diyeyim?" cevabı.
 */
export function Ledger() {
  const [people, setPeople] = useState<PersonSummary[] | null>(null);
  const [lies, setLies] = useState<SavedLie[]>([]);
  const [view, setView] = useState<View>({ kind: 'people' });
  const [query, setQuery] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
      flash('Durum güncellenemedi.');
    }
  }

  async function remove(id: string) {
    await data.deleteLie(id).catch(() => null);
    setLies((prev) => prev.filter((item) => item.id !== id));
    await refreshPeople();
    setView({ kind: 'people' });
    flash('Kayıt silindi.');
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      flash('Kopyalandı.');
    } catch {
      flash('Kopyalanamadı.');
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
      flash('Deftere eklendi.');
    } catch {
      flash('Kaydedilemedi, tekrar dene.');
    } finally {
      setBusy(false);
    }
  }

  const filteredPeople = useMemo(() => {
    const list = people ?? [];
    const needle = query.trim().toLocaleLowerCase('tr');
    if (!needle) return list;

    const matches = new Set(list.filter((p) => p.person.toLocaleLowerCase('tr').includes(needle)).map((p) => p.person));
    for (const lie of lies) {
      if (lie.text.toLocaleLowerCase('tr').includes(needle)) matches.add(lie.person ?? '');
    }
    return list.filter((p) => matches.has(p.person));
  }, [people, query, lies]);

  if (people === null) return <p className="muted">Yükleniyor…</p>;

  return (
    <section className="screen" data-testid="ledger">
      {view.kind === 'people' && (
        <>
          <header className="brandbar">
            <div className="brand">
              <span className="seal-sm">Y</span>
              <span>Yalan Defteri</span>
            </div>
            <button type="button" className="ghost" onClick={() => setView({ kind: 'new' })}>
              + Kaydet
            </button>
          </header>

          <h1 className="h1">Kime ne dedin?</h1>
          <p className="muted">Yalancının mumu artık hep yanacak.</p>

          <input
            className="input search"
            placeholder="Kişi ya da metin ara"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Defterde ara"
          />

          {filteredPeople.length === 0 ? (
            <div className="card empty">
              <p className="empty-title">{people.length === 0 ? 'Defter boş' : 'Sonuç yok'}</p>
              <p className="muted">
                {people.length === 0
                  ? 'İlk yalanını kaydet: kime ne söylediğini yaz; bir dahaki sefere geçmişi hatırlayalım.'
                  : 'Bu aramaya uyan kişi ya da kayıt yok.'}
              </p>
              <button type="button" className="cta" onClick={() => setView({ kind: 'new' })}>
                Yalan kaydet
              </button>
            </div>
          ) : (
            <ul className="people" data-testid="people-list">
              {filteredPeople.map((person) => (
                <li key={person.person || 'isimsiz'}>
                  <button type="button" className="person-card" onClick={() => void openPerson(person.person)}>
                    <span className="person-avatar" aria-hidden="true">
                      {(person.person.trim()[0] ?? '?').toLocaleUpperCase('tr')}
                    </span>
                    <span className="person-main">
                      <span className="person-name">{person.person || 'İsimsiz'}</span>
                      <span className="person-meta">
                        {person.targets.map((t) => TARGET_LABEL[t] ?? t).join(' · ')}
                      </span>
                    </span>
                    <span className="person-side">
                      <span className="person-count">{person.count}</span>
                      {person.conflicts > 0 && <span className="dot dot-red" title="Çelişki var" />}
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
            <button type="button" className="round" onClick={() => setView({ kind: 'people' })} aria-label="Deftere dön">
              ‹
            </button>
            <span className="detail-title">{view.person || 'İsimsiz'}</span>
            <span className="spacer" />
            <button type="button" className="ghost" onClick={() => setView({ kind: 'new' })}>
              + Ekle
            </button>
          </header>

          {lies.filter((lie) => (lie.person ?? '') === view.person).length === 0 ? (
            <p className="muted">Bu kişiye kayıtlı bir şey yok.</p>
          ) : (
            <ul className="lies" data-testid="person-lies">
              {lies
                .filter((lie) => (lie.person ?? '') === view.person)
                .map((lie) => (
                  <li key={lie.id}>
                    <button type="button" className="lie-row" onClick={() => setView({ kind: 'lie', lie })}>
                      <span className="lie-row-top">
                        <span className={`badge badge-${lie.status}`}>{STATUS_LABEL[lie.status]}</span>
                        <span className="small faint">{formatWhen(lie.createdAt)}</span>
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
        setAnswer(await answerWithAi({ lieText: lie.text, question: clean, person: lie.person }, ai));
      } else {
        setAnswer(fallbackAnswer(clean, lie.queries ?? [], lie.text));
      }
    } catch {
      setAnswer(fallbackAnswer(clean, lie.queries ?? [], lie.text));
    } finally {
      setThinking(false);
    }
  }

  return (
    <div className="lie-detail" data-testid="lie-detail">
      <header className="detail-top">
        <button type="button" className="round" onClick={onBack} aria-label="Kişiye dön">
          ‹
        </button>
        <span className="detail-title">{lie.person || 'İsimsiz'}</span>
        <span className="spacer" />
        <span className="small faint">{formatWhen(lie.createdAt)}</span>
      </header>

      <p className="detail-text" data-testid="lie-text">
        {lie.text}
      </p>

      <div className="lie-meta">
        <button type="button" className={`badge badge-${lie.status}`} onClick={onCycle}>
          {STATUS_LABEL[lie.status]} · değiştir
        </button>
        <span className="small muted">
          {sourceLabel(lie.source)} · risk {lie.riskScore}/100
        </span>
      </div>

      {(lie.queries?.length ?? 0) > 0 && (
        <div className="detail-queries">
          <h4>Karşı taraf ne sorar</h4>
          {lie.queries.map((q, i) => (
            <div key={`${q.q}-${i}`} className="qa-block">
              <p className="q">{q.q}</p>
              <p className="a">{q.a}</p>
            </div>
          ))}
        </div>
      )}

      <div className="ask-box">
        <h4>Ne diyeyim?</h4>
        <p className="small muted">
          Karşı taraf bir soru sorduysa yaz; söylediğin yalanla çelişmeyen bir cevap hazırlayalım.
        </p>
        <input
          className="input"
          placeholder="Örn: kiminleydin?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void ask();
          }}
        />
        <button type="button" className="cta small-cta" onClick={() => void ask()} disabled={thinking}>
          {thinking ? 'Düşünüyor…' : 'Cevap hazırla'}
        </button>
        {answer && (
          <div className="answer-box" role="status" data-testid="answer">
            <p className="answer-text">{answer}</p>
            <button
              type="button"
              className="ghost"
              onClick={() => {
                void navigator.clipboard.writeText(answer).then(() => onNote('Cevap kopyalandı.'));
              }}
            >
              Kopyala
            </button>
          </div>
        )}
      </div>

      <div className="detail-actions">
        <button type="button" className="act" onClick={onCopy}>
          ⧉ Yalanı kopyala
        </button>
        <button type="button" className="act ghost" onClick={onCycle}>
          ↻ Durumu değiştir
        </button>
        {confirmDelete ? (
          <button type="button" className="act ghost danger" onClick={onDelete}>
            Eminim, sil
          </button>
        ) : (
          <button type="button" className="act ghost" onClick={() => setConfirmDelete(true)}>
            Sil
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
  const [person, setPerson] = useState('');
  const [text, setText] = useState('');
  const [channel, setChannel] = useState<ManualLieInput['channel']>(() => 'yuz_yuze');
  const [target, setTarget] = useState<ManualLieInput['target']>('arkadas');
  const [situation, setSituation] = useState<ManualLieInput['situation']>('ozel');

  return (
    <div className="new-lie" data-testid="new-lie">
      <header className="detail-top">
        <button type="button" className="round" onClick={onCancel} aria-label="Vazgeç">
          ‹
        </button>
        <span className="detail-title">Yalan kaydet</span>
        <span className="spacer" />
      </header>

      <p className="muted small">Kime ne söylediğini yaz. Bir dahaki sefere bunu hatırlarız.</p>

      <label className="field-label" htmlFor="new-person">
        Kime?
      </label>
      <input
        id="new-person"
        className="input"
        placeholder="Ayşe, patron Mehmet…"
        maxLength={40}
        value={person}
        onChange={(e) => setPerson(e.target.value)}
      />

      <label className="field-label" htmlFor="new-text">
        Ne söyledin?
      </label>
      <textarea
        id="new-text"
        className="input textarea"
        placeholder="Dün akşam trafik vardı, o yüzden gelemedim."
        maxLength={1000}
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <p className="field-label">Hangi durum</p>
      <div className="chips">
        {SITUATIONS.filter((s) => s.id !== 'ozel').map((s) => (
          <button
            key={s.id}
            type="button"
            className={`chip ${situation === s.id ? 'is-active' : ''}`}
            onClick={() => setSituation(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <p className="field-label">Kanal</p>
      <div className="seg">
        {CHANNELS.map((c) => (
          <button
            key={c.id}
            type="button"
            className={channel === c.id ? 'is-active' : ''}
            onClick={() => setChannel(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <p className="field-label">Kimin için</p>
      <div className="chips">
        {TARGETS.filter((t) => t.id !== 'ozel').map((t) => (
          <button
            key={t.id}
            type="button"
            className={`chip ${target === t.id ? 'is-active' : ''}`}
            onClick={() => setTarget(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="cta"
        disabled={busy || person.trim().length === 0 || text.trim().length < 3}
        onClick={() => void onSave({ person, text, channel, target, situation })}
      >
        {busy ? 'Kaydediliyor…' : 'Deftere ekle'}
      </button>
    </div>
  );
}
