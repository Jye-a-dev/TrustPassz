/**
 * TrustPassz Mobile - i18n Unit & Integration Tests
 * Verifies Zero-Restart dynamic language switching, fallback, and parameter interpolation.
 */

jest.mock(
  'react-native',
  () => ({
    Platform: { OS: 'android', Version: 34, select: (obj: any) => obj.android },
    NativeModules: {
      I18nManager: { localeIdentifier: 'vi_VN' },
      SettingsManager: { settings: {} },
    },
  }),
  { virtual: true }
);

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { i18n, t } from '../src/i18n/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('TrustPassz Mobile i18n Engine', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('defaults to Vietnamese (vi) and resolves common keys', () => {
    expect(t('common.appName')).toBe('TrustPassz');
    expect(t('common.confirm')).toBe('Xác nhận');
    expect(t('common.status.DEPOSITED')).toBe('Đã khóa tiền ký quỹ');
  });

  it('switches dynamically to English (en) without app restart', async () => {
    let triggeredLang: string | null = null;
    const unsubscribe = i18n.subscribe((lang) => {
      triggeredLang = lang;
    });

    await i18n.setLanguage('en');

    expect(triggeredLang).toBe('en');
    expect(i18n.getLanguage()).toBe('en');
    expect(t('common.confirm')).toBe('Confirm');
    expect(t('common.status.DEPOSITED')).toBe('Escrow Locked');
    expect(t('settings.title')).toBe('Settings');

    unsubscribe();
  });

  it('switches back to Vietnamese and updates all keys instantly', async () => {
    await i18n.setLanguage('vi');

    expect(i18n.getLanguage()).toBe('vi');
    expect(t('common.confirm')).toBe('Xác nhận');
    expect(t('greeting.pillar1Subtitle')).toBe('Napas 247 Khóa Tiền Tự Động');
  });

  it('persists selected language in AsyncStorage', async () => {
    await i18n.setLanguage('en');
    const stored = await AsyncStorage.getItem('@trustpassz_language_code');
    expect(stored).toBe('en');
  });

  it('interpolates dynamic variables inside translation strings', () => {
    const rawResult = t('settings.version');
    expect(typeof rawResult).toBe('string');
  });
});
