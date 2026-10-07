import 'package:flutter/material.dart';
import '../models/deal_model.dart';
import '../services/secure_clipboard_service.dart';

class VaultModal extends StatelessWidget {
  final DealModel deal;
  final UnlockedVaultPayload vaultData;
  final VoidCallback onSettle;
  final VoidCallback onDispute;

  const VaultModal({
    super.key,
    required this.deal,
    required this.vaultData,
    required this.onSettle,
    required this.onDispute,
  });

  static Future<void> show({
    required BuildContext context,
    required DealModel deal,
    required UnlockedVaultPayload vaultData,
    required VoidCallback onSettle,
    required VoidCallback onDispute,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => VaultModal(
        deal: deal,
        vaultData: vaultData,
        onSettle: onSettle,
        onDispute: onDispute,
      ),
    );
  }

  Future<void> _copyContent(BuildContext context, String content) async {
    final success = await SecureClipboardService.instance.copy(content);
    if (!context.mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Đã sao chép khóa/nội dung! (Tự động xóa sau 30 giây bảo mật)',
          ),
          backgroundColor: Color(0xFF0F766E),
          duration: Duration(seconds: 3),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final secretData = vaultData.decryptedKeyOrUrl ??
        vaultData.encryptedPayload ??
        'Khóa truy cập bảo mật hợp lệ';

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      decoration: const BoxDecoration(
        color: Color(0xFF0A0F1D),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        border: Border(top: BorderSide(color: Color(0xFF1E293B))),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFF334155),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Row(
              children: [
                Icon(Icons.lock_open, color: Color(0xFF10B981), size: 22),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Két Số Digital Vault (AES-256-GCM)',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            const Text(
              'Escrow đã xác nhận tiền đặt cọc. Dữ liệu số đã được mở khóa an toàn:',
              style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF020617),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF1E293B)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        vaultData.fileName,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFF064E3B),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          vaultData.assetType,
                          style: const TextStyle(
                            color: Color(0xFF34D399),
                            fontSize: 10,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFF334155)),
                    ),
                    child: Text(
                      secretData,
                      style: const TextStyle(
                        color: Color(0xFF22D3EE),
                        fontSize: 12,
                        fontFamily: 'monospace',
                      ),
                      maxLines: 4,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton.icon(
                      onPressed: () => _copyContent(context, secretData),
                      icon: const Icon(Icons.copy, size: 14, color: Color(0xFF38BDF8)),
                      label: const Text(
                        'Sao chép (Tự xóa sau 30s)',
                        style: TextStyle(color: Color(0xFF38BDF8), fontSize: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                onSettle();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                foregroundColor: const Color(0xFF020617),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              child: const Text(
                '✓ Xác Nhận Đúng Hàng & Giải Ngân',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
            ),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: () {
                Navigator.of(context).pop();
                onDispute();
              },
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Color(0xFFF43F5E)),
                foregroundColor: const Color(0xFFF43F5E),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              child: const Text(
                '⚖️ Báo Cáo Sai Hàng / Khiếu Nại Trọng Tài AI',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

