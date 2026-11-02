/**
 * TrustPassz Mobile - useAppTranslation Hook & Language Context
 * Provides reactive translation bindings with Zero-Restart dynamic updates.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { i18n, t as rawTranslate } from '../i18n/i18n';
import {
  SupportedLanguage,
  TxKeyPath,
  InterpolationParams,
  LanguageMeta,
  SUPPORTED_LANGUAGES,
} from '../i18n/types';

export interface AppTranslationContextValue {
  t: (key: TxKeyPath, params?: InterpolationParams) => string;
  currentLanguage: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  isReady: boolean;
  availableLanguages: LanguageMeta[];
}

const LanguageContext = createContext<AppTranslationContextValue | null>(null);

export interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
}) => {
  const [currentLanguage, setCurrentLanguageState] = useState<SupportedLanguage>(
    i18n.getLanguage()
  );
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    // Initialize persisted language from AsyncStorage
    i18n.init().then((lang) => {
      if (isMounted) {
        setCurrentLanguageState(lang);
        setIsReady(true);
      }
    });

    // Subscribe to runtime language switch events
    const unsubscribe = i18n.subscribe((newLang) => {
      if (isMounted) {
        setCurrentLanguageState(newLang);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleSetLanguage = useCallback(
    async (newLang: SupportedLanguage) => {
      await i18n.setLanguage(newLang);
      setCurrentLanguageState(newLang);
    },
    []
  );

  const translate = useCallback(
    (key: TxKeyPath, params?: InterpolationParams): string => {
      // Force reference to currentLanguage for React reconciliation
      void currentLanguage;
      return rawTranslate(key, params);
    },
    [currentLanguage]
  );

  const contextValue = useMemo<AppTranslationContextValue>(
    () => ({
      t: translate,
      currentLanguage,
      setLanguage: handleSetLanguage,
      isReady,
      availableLanguages: SUPPORTED_LANGUAGES,
    }),
    [translate, currentLanguage, handleSetLanguage, isReady]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * Primary reactive hook for screen and component translations.
 */
export const useAppTranslation = (): AppTranslationContextValue => {
  const context = useContext(LanguageContext);

  // If outside of LanguageProvider, fallback to direct reactive state
  const [localLang, setLocalLang] = useState<SupportedLanguage>(
    i18n.getLanguage()
  );

  useEffect(() => {
    if (context) return;
    const unsubscribe = i18n.subscribe((newLang) => {
      setLocalLang(newLang);
    });
    return unsubscribe;
  }, [context]);

  if (context) {
    return context;
  }

  return {
    t: (key: TxKeyPath, params?: InterpolationParams) => {
      void localLang;
      return rawTranslate(key, params);
    },
    currentLanguage: localLang,
    setLanguage: async (lang: SupportedLanguage) => {
      await i18n.setLanguage(lang);
      setLocalLang(lang);
    },
    isReady: true,
    availableLanguages: SUPPORTED_LANGUAGES,
  };
};

