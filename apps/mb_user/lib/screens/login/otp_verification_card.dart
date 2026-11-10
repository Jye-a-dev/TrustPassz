import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../theme/app_tokens.dart';

class OtpVerificationCard extends StatelessWidget {
  final String identifier;
  final List<TextEditingController> otpControllers;
  final List<FocusNode> otpFocusNodes;
  final int resendCountdown;
  final bool isLoading;
  final VoidCallback onChangeIdentifier;
  final VoidCallback onSubmitOtp;
  final VoidCallback onResend;

  const OtpVerificationCard({
    super.key,
    required this.identifier,
    required this.otpControllers,
    required this.otpFocusNodes,
    required this.resendCountdown,
    required this.isLoading,
    required this.onChangeIdentifier,
    required this.onSubmitOtp,
    required this.onResend,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.tp;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: AppTokens.cardDecoration(c, radius: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Nhập mã OTP 6 số',
                style: TextStyle(
                  color: c.textPrimary,
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
              TextButton(
                onPressed: onChangeIdentifier,
                style: TextButton.styleFrom(
                  side: BorderSide(color: c.border),
                ),
                child: Text(
                  'Đổi Email/SĐT',
                  style: TextStyle(color: c.cyanText, fontSize: 11.5),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'Mã xác thực đã gửi tới $identifier',
            style: TextStyle(color: c.textMuted, fontSize: 12),
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(6, (index) {
              return SizedBox(
                width: 44,
                height: 48,
                child: TextField(
                  controller: otpControllers[index],
                  focusNode: otpFocusNodes[index],
                  textAlign: TextAlign.center,
                  keyboardType: TextInputType.number,
                  maxLength: 1,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  style: AppTokens.monoStyle(color: c.textPrimary, fontSize: 17),
                  decoration: const InputDecoration(
                    counterText: '',
                    contentPadding: EdgeInsets.zero,
                  ),
                  onChanged: (value) {
                    if (value.isNotEmpty && index < 5) {
                      otpFocusNodes[index + 1].requestFocus();
                    } else if (value.isEmpty && index > 0) {
                      otpFocusNodes[index - 1].requestFocus();
                    }
                  },
                ),
              );
            }),
          ),
          const SizedBox(height: 14),
          ElevatedButton(
            onPressed: isLoading ? null : onSubmitOtp,
            style: AppTokens.primaryButtonStyle(c),
            child: isLoading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Color(0xFF020617),
                    ),
                  )
                : const Text(
                    'Xác Nhận Mã OTP',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
          ),
          const SizedBox(height: 8),
          OutlinedButton(
            onPressed: resendCountdown > 0 ? null : onResend,
            style: AppTokens.outlinedButtonStyle(c),
            child: Text(
              resendCountdown > 0
                  ? 'Gửi lại mã sau ${resendCountdown}s'
                  : 'Gửi lại mã OTP',
              style: const TextStyle(fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }
}
