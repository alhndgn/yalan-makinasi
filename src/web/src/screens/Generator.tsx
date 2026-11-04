import { useEffect, useState } from 'react';
import { CHANNELS, DEFAULT_FORM, SITUATIONS, STYLES, TARGETS } from '../../../shared/constants.ts';
import { readDefaults } from '../lib/defaults.ts';
import type { GenerateRequest, Variant } from '../../../shared/schema.ts';
import { IntensitySlider } from '../components/IntensitySlider.tsx';
import { VariantCard } from '../components/VariantCard.tsx';
import { ApiError, api, type RiskPreview } from '../lib/api.ts';

type Props = { onGenerated: (variants: Variant[]) => void };

const RISK_LABEL: Record<RiskPreview['level'], string> = { dusuk: 'DÜŞÜK', orta: 'ORTA', yuksek: 'YÜKSEK' };

export function Generator({ onGenerated }: Props) {
  const [form, setForm] = useState<GenerateRequest>(() => {
    const defaults = readDefaults();
    return { ...DEFAULT_FORM, style: defaults.style, intensity: defaults.intensity };
  });
  // Sonuçlar hangi formla üretildiyse onunla kaydedilir.
  const [usedForm, setUsedForm] = useState<GenerateRequest | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<RiskPreview | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>('template');

  useEffect(() => {
    const timer = setTimeout(() => {
      api
        .previewRisk({ target: form.target, situation: form.situation, channel: form.channel, intensity: form.intensity })
        .then(setPreview)
        .catch(() => setPreview(null));
    }, 250);
    return () => clearTimeout(timer);
  }, [form.target, form.situation, form.channel, form.intensity]);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const request = { ...form };
      const result = await api.generate({ ...request, salt: String(Date.now()) });
      setVariants(result.variants);
      setUsedForm(request);
      setProvider(result.provider ?? 'template');
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
    } finally {
      setLoading(false);
    }
  }

  async function saveVariant(variant: Variant) {
    try {
      await api.saveLie({ variant, form: usedForm ?? form, provider });
      setSavedNote("Defter'e kaydedildi.");
      setTimeout(() => setSavedNote(null), 2200);
    } catch {
      setSavedNote('Kaydedilemedi, tekrar dene.');
    }
  }

  const situationLabel = SITUATIONS.find((s) => s.id === form.situation)?.label ?? '';

  return (
    <section className="stack">
      <header className="hero">
        <p className="eyebrow">kıvırma asistanı</p>
        <h1 className="title">Yalan Makinası</h1>
        <p className="muted">Bir bahane değil, savunulabilir bir hikâye.</p>
      </header>

      <div className="card">
        <p className="label">Kime?</p>
        <div className="chips" role="group" aria-label="Kime">
          {TARGETS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`chip ${form.target === t.id ? 'is-active' : ''}`}
              aria-pressed={form.target === t.id}
              onClick={() => setForm({ ...form, target: t.id })}
            >
              {t.label}
            </button>
          ))}
        </div>

        <p className="label">Ne oldu?</p>
        <div className="chips" role="group" aria-label="Ne oldu">
          {SITUATIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`chip ${form.situation === s.id ? 'is-active' : ''}`}
              aria-pressed={form.situation === s.id}
              onClick={() => setForm({ ...form, situation: s.id })}
            >
              {s.label}
            </button>
          ))}
        </div>

        {form.situation === 'ozel' && (
          <input
            className="input"
            placeholder="Durumu kısaca yaz (en fazla 180 karakter)"
            maxLength={180}
            value={form.situationCustom ?? ''}
            onChange={(e) => setForm({ ...form, situationCustom: e.target.value })}
          />
        )}

        <div className="grid2">
          <div>
            <p className="label">Kanal</p>
            <div className="seg">
              {CHANNELS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={form.channel === c.id ? 'is-active' : ''}
                  onClick={() => setForm({ ...form, channel: c.id })}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="label">Ton</p>
            <div className="seg">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={form.style === s.id ? 'is-active' : ''}
                  onClick={() => setForm({ ...form, style: s.id })}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <IntensitySlider value={form.intensity} onChange={(value) => setForm({ ...form, intensity: value })} />

        {preview && (
          <p className={`preview risk-${preview.level}`} data-testid="risk-preview">
            Şu an: {RISK_LABEL[preview.level]} {preview.score}/100
          </p>
        )}

        <button className="btn-primary" type="button" onClick={generate} disabled={loading}>
          {loading ? 'Yazıyorum…' : 'Üret'}
        </button>

        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}
      </div>

      {variants.length > 0 && (
        <div className="stack">
          <p className="label">
            3 alternatif · {SITUATIONS.find((s) => s.id === (usedForm ?? form).situation)?.label ?? situationLabel}
          </p>
          {variants.map((v, i) => (
            <VariantCard
              key={i}
              variant={v}
              targetLabel={TARGETS.find((t) => t.id === (usedForm ?? form).target)?.label}
              onSave={() => saveVariant(v)}
              onRegenerate={generate}
            />
          ))}
          {savedNote && (
            <p className="toast" role="status">
              {savedNote}
            </p>
          )}
        </div>
      )}

      <p className="fineprint">Bu uygulama eğlence amaçlıdır. Resmî belge veya sağlık raporu üretmez.</p>
    </section>
  );
}
