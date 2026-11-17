import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { labelFor, readLang, translate, writeLang, type Lang } from './i18n.ts';

type LangValue = {
  lang: Lang;
  setLang: (next: Lang) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  label: (kind: 'target' | 'situation' | 'channel' | 'style', id: string) => string;
};

/** Sağlayıcı olmadan da (testler, tek bileşen kullanımı) Türkçe ile çalışır. */
const fallbackValue: LangValue = {
  lang: 'tr',
  setLang: () => {},
  t: (key, params) => translate('tr', key, params),
  label: (kind, id) => labelFor('tr', kind, id),
};

const LangContext = createContext<LangValue>(fallbackValue);

export function LangProvider({ children, initial }: { children: ReactNode; initial?: Lang }) {
  const [lang, setLangState] = useState<Lang>(() => initial ?? readLang() ?? 'tr');

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    writeLang(next);
    try {
      document.documentElement.lang = next;
    } catch {
      /* yoksay */
    }
  }, []);

  const value = useMemo<LangValue>(
    () => ({
      lang,
      setLang,
      t: (key, params) => translate(lang, key, params),
      label: (kind, id) => labelFor(lang, kind, id),
    }),
    [lang, setLang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useI18n(): LangValue {
  return useContext(LangContext);
}
