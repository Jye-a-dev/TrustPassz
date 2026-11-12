import 'package:flutter/material.dart';
import '../../theme/app_tokens.dart';

/// Email/Phone input + optional Password field + OTP/Password submit CTA
/// used on the Login screen when not on the 6-digit OTP verification step.
class LoginCredentialsSection extends StatelessWidget {
  final TextEditingController identifierController;
  final TextEditingController passwordController;
  final bool usePasswordMode;
  final bool obscurePassword;
  final bool isLoading;
  final bool showButtonSpinner;
  final VoidCallback onTogglePasswordVisibility;
  final VoidCallback onSubmit;
  final VoidCallback onToggleMode;

  const LoginCredentialsSection({
    super.key,
    required this.identifierController,
    required this.passwordController,
    required this.usePasswordMode,
    required this.obscurePassword,
    required this.isLoading,
    required this.showButtonSpinner,
    required this.onTogglePasswordVisibility,
    required this.onSubmit,
    required this.onToggleMode,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.tp;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextField(
          controller: identifierController,
          enabled: !isLoading,
          keyboardType: TextInputType.emailAddress,
          style: TextStyle(color: c.textPrimary, fontSize: 14),
          decoration: const InputDecoration(
            hintText: 'Email hoặc số điện thoại',
            prefixIcon: Icon(Icons.alternate_email_rounded, size: 18),
          ),
        ),
        if (usePasswordMode) ...[
          const SizedBox(height: 10),
          TextField(
            controller: passwordController,
            enabled: !isLoading,
            obscureText: obscurePassword,
            style: TextStyle(color: c.textPrimary, fontSize: 14),
            decoration: InputDecoration(
              hintText: 'Mật khẩu tài khoản',
              prefixIcon: const Icon(Icons.lock_outline_rounded, size: 18),
              suffixIcon: IconButton(
                onPressed: onTogglePasswordVisibility,
                icon: Icon(
                  obscurePassword
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                  size: 18,
                ),
              ),
            ),
          ),
        ],
        const SizedBox(height: 12),
        ElevatedButton.icon(
          onPressed: isLoading ? null : onSubmit,
          icon: showButtonSpinner
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Color(0xFF020617),
                  ),
                )
              : const Icon(Icons.arrow_forward_rounded, size: 18),
          label: Text(
            usePasswordMode ? 'Đăng Nhập Tài Khoản' : 'Tiếp tục với OTP',
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
          style: AppTokens.primaryButtonStyle(c),
        ),
        const SizedBox(height: 8),
        Align(
          alignment: Alignment.center,
          child: TextButton(
            onPressed: isLoading ? null : onToggleMode,
            style: TextButton.styleFrom(
              side: BorderSide(color: c.border),
              padding: const EdgeInsets.symmetric(horizontal: 14),
            ),
            child: Text(
              usePasswordMode
                  ? 'Chuyển sang xác thực OTP 6 số'
                  : 'Hoặc đăng nhập bằng Email & Mật khẩu',
              style: TextStyle(color: c.cyanText, fontSize: 12),
            ),
          ),
        ),
      ],
    );
  }
}
