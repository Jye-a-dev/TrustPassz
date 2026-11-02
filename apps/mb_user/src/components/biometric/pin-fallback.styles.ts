import { StyleSheet } from 'react-native';

export const pinFallbackStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.9)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#0B0F17',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  lockoutBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A1705',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    gap: 8,
  },
  lockoutIcon: {
    fontSize: 16,
  },
  lockoutText: {
    color: '#FCD34D',
    fontSize: 12,
    fontWeight: '600',
  },
  lockoutTime: {
    color: '#F59E0B',
    fontWeight: '800',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: 14,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#334155',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    borderColor: '#10B981',
    backgroundColor: '#10B981',
  },
  dotCurrent: {
    borderColor: '#06B6D4',
  },
  dotError: {
    borderColor: '#EF4444',
    backgroundColor: '#7F1D1D',
  },
  statusBox: {
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  verifyingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifyingText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  numpad: {
    width: '100%',
    maxWidth: 320,
    gap: 14,
  },
  numpadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  numBtn: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '600',
  },
  actionKeyBtn: {
    backgroundColor: '#080C14',
    borderColor: '#1E293B',
  },
  actionKeyText: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: '700',
  },
  biometricGlyph: {
    fontSize: 22,
  },
});

