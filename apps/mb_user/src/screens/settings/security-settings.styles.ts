import { StyleSheet } from 'react-native';

export const securitySettingsStyles = StyleSheet.create({
  root: {
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
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  scroll: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 18,
    gap: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIcon: {
    fontSize: 22,
  },
  cardHeaderTexts: {
    flex: 1,
  },
  cardTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  statusDetails: {
    backgroundColor: '#080C14',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 12,
    gap: 10,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    color: '#64748B',
    fontSize: 12,
  },
  statusValue: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
  statusGreen: {
    color: '#10B981',
  },
  statusAmber: {
    color: '#F59E0B',
  },
  toggleRowBtn: {
    minHeight: 52,
    backgroundColor: '#0B0F17',
    borderWidth: 1.5,
    borderColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleRowBtnActive: {
    borderColor: '#10B981',
    backgroundColor: '#062822',
  },
  toggleRowText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  switchIndicator: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#334155',
    padding: 2,
    justifyContent: 'center',
  },
  switchIndicatorActive: {
    backgroundColor: '#10B981',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  actionBtn: {
    minHeight: 48,
    backgroundColor: '#0B0F17',
    borderWidth: 1,
    borderColor: '#06B6D4',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#06B6D4',
    fontSize: 14,
    fontWeight: '700',
  },
  dangerCard: {
    borderColor: '#881337',
    backgroundColor: '#1C0B12',
  },
  dangerTitle: {
    color: '#FDA4AF',
    fontSize: 15,
    fontWeight: '700',
  },
  dangerDesc: {
    color: '#F43F5E',
    fontSize: 12,
  },
  dangerBtn: {
    minHeight: 48,
    backgroundColor: '#9F1239',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

