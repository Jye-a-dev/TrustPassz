import 'package:flutter/material.dart';
import '../../theme/app_tokens.dart';
import '../../utils/formatters.dart';

class VaultCountdownCard extends StatelessWidget {
  final Duration remaining;
  final double progressRatio;

  const VaultCountdownCard({
    super.key,
    required this.remaining,
    required this.progressRatio,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.tp;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: AppTokens.cardDecoration(c, radius: 24),
      child: Column(
        children: [
          Text(
            'THỜI GIAN ĐỒNG KIỂM CÒN LẠI',
            style: AppTokens.monoStyle(
              color: c.textMuted,
              fontSize: 10.5,
              letterSpacing: 0.6,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            TrustPasszFormatters.formatHms(remaining),
            style: AppTokens.monoStyle(
              color: c.cyanText,
              fontSize: 32,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: progressRatio,
              minHeight: 8,
              backgroundColor: c.surfaceSubtle,
              valueColor: const AlwaysStoppedAnimation<Color>(AppTokens.cyan),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Sau khi hết thời gian đồng kiểm, hợp đồng thông minh sẽ tự động giải ngân cho người bán nếu bạn không mở khiếu nại.',
            textAlign: TextAlign.center,
            style: TextStyle(color: c.textMuted, fontSize: 12, height: 1.4),
          ),
        ],
      ),
    );
  }
}

class VaultLockedAssetCard extends StatelessWidget {
  final VoidCallback onUnlockTap;

  const VaultLockedAssetCard({super.key, required this.onUnlockTap});

  @override
  Widget build(BuildContext context) {
    final c = context.tp;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: AppTokens.cardDecoration(c, radius: 24),
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: c.cyanSoft,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: c.cyanBorder),
            ),
            child: Icon(
              Icons.lock_outline_rounded,
              color: c.cyanText,
              size: 28,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Tài Sản Số Đang Bị Khóa Két',
            style: TextStyle(
              color: c.textPrimary,
              fontSize: 15,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Yêu cầu xác thực sinh trắc học Face ID / Touch ID hoặc PIN 6 số để giải mã tại chỗ.',
            textAlign: TextAlign.center,
            style: TextStyle(color: c.textMuted, fontSize: 12),
          ),
          const SizedBox(height: 14),
          OutlinedButton.icon(
            onPressed: onUnlockTap,
            icon: Icon(Icons.fingerprint_rounded, size: 18, color: c.cyanText),
            label: Text(
              'Chạm để mở khóa bảo mật',
              style: TextStyle(
                color: c.cyanText,
                fontSize: 12.5,
                fontWeight: FontWeight.bold,
              ),
            ),
            style: AppTokens.outlinedButtonStyle(
              c,
              backgroundColor: c.cyanSoft,
              borderColor: AppTokens.cyan,
              minHeight: 46,
            ),
          ),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: c.amberSoft,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: c.amberBorder),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.shield_outlined, size: 16, color: c.amberText),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Bảo vệ chống rò rỉ: Dữ liệu đã giải mã sẽ tự động xóa sạch khỏi bộ nhớ RAM sau 30 giây.',
                    style: TextStyle(
                      color: c.amberText,
                      fontSize: 11,
                      height: 1.35,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
