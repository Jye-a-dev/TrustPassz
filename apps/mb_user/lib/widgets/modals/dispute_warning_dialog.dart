import 'package:flutter/material.dart';
import '../../theme/app_tokens.dart';

/// Modal 04: Legal & eKYC Sanction Warning Dialog before opening a dispute.
class DisputeWarningDialog extends StatelessWidget {
  final VoidCallback onContinue;

  const DisputeWarningDialog({super.key, required this.onContinue});

  static Future<bool?> show(
    BuildContext context, {
    required VoidCallback onContinue,
  }) {
    return showDialog<bool>(
      context: context,
      builder: (_) => DisputeWarningDialog(onContinue: onContinue),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = context.tp;

    return Dialog(
      backgroundColor: c.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
        side: BorderSide(color: c.roseBorder, width: 1.0),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: c.roseSoft,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: c.roseBorder),
                ),
                child: Icon(
                  Icons.warning_amber_rounded,
                  color: c.roseText,
                  size: 28,
                ),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Cảnh Báo Trước Khi Mở Tranh Chấp',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: c.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Hồ sơ sẽ được chuyển trực tiếp tới Trọng Tài AI Vision',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: c.roseText,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: c.canvas,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: c.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _bullet(
                    c,
                    '• Khiếu nại sai sự thật sẽ bị trừ điểm tín nhiệm eKYC của bạn.',
                  ),
                  const SizedBox(height: 6),
                  _bullet(
                    c,
                    '• Tiền ký quỹ sẽ tiếp tục bị phong tỏa cho đến khi trọng tài có phán quyết cuối cùng.',
                  ),
                  const SizedBox(height: 6),
                  _bullet(
                    c,
                    '• Hãy bảo đảm bạn đã chụp ảnh hoặc quay video kiểm thử chi tiết.',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop(true);
                onContinue();
              },
              style: AppTokens.primaryButtonStyle(
                c,
                backgroundColor: AppTokens.rose,
                foregroundColor: Colors.white,
                borderColor: c.roseBorder,
              ),
              child: const Text(
                'Tôi Hiểu & Tiếp Tục Mở Đơn',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: () => Navigator.of(context).pop(false),
              style: AppTokens.outlinedButtonStyle(c),
              child: const Text(
                'Hủy Bỏ & Quay Lại Kiểm Tra',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _bullet(AppColorPalette c, String text) {
    return Text(
      text,
      style: TextStyle(color: c.textSecondary, fontSize: 12, height: 1.4),
    );
  }
}
