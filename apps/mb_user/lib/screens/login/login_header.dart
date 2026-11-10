import 'package:flutter/material.dart';
import '../../theme/app_tokens.dart';
import '../../widgets/common/server_status_bar.dart';

class LoginHeaderSection extends StatelessWidget {
  final String? errorMessage;

  const LoginHeaderSection({super.key, this.errorMessage});

  @override
  Widget build(BuildContext context) {
    final c = context.tp;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 12),
        Center(
          child: Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: AppTokens.textDark,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: c.borderStrong),
            ),
            alignment: Alignment.center,
            child: const Text(
              'TP',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w900,
                fontSize: 18,
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'Chào mừng trở lại',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: c.textPrimary,
            fontSize: 22,
            fontWeight: FontWeight.bold,
            letterSpacing: -0.4,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          'Đăng nhập để quản lý két ký quỹ và giao dịch của bạn.',
          textAlign: TextAlign.center,
          style: TextStyle(color: c.textMuted, fontSize: 13),
        ),
        const SizedBox(height: 14),
        const Center(child: ServerStatusBar()),
        const SizedBox(height: 24),
        if (errorMessage != null) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: c.roseSoft,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: c.roseBorder),
            ),
            child: Row(
              children: [
                Icon(Icons.error_outline, color: c.roseText, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    errorMessage!,
                    style: TextStyle(color: c.roseText, fontSize: 12),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
        ],
      ],
    );
  }
}
