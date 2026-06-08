'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import mn from '@/locales/mn.json';
import en from '@/locales/en.json';

export type Locale = 'mn' | 'en';

type Messages = typeof mn;

const STORAGE_KEY = 'uj_language';

const catalogs: Record<Locale, Messages> = { mn, en: en as unknown as Messages };

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  messages: Messages;
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

function resolvePath(obj: Record<string, unknown>, path: string): string {
  const value = path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
  return typeof value === 'string' ? value : path;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('mn');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'mn') setLocaleState(stored);
    const onLanguageChange = (event: Event) => {
      const next = (event as CustomEvent<Locale>).detail;
      if (next === 'en' || next === 'mn') setLocaleState(next);
    };
    window.addEventListener('uj-language-change', onLanguageChange);
    return () => window.removeEventListener('uj-language-change', onLanguageChange);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next === 'en' ? 'en' : 'mn';
    window.dispatchEvent(new CustomEvent('uj-language-change', { detail: next }));
  }, []);

  const messages = catalogs[locale];

  const t = useCallback((key: string) => resolvePath(messages as unknown as Record<string, unknown>, key), [messages]);

  const value = useMemo(() => ({ locale, setLocale, t, messages }), [locale, setLocale, t, messages]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
