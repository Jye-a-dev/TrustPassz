import 'package:flutter/material.dart';
import '../../theme/app_tokens.dart';

/// Modal 08: Dispute Filed Successfully Dialog with SLA < 15m commitment.
class DisputeSuccessDialog extends StatelessWidget {
  final String disputeCode;
  final VoidCallback onTrackOrders;
  final VoidCallback onGoHome;

  const DisputeSuccessDialog({
    super.key,
    required this.disputeCode,
    required this.onTrackOrders,
    required this.onGoHome,
  });

  static Future<void> show(
    BuildContext context, {
    required String disputeCode,
    required VoidCallback onTrackOrders,
    required VoidCallback onGoHome,
  }) {
    return showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (_) => DisputeSuccessDialog(
        disputeCode: disputeCode,
        onTrackOrders: onTrackOrders,
        onGoHome: onGoHome,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = context.tp;

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
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: c.cyanSoft,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: AppTokens.cyan, width: 2),
                ),
                child: Icon(
                  Icons.verified_user_rounded,
                  color: c.cyanText,
                  size: 32,
                ),
              ),
            ),
            const SizedBox(height: 12),
            Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: c.cyanSoft,
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: c.cyanBorder),
                ),
                child: Text(
                  'Mã Hồ Sơ: $disputeCode',
                  style: AppTokens.monoStyle(color: c.cyanText, fontSize: 10),
                ),
              ),
            ),
            const SizedBox(height: 10),
            Text(
              'Đã Tiếp Nhận Khiếu Nại!',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: c.textPrimary,
                fontSize: 17,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Trọng tài AI Vision đang đối soát bằng chứng đa phương tiện và lịch sử giao dịch.',
              textAlign: TextAlign.center,
              style: TextStyle(color: c.textMuted, fontSize: 12, height: 1.4),
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
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Thời gian xử lý:',
                        style: TextStyle(color: c.textMuted, fontSize: 12),
                      ),
                      Text(
                        '< 15 phút',
                        style: AppTokens.monoStyle(
                          color: c.amberText,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Trạng thái quỹ:',
                        style: TextStyle(color: c.textMuted, fontSize: 12),
                      ),
                      Text(
                        'Tạm khóa 100%',
                        style: AppTokens.monoStyle(
                          color: c.roseText,
                          fontSize: 12,
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
                Navigator.of(context).pop();
                onTrackOrders();
              },
              style: AppTokens.primaryButtonStyle(c),
              child: const Text(
                'Theo Dõi Tiến Trình Trọng Tài',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: () {
                Navigator.of(context).pop();
                onGoHome();
              },
              style: AppTokens.outlinedButtonStyle(c),
              child: const Text(
                'Về Trang Chủ',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
