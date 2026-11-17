import { useEffect, useMemo, useState } from 'react';
import { CHANNELS, DEFAULT_FORM, HINT_MAX, STYLES } from '../../../shared/constants.ts';
import type { GenerateRequest, PersonSummary, Variant } from '../../../shared/schema.ts';
import { GeneratingScreen } from '../components/GeneratingScreen.tsx';
import { VariantDeck } from '../components/VariantDeck.tsx';
import { VariantDetail } from '../components/VariantDetail.tsx';
import { YalanMark } from '../components/YalanMark.tsx';
import { ApiError } from '../lib/api.ts';
import { data } from '../lib/data.ts';
import { readDefaults } from '../lib/defaults.ts';
import { useI18n } from '../lib/lang.tsx';
import { repeatWarning } from '../lib/personView.ts';

type Props = { onGenerated: (variants: Variant[]) => void };
type View = 'form' | 'loading' | 'deck' | 'detail';

/** Şiddet artık kullanıcıya sorulmuyor: orta-üstü sabit bir doz uygulanıyor. */
export const FIXED_INTENSITY = 6;

const QUICK_TARGETS = ['anne', 'arkadas', 'patron', 'sevgili'] as const;

export function Generator({ onGenerated }: Props) {
  const { t, lang, label } = useI18n();
  const defaults = readDefaults();
  const [person, setPerson] = useState('');
  const [target, setTarget] = useState<GenerateRequest['target']>(DEFAULT_FORM.target);
  const [situationText, setSituationText] = useState('');
  const [hint, setHint] = useState('');
  const [channel, setChannel] = useState<GenerateRequest['channel']>(DEFAULT_FORM.channel);
  const [style, setStyle] = useState<GenerateRequest['style']>(defaults.style ?? DEFAULT_FORM.style);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [people, setPeople] = useState<PersonSummary[]>([]);
  const [repeat, setRepeat] = useState<string | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [index, setIndex] = useState(0);
  const [usedPerson, setUsedPerson] = useState('');
  const [view, setView] = useState<View>('form');
  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>('template');

  async function refreshPeople() {
    try {
      const r = await data.people();
      setPeople(Array.isArray(r?.people) ? r.people : []);
    } catch {
      setPeople([]);
    }
  }

  useEffect(() => {
    void refreshPeople();
  }, []);

  useEffect(() => {
    const name = person.trim();
    if (!name) {
      setRepeat(null);
      return;
    }
    data
      .byPerson(name)
      .then((r) => {
        const history = (r.items ?? []).map((i) => ({ situation: i.situation, createdAt: i.createdAt }));
        setRepeat(repeatWarning(history, 'ozel', { person: name, t }));
      })
      .catch(() => setRepeat(null));
  }, [person, t]);

  const suggestions = useMemo(() => {
    const needle = person.trim().toLocaleLowerCase('tr');
    if (!needle) return [];
    return people
      .filter((p) => p.person && p.person.toLocaleLowerCase('tr').includes(needle) && p.person !== person.trim())
      .slice(0, 4);
  }, [people, person]);

  async function generate() {
    setError(null);
    setSavedNote(null);
    setView('loading');
    const request: GenerateRequest = {
      person: person.trim(),
      hint: hint.trim() || undefined,
      target,
      situation: 'ozel',
      situationCustom: situationText.trim().slice(0, 180),
      channel,
      style,
      intensity: FIXED_INTENSITY,
      lang,
    };
    try {
      const result = await data.generate({ ...request, salt: String(Date.now()) });
      setVariants(result.variants);
      setIndex(0);
      setUsedPerson(person.trim());
      setProvider(result.provider ?? 'template');
      setView('deck');
      onGenerated(result.variants);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'UNKNOWN';
      setError(code === 'RATE_LIMITED' ? t('gen.errRate') : code === 'ABUSE_BLOCKED' ? t('gen.errAbuse') : t('gen.errGeneric'));
      setView('form');
    }
  }

  function editVariant(next: string) {
    setVariants((prev) => prev.map((item, i) => (i === index ? { ...item, text: next } : item)));
  }

  async function saveVariant(variant: Variant) {
    try {
      await data.saveLie({
        variant,
        form: {
          person: usedPerson,
          target,
          situation: 'ozel',
          situationCustom: situationText.trim().slice(0, 180),
          channel,
          style,
          intensity: FIXED_INTENSITY,
          lang,
        },
        provider,
      });
      setSavedNote(t('ledger.added'));
      setTimeout(() => setSavedNote(null), 2200);
    } catch {
      setSavedNote(t('ledger.saveFailed'));
    }
  }

  const ready = situationText.trim().length >= 3;

  if (view === 'loading') return <GeneratingScreen />;

  if (view === 'deck' && variants.length > 0) {
    return (
      <VariantDeck
        variants={variants}
        index={index}
        contextLabel={usedPerson || t('detail.them')}
        onIndex={setIndex}
        onEdit={editVariant}
        onUse={() => setView('detail')}
        onBack={() => setView('form')}
      />
    );
  }

  if (view === 'detail' && variants[index]) {
    return (
      <VariantDetail
        variant={variants[index]!}
        index={index}
        total={variants.length}
        personLabel={usedPerson}
        onSave={() => void saveVariant(variants[index]!)}
        onRegenerate={() => void generate()}
        onBack={() => setView('deck')}
        note={savedNote}
      />
    );
  }

  return (
    <section className="screen gen-form" data-provider={provider} data-view={view}>
      <header className="brandbar">
        <div className="brand">
          <YalanMark size={20} color="#D0342C" needle="#141312" />
          <span>{t('gen.brand')}</span>
        </div>
        <button type="button" className="ghost" onClick={() => setShowAdvanced((v) => !v)} aria-expanded={showAdvanced}>
          {t('gen.tone')} {showAdvanced ? '▴' : '▾'}
        </button>
      </header>

      <div className="card form-card">
        <label className="field-label" htmlFor="who">
          {t('gen.who')}
        </label>
        <div className="who-wrap">
          <input
            id="who"
            className="input who-input"
            placeholder={t('gen.whoPlaceholder')}
            maxLength={40}
            autoComplete="off"
            value={person}
            onChange={(e) => {
              setPerson(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => {
              setShowSuggestions(true);
              void refreshPeople();
            }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="who-suggest" role="listbox" aria-label={t('gen.whoAria')}>
              {suggestions.map((p) => (
                <li key={p.person}>
                  <button
                    type="button"
                    className="who-suggest-item"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setPerson(p.person);
                      if (p.relation) setTarget(p.relation);
                      setShowSuggestions(false);
                    }}
                  >
                    <span className="who-avatar">{(p.person[0] ?? '?').toLocaleUpperCase('tr')}</span>
                    <span className="who-info">
                      <span className="who-name">{p.person}</span>
                      <span className="who-meta">
                        {p.count} {t('gen.records')}
                        {p.closeness ? ` · ${t('gen.closeness')} ${p.closeness}/10` : ''}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="chips who-chips">
          {QUICK_TARGETS.map((id) => (
            <button
              key={id}
              type="button"
              className={`chip ${target === id ? 'is-active' : ''}`}
              aria-pressed={target === id}
              onClick={() => setTarget(id as GenerateRequest['target'])}
            >
              {label('target', id)}
            </button>
          ))}
        </div>

        {repeat && <p className="repeat-line">{repeat}</p>}
      </div>

      <div className="card form-card">
        <label className="field-label" htmlFor="what">
          {t('gen.what')}
        </label>
        <textarea
          id="what"
          className="input what-input"
          placeholder={t('gen.whatPlaceholder')}
          maxLength={180}
          rows={3}
          value={situationText}
          onChange={(e) => setSituationText(e.target.value)}
        />
        <p className="char-hint">{situationText.trim().length}/180</p>
      </div>

      <div className="card form-card hint-card">
        <label className="field-label" htmlFor="hint">
          {t('gen.hint')} <span className="optional">{t('gen.hintOptional')}</span>
        </label>
        <input
          id="hint"
          className="input hint-input"
          placeholder={t('gen.hintPlaceholder')}
          maxLength={HINT_MAX}
          value={hint}
          onChange={(e) => setHint(e.target.value)}
        />
      </div>

      {showAdvanced && (
        <div className="card form-card advanced-card">
          <p className="field-label">{t('gen.channel')}</p>
          <div className="seg">
            {CHANNELS.map((c) => (
              <button key={c.id} type="button" className={channel === c.id ? 'is-active' : ''} onClick={() => setChannel(c.id)}>
                {label('channel', c.id)}
              </button>
            ))}
          </div>
          <p className="field-label">{t('gen.style')}</p>
          <div className="seg">
            {STYLES.map((s) => (
              <button key={s.id} type="button" className={style === s.id ? 'is-active' : ''} onClick={() => setStyle(s.id)}>
                {label('style', s.id)}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}

      <button className="cta gen-cta" type="button" onClick={() => void generate()} disabled={!ready}>
        {t('gen.cta')} <small>{t('gen.ctaCount')}</small>
      </button>
    </section>
  );
}
