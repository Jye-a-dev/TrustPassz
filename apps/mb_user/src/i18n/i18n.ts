/**
 * TrustPassz Mobile - Zero-Restart Dynamic i18n Engine
 * Implements persistent language switching via AsyncStorage and reactive subscribers.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';
import viDict from './locales/vi.json';
import enDict from './locales/en.json';
import {
  SupportedLanguage,
  TxKeyPath,
  InterpolationParams,
  TranslationSchema,
} from './types';

declare const __DEV__: boolean;

const STORAGE_KEY = '@trustpassz_language_code';
const FALLBACK_LANGUAGE: SupportedLanguage = 'vi';

const dictionaries: Record<SupportedLanguage, TranslationSchema> = {
  vi: viDict as unknown as TranslationSchema,
  en: enDict as unknown as TranslationSchema,
};

type LanguageSubscriber = (lang: SupportedLanguage) => void;

class I18nEngine {
  private currentLang: SupportedLanguage = FALLBACK_LANGUAGE;
  private isInitialized = false;
  private readonly subscribers = new Set<LanguageSubscriber>();

  constructor() {
    this.detectInitialLocale();
  }

  /**
   * Fast initial locale probe before AsyncStorage completes hydration.
   */
  private detectInitialLocale(): void {
    try {
      let deviceLocale = '';
      const modules = NativeModules as Record<string, any>;

      if (Platform.OS === 'ios') {
        const settings = modules.SettingsManager?.settings;
        deviceLocale =
          settings?.AppleLocale || settings?.AppleLanguages?.[0] || '';
      } else if (Platform.OS === 'android') {
        deviceLocale = modules.I18nManager?.localeIdentifier || '';
      } else if (typeof navigator !== 'undefined') {
        deviceLocale = navigator.language || '';
      }

      if (deviceLocale.toLowerCase().startsWith('en')) {
        this.currentLang = 'en';
      } else {
        this.currentLang = 'vi';
      }
    } catch {
      this.currentLang = FALLBACK_LANGUAGE;
    }
  }

  /**
   * Initializes i18n from persistent AsyncStorage.
   */
  public async init(): Promise<SupportedLanguage> {
    if (this.isInitialized) {
      return this.currentLang;
    }

    try {
      const persisted = await AsyncStorage.getItem(STORAGE_KEY);
      if (persisted === 'vi' || persisted === 'en') {
        this.currentLang = persisted;
      }
    } catch (error) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[TrustPassz i18n] Failed to load persisted locale:', error);
      }
    } finally {
      this.isInitialized = true;
      this.notifySubscribers();
    }

    return this.currentLang;
  }

  /**
   * Gets the current active language code.
   */
  public getLanguage(): SupportedLanguage {
    return this.currentLang;
  }

  /**
   * Switches language dynamically without app restart or navigator unmounting.
   */
  public async setLanguage(newLang: SupportedLanguage): Promise<void> {
    if (newLang === this.currentLang && this.isInitialized) {
      return;
    }

    this.currentLang = newLang;
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newLang);
    } catch (error) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[TrustPassz i18n] Failed to persist language:', error);
      }
    }

    this.notifySubscribers();
  }

  /**
   * Subscribes to dynamic language changes. Returns cleanup function.
   */
  public subscribe(callback: LanguageSubscriber): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((callback) => {
      try {
        callback(this.currentLang);
      } catch (err) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.error('[TrustPassz i18n] Subscriber error:', err);
        }
      }
    });
  }

  /**
   * Resolves a nested key with type safety and variable interpolation.
   */
  public translate(keyPath: TxKeyPath, params?: InterpolationParams): string {
    const activeDict = dictionaries[this.currentLang] || dictionaries[FALLBACK_LANGUAGE];
    const fallbackDict = dictionaries[FALLBACK_LANGUAGE];

    const keys = keyPath.split('.');
    let result: unknown = activeDict;

    for (const key of keys) {
      if (result && typeof result === 'object' && key in (result as Record<string, unknown>)) {
        result = (result as Record<string, unknown>)[key];
      } else {
        result = undefined;
        break;
      }
    }

    // Fallback lookup if key is missing in active locale
    if (result === undefined || typeof result !== 'string') {
      let fallbackResult: unknown = fallbackDict;
      for (const key of keys) {
        if (fallbackResult && typeof fallbackResult === 'object' && key in (fallbackResult as Record<string, unknown>)) {
          fallbackResult = (fallbackResult as Record<string, unknown>)[key];
        } else {
          fallbackResult = undefined;
          break;
        }
      }
      result = typeof fallbackResult === 'string' ? fallbackResult : keyPath;
    }

    if (typeof result !== 'string') {
      return keyPath;
    }

    // Parameter interpolation: {varName} -> value
    if (params) {
      return result.replace(/\{(\w+)\}/g, (_, match) => {
        return params[match] !== undefined ? String(params[match]) : `{${match}}`;
      });
    }

    return result;
  }
}

export const i18n = new I18nEngine();
export const t = (key: TxKeyPath, params?: InterpolationParams): string =>
  i18n.translate(key, params);
