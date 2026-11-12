import 'package:flutter/material.dart';
import '../../theme/app_tokens.dart';
import '../../utils/formatters.dart';

/// Modal 03: Napas 24/7 Escrow Deposit Confirmed Bottom Sheet with Base Sepolia TxHash.
class TransferSuccessSheet extends StatelessWidget {
  final String dealId;
  final double amount;
  final String? txHash;
  final VoidCallback onOpenVault;

  const TransferSuccessSheet({
    super.key,
    required this.dealId,
    required this.amount,
    this.txHash,
    required this.onOpenVault,
  });

  static Future<void> show(
    BuildContext context, {
    required String dealId,
    required double amount,
    String? txHash,
    required VoidCallback onOpenVault,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => TransferSuccessSheet(
        dealId: dealId,
        amount: amount,
        txHash: txHash,
        onOpenVault: onOpenVault,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = context.tp;
    final formattedAmount = TrustPasszFormatters.formatVnd(amount);
    final dealCode = TrustPasszFormatters.formatDealCode(dealId);
    final txDisplay = TrustPasszFormatters.shortTxHash(txHash);

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 24),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        border: Border.all(color: c.border, width: 1.0),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: c.borderStrong,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
            const SizedBox(height: 18),
            Center(
              child: Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: c.emeraldSoft,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppTokens.emerald, width: 2),
                ),
                child: Icon(
                  Icons.check_rounded,
                  color: c.emeraldText,
                  size: 32,
                ),
              ),
            ),
            const SizedBox(height: 12),
            Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: c.emeraldSoft,
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: c.emeraldBorder),
                ),
                child: Text(
                  'Napas 24/7 Verified',
                  style: AppTokens.monoStyle(color: c.emeraldText, fontSize: 10),
                ),
              ),
            ),
            const SizedBox(height: 10),
            Text(
              'Tiền Đã Khóa Vào Két Ký Quỹ!',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: c.textPrimary,
                fontSize: 18,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Hệ thống đã nhận đủ $formattedAmount và đóng băng an toàn trên Smart Contract.',
              textAlign: TextAlign.center,
              style: TextStyle(color: c.textMuted, fontSize: 12, height: 1.4),
            ),
            const SizedBox(height: 16),

            // Receipt Card
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: c.canvas,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: c.border),
              ),
              child: Column(
                children: [
                  _receiptRow(c, 'Mã hợp đồng:', dealCode, valueColor: c.textPrimary),
                  const SizedBox(height: 8),
                  _receiptRow(c, 'Mạng kiểm soát:', 'Base Sepolia',
                      valueColor: c.cyanText),
                  const SizedBox(height: 8),
                  _receiptRow(c, 'Mã giao dịch (Tx):', txDisplay,
                      valueColor: c.textMuted),
                ],
              ),
            ),
            const SizedBox(height: 16),

            ElevatedButton.icon(
              onPressed: () {
                Navigator.of(context).pop();
                onOpenVault();
              },
              icon: const Icon(Icons.lock_open_rounded, size: 18),
              label: const Text(
                'Vào Két Mở Khóa Tài Sản Ngay',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
              style: AppTokens.primaryButtonStyle(c),
            ),
          ],
        ),
      ),
    );
  }

  Widget _receiptRow(
    AppColorPalette c,
    String label,
    String value, {
    required Color valueColor,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(color: c.textMuted, fontSize: 12)),
        Text(
          value,
          style: AppTokens.monoStyle(color: valueColor, fontSize: 12),
        ),
      ],
    );
  }
}
