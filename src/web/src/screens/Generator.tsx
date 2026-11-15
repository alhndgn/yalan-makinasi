import { useEffect, useState } from 'react';
import { CHANNELS, DEFAULT_FORM, SITUATIONS, STYLES, TARGETS } from '../../../shared/constants.ts';
import type { GenerateRequest, Variant } from '../../../shared/schema.ts';
import { GeneratingScreen } from '../components/GeneratingScreen.tsx';
import { IntensitySlider } from '../components/IntensitySlider.tsx';
import { StepCard } from '../components/StepCard.tsx';
import { VariantDeck } from '../components/VariantDeck.tsx';
import { VariantDetail } from '../components/VariantDetail.tsx';
import { YalanMark } from '../components/YalanMark.tsx';
import { ApiError, type RiskPreview } from '../lib/api.ts';
import { data } from '../lib/data.ts';
import { readDefaults } from '../lib/defaults.ts';
import { intensityBand } from '../lib/intensity.ts';

type Props = { onGenerated: (variants: Variant[]) => void };
type View = 'form' | 'loading' | 'deck' | 'detail';

const RISK_LABEL: Record<RiskPreview['level'], string> = { dusuk: 'düşük', orta: 'orta', yuksek: 'yüksek' };

export function Generator({ onGenerated }: Props) {
  const [form, setForm] = useState<GenerateRequest>(() => {
    const defaults = readDefaults();
    return { ...DEFAULT_FORM, style: defaults.style, intensity: defaults.intensity };
  });
  const [usedForm, setUsedForm] = useState<GenerateRequest | null>(null);
  const [openStep, setOpenStep] = useState<1 | 2 | 3>(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [index, setIndex] = useState(0);
  const [view, setView] = useState<View>('form');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<RiskPreview | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>('template');

  useEffect(() => {
    const timer = setTimeout(() => {
      data
        .previewRisk({ target: form.target, situation: form.situation, channel: form.channel, intensity: form.intensity })
        .then(setPreview)
        .catch(() => setPreview(null));
    }, 250);
    return () => clearTimeout(timer);
  }, [form.target, form.situation, form.channel, form.intensity]);

  function pick<T extends Partial<GenerateRequest>>(patch: T, nextStep: 1 | 2 | 3) {
    setForm((prev) => ({ ...prev, ...patch }));
    setOpenStep(nextStep);
  }

  async function generate() {
    setError(null);
    setSavedNote(null);
    setView('loading');
    try {
      const request = { ...form };
      const result = await data.generate({ ...request, salt: String(Date.now()) });
      setVariants(result.variants);
      setIndex(0);
      setUsedForm(request);
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
      setVariants([]);
      setView('form');
    }
  }

  async function saveVariant(variant: Variant) {
    try {
      await data.saveLie({ variant, form: usedForm ?? form, provider });
      setSavedNote("Defter'e kaydedildi.");
      setTimeout(() => setSavedNote(null), 2200);
    } catch {
      setSavedNote('Kaydedilemedi, tekrar dene.');
    }
  }

  const targetLabel = TARGETS.find((t) => t.id === form.target)?.label ?? '';
  const situationLabel = SITUATIONS.find((s) => s.id === form.situation)?.label ?? '';
  const band = intensityBand(form.intensity);
  const resultForm = usedForm ?? form;
  const resultTarget = TARGETS.find((t) => t.id === resultForm.target)?.label ?? '';
  const resultSituation = SITUATIONS.find((s) => s.id === resultForm.situation)?.label ?? '';

  let screen: React.ReactNode;

  if (view === 'loading') {
    screen = <GeneratingScreen />;
  } else if (view === 'deck' && variants.length > 0) {
    screen = (
      <VariantDeck
        variants={variants}
        index={index}
        contextLabel={`${resultSituation} · ${resultTarget}`}
        onIndex={setIndex}
        onUse={() => setView('detail')}
        onBack={() => setView('form')}
      />
    );
  } else if (view === 'detail' && variants[index]) {
    screen = (
      <VariantDetail
        variant={variants[index]!}
        index={index}
        total={variants.length}
        targetLabel={resultTarget}
        onSave={() => void saveVariant(variants[index]!)}
        onRegenerate={() => void generate()}
        onBack={() => setView('deck')}
      />
    );
  } else {
    screen = renderForm();
  }

  function renderForm() {
    return (
      <>
        <header className="brandbar">
          <div className="brand">
            <YalanMark size={22} color="#D0342C" needle="#141312" />
            <span>Yalan Makinası</span>
          </div>
          <span />
        </header>

        <h1 className="h1">Üç adım</h1>
        <p className="muted">Sırayla seç, gerisi kendiliğinden.</p>

        <div style={{ marginTop: 20 }}>
          <StepCard step={1} title="Kime?" summary={targetLabel} open={openStep === 1} onOpen={() => setOpenStep(1)}>
            <div className="chips">
              {TARGETS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`chip ${form.target === t.id ? 'is-active' : ''}`}
                  aria-pressed={form.target === t.id}
                  onClick={() => pick({ target: t.id }, 2)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </StepCard>

          <StepCard step={2} title="Ne oldu?" summary={situationLabel} open={openStep === 2} onOpen={() => setOpenStep(2)}>
            <div className="chips">
              {SITUATIONS.filter((s) => s.id !== 'ozel').map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`chip ${form.situation === s.id ? 'is-active' : ''}`}
                  aria-pressed={form.situation === s.id}
                  onClick={() => pick({ situation: s.id }, 3)}
                >
                  {s.label}
                </button>
              ))}
              <button
                type="button"
                className={`chip ${form.situation === 'ozel' ? 'is-active' : ''}`}
                aria-pressed={form.situation === 'ozel'}
                onClick={() => setForm((prev) => ({ ...prev, situation: 'ozel' }))}
              >
                Kendim yazacağım
              </button>
            </div>

            {form.situation === 'ozel' && (
              <input
                className="input"
                placeholder="Durumu kısaca yaz (en fazla 180 karakter)"
                maxLength={180}
                value={form.situationCustom ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, situationCustom: e.target.value }))}
              />
            )}
          </StepCard>

          <StepCard
            step={3}
            title="Yalan şiddeti"
            summary={`${form.intensity} · ${band.label}`}
            open={openStep === 3}
            onOpen={() => setOpenStep(3)}
          >
            <div className="big-val">
              <strong>{form.intensity}</strong>
              <em>
                {band.label}
                {preview ? ` · risk ${RISK_LABEL[preview.level]}` : ''}
              </em>
            </div>
            <IntensitySlider value={form.intensity} onChange={(value) => setForm((prev) => ({ ...prev, intensity: value }))} />
          </StepCard>
        </div>

        <button className="cta" type="button" onClick={() => void generate()}>
          Üret <small>3 alternatif</small>
        </button>

        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          className="more-toggle"
          aria-expanded={showAdvanced}
          onClick={() => setShowAdvanced((v) => !v)}
        >
          Ton · Kanal {showAdvanced ? '▴' : '▾'}
        </button>

        {showAdvanced && (
          <div className="more-box">
            <p className="field-label">Kanal</p>
            <div className="seg">
              {CHANNELS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={form.channel === c.id ? 'is-active' : ''}
                  onClick={() => setForm((prev) => ({ ...prev, channel: c.id }))}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <p className="field-label">Ton</p>
            <div className="seg">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={form.style === s.id ? 'is-active' : ''}
                  onClick={() => setForm((prev) => ({ ...prev, style: s.id }))}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="fineprint">Bu uygulama eğlence amaçlıdır. Resmî belge veya sağlık raporu üretmez.</p>
      </>
    );
  }

  return (
    <section className="screen" data-provider={provider} data-view={view}>
      {screen}
      {savedNote && (
        <p className="toast" role="status">
          {savedNote}
        </p>
      )}
    </section>
  );
}
