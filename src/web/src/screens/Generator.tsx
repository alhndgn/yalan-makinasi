import { useEffect, useState } from 'react';
import { CHANNELS, DEFAULT_FORM, STYLES } from '../../../shared/constants.ts';
import type { GenerateRequest, PersonSummary, Variant } from '../../../shared/schema.ts';
import { GeneratingScreen } from '../components/GeneratingScreen.tsx';
import { IntensityGauge } from '../components/IntensityGauge.tsx';
import { VariantDeck } from '../components/VariantDeck.tsx';
import { VariantDetail } from '../components/VariantDetail.tsx';
import { YalanMark } from '../components/YalanMark.tsx';
import { ApiError } from '../lib/api.ts';
import { data } from '../lib/data.ts';
import { readDefaults } from '../lib/defaults.ts';
import { repeatWarning } from '../lib/personView.ts';

type Props = { onGenerated: (variants: Variant[]) => void };
type View = 'form' | 'loading' | 'deck' | 'detail';

/** Kimin için kutusunun altındaki dört hızlı seçenek. */
const QUICK_TARGETS = [
  { id: 'anne', label: 'Anne-baba' },
  { id: 'arkadas', label: 'Arkadaş' },
  { id: 'patron', label: 'Patron' },
  { id: 'sevgili', label: 'Sevgili' },
] as const;

export function Generator({ onGenerated }: Props) {
  const defaults = readDefaults();
  const [person, setPerson] = useState('');
  const [target, setTarget] = useState<GenerateRequest['target']>(DEFAULT_FORM.target);
  const [situationText, setSituationText] = useState('');
  const [intensity, setIntensity] = useState(defaults.intensity ?? DEFAULT_FORM.intensity);
  const [channel, setChannel] = useState<GenerateRequest['channel']>(DEFAULT_FORM.channel);
  const [style, setStyle] = useState<GenerateRequest['style']>(defaults.style ?? DEFAULT_FORM.style);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [people, setPeople] = useState<PersonSummary[]>([]);
  const [repeat, setRepeat] = useState<string | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [index, setIndex] = useState(0);
  const [usedPerson, setUsedPerson] = useState('');
  const [view, setView] = useState<View>('form');
  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>('template');

  useEffect(() => {
    data
      .people()
      .then((r) => setPeople(Array.isArray(r?.people) ? r.people : []))
      .catch(() => setPeople([]));
  }, []);

  // Aynı kişiye daha önce ne söyledin?
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
        setRepeat(repeatWarning(history, 'ozel'));
      })
      .catch(() => setRepeat(null));
  }, [person]);

  async function generate() {
    setError(null);
    setSavedNote(null);
    setView('loading');
    const request: GenerateRequest = {
      person: person.trim(),
      target,
      situation: 'ozel',
      situationCustom: situationText.trim().slice(0, 180),
      channel,
      style,
      intensity,
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
      setError(
        code === 'RATE_LIMITED'
          ? 'Biraz bekle, çok hızlı üretiyorsun.'
          : code === 'ABUSE_BLOCKED'
            ? 'Bu tür bir metin üretemem (belge, rapor, resmî kayıt).'
            : 'Bir şeyler ters gitti, tekrar dene.',
      );
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
          intensity,
        },
        provider,
      });
      setSavedNote("Defter'e kaydedildi.");
      setTimeout(() => setSavedNote(null), 2200);
    } catch {
      setSavedNote('Kaydedilemedi, tekrar dene.');
    }
  }

  const ready = situationText.trim().length >= 3;

  if (view === 'loading') return <GeneratingScreen />;

  if (view === 'deck' && variants.length > 0) {
    return (
      <VariantDeck
        variants={variants}
        index={index}
        contextLabel={usedPerson || 'karşı taraf'}
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
          <span>Yalan Makinası</span>
        </div>
        <button type="button" className="ghost" onClick={() => setShowAdvanced((v) => !v)} aria-expanded={showAdvanced}>
          Ton · Kanal {showAdvanced ? '▴' : '▾'}
        </button>
      </header>

      <div className="card form-card">
        <label className="field-label" htmlFor="who">
          Kimin için?
        </label>
        <input
          id="who"
          className="input who-input"
          list="ym-people"
          placeholder="İsim yaz — ör. Ayşe, patron Mehmet"
          maxLength={40}
          value={person}
          onChange={(e) => setPerson(e.target.value)}
        />
        <datalist id="ym-people">
          {people.map((p) => (
            <option key={p.person} value={p.person} />
          ))}
        </datalist>

        <div className="chips who-chips">
          {QUICK_TARGETS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`chip ${target === item.id ? 'is-active' : ''}`}
              aria-pressed={target === item.id}
              onClick={() => setTarget(item.id as GenerateRequest['target'])}
            >
              {item.label}
            </button>
          ))}
        </div>

        {repeat && <p className="repeat-line">{repeat}</p>}
      </div>

      <div className="card form-card">
        <label className="field-label" htmlFor="what">
          Ne oldu?
        </label>
        <textarea
          id="what"
          className="input what-input"
          placeholder="Kendi cümlelerinle yaz: dün akşam iş çıktı, gelemedim…"
          maxLength={180}
          rows={3}
          value={situationText}
          onChange={(e) => setSituationText(e.target.value)}
        />
        <p className="char-hint">{situationText.trim().length}/180</p>
      </div>

      <div className="card form-card gauge-card">
        <IntensityGauge value={intensity} onChange={setIntensity} />
      </div>

      {showAdvanced && (
        <div className="card form-card advanced-card">
          <p className="field-label">Kanal</p>
          <div className="seg">
            {CHANNELS.map((c) => (
              <button key={c.id} type="button" className={channel === c.id ? 'is-active' : ''} onClick={() => setChannel(c.id)}>
                {c.label}
              </button>
            ))}
          </div>
          <p className="field-label">Ton</p>
          <div className="seg">
            {STYLES.map((s) => (
              <button key={s.id} type="button" className={style === s.id ? 'is-active' : ''} onClick={() => setStyle(s.id)}>
                {s.label}
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
        Üret <small>3 alternatif</small>
      </button>
    </section>
  );
}
