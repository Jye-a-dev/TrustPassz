import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';

export default function App() {
  const [dealStatus] = useState<string>('InInspection');

  const openBankingApp = (amount: number, note: string) => {
    // Luồng Deep Link VietQR mở app ngân hàng
    const deepLinkUrl = `vietqr://transfer?amount=${amount}&note=${encodeURIComponent(note)}`;
    Linking.openURL(deepLinkUrl).catch(() => {
      Alert.alert('Thông báo', 'Không thể mở app ngân hàng. Vui lòng quét mã QR thủ công.');
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>TrustPassz Mobile Deal Room</Text>
        <Text style={styles.subtitle}>Giao dịch mã nguồn / License Key số</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Trạng thái: {dealStatus}</Text>
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={() => openBankingApp(500000, 'TPZ_DEAL_01')}
        >
          <Text style={styles.buttonText}>Thanh toán ký quỹ (Mở App Bank)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#1e293b', padding: 24, borderRadius: 16, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#f8fafc', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#94a3b8', marginBottom: 16 },
  badge: { backgroundColor: '#334155', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, marginBottom: 24 },
  badgeText: { color: '#38bdf8', fontWeight: '600' },
  button: { backgroundColor: '#2563eb', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 10, width: '100%', alignItems: 'center' },
  buttonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 }
});
