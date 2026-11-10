import 'package:flutter/material.dart';
import '../../theme/app_tokens.dart';
import '../../utils/formatters.dart';

/// Modal 02: Price Bargain Confirmation Dialog comparing original vs proposed price.
class BargainConfirmDialog extends StatelessWidget {
  final double originalPrice;
  final double proposedPrice;
  final VoidCallback onConfirm;

  const BargainConfirmDialog({
    super.key,
    required this.originalPrice,
    required this.proposedPrice,
    required this.onConfirm,
  });

  static Future<bool?> show(
    BuildContext context, {
    required double originalPrice,
    required double proposedPrice,
    required VoidCallback onConfirm,
  }) {
    return showDialog<bool>(
      context: context,
      builder: (_) => BargainConfirmDialog(
        originalPrice: originalPrice,
        proposedPrice: proposedPrice,
        onConfirm: onConfirm,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = context.tp;
    final savings = (originalPrice - proposedPrice).clamp(0.0, originalPrice);
    final pct = originalPrice > 0 ? ((savings / originalPrice) * 100).round() : 0;

    return Dialog(
      backgroundColor: c.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
        side: BorderSide(color: c.border, width: 1.0),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: c.cyanSoft,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: c.cyanBorder),
                ),
                child: Icon(
                  Icons.balance_rounded,
                  color: c.cyanText,
                  size: 24,
                ),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Xác Nhận Đề Xuất Giá',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: c.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Người bán sẽ có 2 giờ để chấp nhận hoặc phản hồi đề xuất.',
              textAlign: TextAlign.center,
              style: TextStyle(color: c.textMuted, fontSize: 12),
            ),
            const SizedBox(height: 16),

            // Price Comparison Box
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: c.canvas,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: c.border),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Giá niêm yết ban đầu:',
                        style: TextStyle(color: c.textMuted, fontSize: 12),
                      ),
                      Text(
                        TrustPasszFormatters.formatVnd(originalPrice),
                        style: AppTokens.monoStyle(
                          color: c.textMuted,
                          fontSize: 12,
                        ).copyWith(decoration: TextDecoration.lineThrough),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Giá đề xuất mới:',
                        style: TextStyle(
                          color: c.textPrimary,
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        TrustPasszFormatters.formatVnd(proposedPrice),
                        style: AppTokens.monoStyle(
                          color: c.cyanText,
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Divider(height: 1, color: c.border),
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Khoản tiết kiệm:',
                        style: TextStyle(
                          color: c.emeraldText,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        '-${TrustPasszFormatters.formatVnd(savings)} (-$pct%)',
                        style: AppTokens.monoStyle(
                          color: c.emeraldText,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop(true);
                onConfirm();
              },
              style: AppTokens.primaryButtonStyle(c),
              child: const Text(
                'Xác Nhận & Gửi Đề Xuất Ngay',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: () => Navigator.of(context).pop(false),
              style: AppTokens.outlinedButtonStyle(c),
              child: const Text(
                'Điều Chỉnh Lại',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
