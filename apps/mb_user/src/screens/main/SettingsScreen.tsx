/**
 * TrustPassz Mobile - SettingsScreen
 * Application Settings with Zero-Restart Instant Language Switcher.
 * Adheres to Cyber-Escrow Dark Theme and touch targets >= 48x48 pt.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAppTranslation } from '../../hooks/useAppTranslation';
import { SupportedLanguage } from '../../i18n/types';
import { TrustPasszIcon } from '../../components/common/TrustPasszIcon';
import { SecuritySettingsScreen } from '../settings/SecuritySettingsScreen';

export interface SettingsScreenProps {
  onBack?: () => void;
  onLogout?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onBack,
  onLogout,
}) => {
  const { t, currentLanguage, setLanguage, availableLanguages } =
    useAppTranslation();
  const [switchingCode, setSwitchingCode] = useState<SupportedLanguage | null>(
    null
  );
  const [showSecurity, setShowSecurity] = useState<boolean>(false);

  if (showSecurity) {
    return <SecuritySettingsScreen onBack={() => setShowSecurity(false)} />;
  }

  const handleSelectLanguage = async (code: SupportedLanguage) => {
    if (code === currentLanguage) return;
    try {
      setSwitchingCode(code);
      await setLanguage(code);
    } catch {
      Alert.alert(t('common.appName'), t('errors.unknown'));
    } finally {
      setSwitchingCode(null);
    }
  };

  const handleLogoutPress = () => {
    Alert.alert(t('auth.logout'), t('auth.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('auth.logout'),
        style: 'destructive',
        onPress: () => onLogout?.(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <View style={styles.headerRightSpacer}>
          <TrustPasszIcon size={32} variant="minimal" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section: Language Switcher */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🌐</Text>
            <View style={styles.sectionHeaderTextContainer}>
              <Text style={styles.sectionTitle}>
                {t('settings.languageSection')}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {t('settings.languageDesc')}
              </Text>
            </View>
          </View>

          <View style={styles.languageOptionsContainer}>
            {availableLanguages.map((item) => {
              const isActive = currentLanguage === item.code;
              const isSwitching = switchingCode === item.code;

              return (
                <TouchableOpacity
                  key={item.code}
                  style={[
                    styles.languageItem,
                    isActive && styles.languageItemActive,
                  ]}
                  onPress={() => handleSelectLanguage(item.code)}
                  activeOpacity={0.75}
                  disabled={isSwitching}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.label} ${item.subLabel}`}
                >
                  <View style={styles.languageLeft}>
                    <Text style={styles.flagIcon}>{item.flag}</Text>
                    <View style={styles.languageTextGroup}>
                      <Text
                        style={[
                          styles.languageLabel,
                          isActive && styles.languageLabelActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Text style={styles.languageSub}>{item.subLabel}</Text>
                    </View>
                  </View>

                  <View style={styles.languageRight}>
                    {isSwitching ? (
                      <ActivityIndicator size="small" color="#10B981" />
                    ) : isActive ? (
                      <View style={styles.activeCheckBadge}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    ) : (
                      <View style={styles.inactiveRadioCircle} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section: Escrow & Smart Contract Network */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>⚡</Text>
            <View style={styles.sectionHeaderTextContainer}>
              <Text style={styles.sectionTitle}>
                {t('settings.networkSection')}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {t('settings.networkMainnet')}
              </Text>
            </View>
          </View>
        </View>

        {/* Section: Appearance */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🎨</Text>
            <View style={styles.sectionHeaderTextContainer}>
              <Text style={styles.sectionTitle}>
                {t('settings.themeSection')}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {t('settings.themeDark')}
              </Text>
            </View>
          </View>
        </View>

        {/* Section: Security & Biometrics */}
        <TouchableOpacity
          style={styles.sectionCard}
          onPress={() => setShowSecurity(true)}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={t('settings.securitySection')}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🔒</Text>
            <View style={styles.sectionHeaderTextContainer}>
              <Text style={styles.sectionTitle}>
                {t('settings.securitySection')}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {t('settings.biometricAuth')}
              </Text>
            </View>
            <Text style={styles.navChevron}>→</Text>
          </View>
        </TouchableOpacity>

        {/* Section: About & Build */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>ℹ️</Text>
            <View style={styles.sectionHeaderTextContainer}>
              <Text style={styles.sectionTitle}>
                {t('settings.aboutSection')}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {t('settings.version')}: 2.4.0 • {t('settings.buildNumber')}: 20261102
              </Text>
            </View>
          </View>
        </View>

        {/* Logout Action */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogoutPress}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('auth.logout')}
        >
          <Text style={styles.logoutText}>{t('auth.logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#080C14',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0B0F17',
  },
  backButton: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  backArrow: {
    color: '#06B6D4',
    fontSize: 22,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerRightSpacer: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  sectionCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIcon: {
    fontSize: 22,
  },
  sectionHeaderTextContainer: {
    flex: 1,
  },
  sectionTitle: {
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: '600',
  },
  sectionSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  languageOptionsContainer: {
    marginTop: 14,
    gap: 10,
  },
  languageItem: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0B0F17',
    borderWidth: 1.5,
    borderColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  languageItemActive: {
    borderColor: '#10B981',
    backgroundColor: '#062822',
  },
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  flagIcon: {
    fontSize: 24,
  },
  languageTextGroup: {
    flex: 1,
  },
  languageLabel: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '600',
  },
  languageLabelActive: {
    color: '#10B981',
  },
  languageSub: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  languageRight: {
    marginLeft: 12,
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCheckBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: { color: '#080C14', fontSize: 14, fontWeight: '800' },
  inactiveRadioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#334155',
  },
  logoutButton: {
    minHeight: 50,
    backgroundColor: '#2A0E18',
    borderWidth: 1,
    borderColor: '#F43F5E',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  logoutText: { color: '#FDA4AF', fontSize: 15, fontWeight: '700' },
  navChevron: { color: '#06B6D4', fontSize: 20, fontWeight: '700', paddingHorizontal: 6 },
});

