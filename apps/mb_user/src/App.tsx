/**
 * TrustPassz Mobile - Root Application Container
 * Wraps root tree with LanguageProvider for Zero-Restart dynamic language switching.
 */

import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LanguageProvider, useAppTranslation } from './hooks/useAppTranslation';
import { SettingsScreen } from './screens/main/SettingsScreen';
import { DisputeScreen } from './screens/main/DisputeScreen';
import { TrustPasszIcon } from './components/common/TrustPasszIcon';

type NavigationTab = 'home' | 'dispute' | 'settings';

const MainNavigator: React.FC = () => {
  const { t, isReady, currentLanguage } = useAppTranslation();
  const [activeTab, setActiveTab] = useState<NavigationTab>('home');

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <TrustPasszIcon size={56} variant="glow" />
        <ActivityIndicator
          size="small"
          color="#10B981"
          style={styles.loadingIndicator}
        />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.rootContainer}>
      {/* Dynamic Screen Viewport */}
      <View style={styles.screenContainer}>
        {activeTab === 'home' && (
          <View style={styles.dashboardContainer}>
            <View style={styles.dashboardHeader}>
              <View>
                <Text style={styles.appName}>{t('common.appName')}</Text>
                <Text style={styles.tagline}>{t('common.tagline')}</Text>
              </View>
              <TrustPasszIcon size={38} variant="shield" />
            </View>

            {/* Escrow Balance Card */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>{t('home.balanceTitle')}</Text>
              <Text style={styles.balanceAmount}>250,000,000 VND</Text>
              <View style={styles.balanceRow}>
                <View style={styles.balanceSubCol}>
                  <Text style={styles.balanceSubLabel}>
                    {t('home.lockedBalance')}
                  </Text>
                  <Text style={styles.balanceSubValue}>180,000,000 VND</Text>
                </View>
                <View style={styles.balanceSubCol}>
                  <Text style={styles.balanceSubLabel}>
                    {t('home.availableBalance')}
                  </Text>
                  <Text style={styles.balanceSubValue}>70,000,000 VND</Text>
                </View>
              </View>
            </View>

            {/* Quick Actions Grid */}
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={styles.actionBtn}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={t('home.createDeal')}
              >
                <Text style={styles.actionIcon}>📝</Text>
                <Text style={styles.actionText}>{t('home.createDeal')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={t('home.scanQR')}
              >
                <Text style={styles.actionIcon}>⚡</Text>
                <Text style={styles.actionText}>{t('home.scanQR')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                activeOpacity={0.75}
                onPress={() => setActiveTab('dispute')}
                accessibilityRole="button"
                accessibilityLabel={t('home.dispute')}
              >
                <Text style={styles.actionIcon}>⚖️</Text>
                <Text style={styles.actionText}>{t('home.dispute')}</Text>
              </TouchableOpacity>
            </View>

            {/* Status indicator showing current locale */}
            <View style={styles.localeBanner}>
              <Text style={styles.localeBannerText}>
                Active Locale: {currentLanguage.toUpperCase()} • Zero-Restart Ready
              </Text>
            </View>
          </View>
        )}

        {activeTab === 'dispute' && (
          <DisputeScreen
            onBack={() => setActiveTab('home')}
            onDisputeCreated={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            onBack={() => setActiveTab('home')}
            onLogout={() => setActiveTab('home')}
          />
        )}
      </View>

      {/* Cyber-Escrow Bottom Navigation TabBar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'home' && styles.tabItemActive]}
          onPress={() => setActiveTab('home')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('home.title')}
        >
          <Text style={styles.tabIcon}>🏠</Text>
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'home' && styles.tabLabelActive,
            ]}
          >
            {t('home.title')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'dispute' && styles.tabItemActive,
          ]}
          onPress={() => setActiveTab('dispute')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('dispute.screenTitle')}
        >
          <Text style={styles.tabIcon}>⚖️</Text>
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'dispute' && styles.tabLabelActive,
            ]}
          >
            {t('home.dispute')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'settings' && styles.tabItemActive,
          ]}
          onPress={() => setActiveTab('settings')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('settings.title')}
        >
          <Text style={styles.tabIcon}>⚙️</Text>
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'settings' && styles.tabLabelActive,
            ]}
          >
            {t('settings.title')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <MainNavigator />
    </LanguageProvider>
  );
};

export default App;

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#080C14',
  },
  screenContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#080C14',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingIndicator: {
    marginTop: 20,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 12,
  },
  dashboardContainer: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  dashboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  appName: {
    color: '#06B6D4',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tagline: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  balanceCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 18,
  },
  balanceLabel: {
    color: '#94A3B8',
    fontSize: 13,
  },
  balanceAmount: {
    color: '#10B981',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  balanceSubCol: {
    flex: 1,
  },
  balanceSubLabel: {
    color: '#64748B',
    fontSize: 11,
  },
  balanceSubValue: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    minHeight: 74,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  actionIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  actionText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  localeBanner: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#062822',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
    alignItems: 'center',
  },
  localeBannerText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    minHeight: 64,
    backgroundColor: '#0B0F17',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabItemActive: {
    borderRadius: 8,
  },
  tabIcon: {
    fontSize: 18,
  },
  tabLabel: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#06B6D4',
    fontWeight: '700',
  },
});

