import type { Lang } from '../lib/i18n.ts';
import { YalanMark } from '../components/YalanMark.tsx';

type Props = {
  onPick: (lang: Lang) => void;
};

/** İlk açılışta bir kez gösterilen dil seçimi. */
export function LanguagePicker({ onPick }: Props) {
  return (
    <section className="screen lang-screen" data-testid="language-picker">
      <div className="lang-head">
        <YalanMark size={56} color="#D0342C" needle="#141312" />
        <h1 className="lang-title">Dil / Language</h1>
        <p className="muted">Uygulamayı hangi dilde kullanacaksın?<br />Which language do you want to use?</p>
      </div>

      <div className="lang-options">
        <button type="button" className="lang-card" onClick={() => onPick('tr')} data-testid="pick-tr">
          <span className="lang-flag">TR</span>
          <span className="lang-name">Türkçe</span>
          <span className="lang-desc">Tüm metinler ve yapay zekâ Türkçe</span>
        </button>

        <button type="button" className="lang-card" onClick={() => onPick('en')} data-testid="pick-en">
          <span className="lang-flag">EN</span>
          <span className="lang-name">English</span>
          <span className="lang-desc">Everything, including the AI, in English</span>
        </button>
      </div>

      <p className="lang-hint">Sonradan Ayarlar’dan değiştirebilirsin · You can change this later in Settings.</p>
    </section>
  );
}
