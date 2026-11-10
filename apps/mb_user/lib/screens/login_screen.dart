import 'dart:async';
import 'package:flutter/material.dart';
import '../services/api_client.dart';
import '../services/auth_service.dart';
import '../theme/app_tokens.dart';
import '../widgets/modals/google_oauth_dialog.dart';
import '../widgets/modals/passkey_dialog.dart';
import 'login/login_header.dart';
import 'login/otp_verification_card.dart';

/// Screen 02: Light-default Authentication Screen with Google OAuth, Passkey,
/// Email/Phone + 6-box OTP flow, and Email/Password visibility toggle.
class LoginScreen extends StatefulWidget {
  final VoidCallback onSuccess;

  const LoginScreen({super.key, required this.onSuccess});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _identifierController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  late final List<TextEditingController> _otpControllers;
  late final List<FocusNode> _otpFocusNodes;

  bool _isLoading = false;
  bool _isOtpStep = false;
  bool _usePasswordMode = false;
  bool _obscurePassword = true;
  int _resendCountdown = 0;
  Timer? _resendTimer;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _otpControllers = List.generate(6, (_) => TextEditingController());
    _otpFocusNodes = List.generate(6, (_) => FocusNode());
  }

  @override
  void dispose() {
    _resendTimer?.cancel();
    _identifierController.dispose();
    _passwordController.dispose();
    for (final c in _otpControllers) {
      c.dispose();
    }
    for (final f in _otpFocusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  void _startOtpCountdown() {
    _resendTimer?.cancel();
    setState(() => _resendCountdown = 60);
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_resendCountdown <= 1) {
        timer.cancel();
        setState(() => _resendCountdown = 0);
      } else {
        setState(() => _resendCountdown--);
      }
    });
  }

  void _proceedToOtpOrPassword() {
    final identifier = _identifierController.text.trim();
    if (identifier.isEmpty) {
      setState(() {
        _errorMessage = 'Vui lòng nhập Email hoặc số điện thoại hợp lệ.';
      });
      return;
    }

    if (_usePasswordMode) {
      _submitEmailPassword();
      return;
    }

    setState(() {
      _errorMessage = null;
      _isOtpStep = true;
    });
    _startOtpCountdown();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _otpFocusNodes.first.requestFocus();
    });
  }

  Future<void> _submitEmailPassword() async {
    final email = _identifierController.text.trim();
    final password = _passwordController.text;
    if (email.isEmpty || password.isEmpty) {
      setState(() => _errorMessage = 'Vui lòng nhập đầy đủ Email và mật khẩu.');
      return;
    }
    await _executeAuth(() async {
      await AuthService.instance.authenticateWithEmailPassword(
        email: email,
        password: password,
      );
    });
  }

  Future<void> _submitOtp() async {
    final code = _otpControllers.map((c) => c.text.trim()).join();
    if (code.length < 6) {
      setState(() => _errorMessage = 'Vui lòng nhập đủ 6 chữ số OTP.');
      return;
    }
    await _executeAuth(() async {
      await AuthService.instance.verifyOtp(
        identifier: _identifierController.text.trim(),
        otpCode: code,
      );
    });
  }

  Future<void> _submitGoogleIdToken(String idToken) async {
    await _executeAuth(() async {
      await AuthService.instance.verifyAndAuthenticate(
        provider: 'google',
        token: idToken,
      );
    });
  }

  Future<void> _executeAuth(Future<void> Function() action) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      await action();
      if (!mounted) return;
      widget.onSuccess();
    } catch (e) {
      if (!mounted) return;
      String displayError = 'Xác thực thất bại. Vui lòng thử lại.';
      if (e is ApiException) {
        displayError = e.statusCode == 0
            ? 'Không thể kết nối đến máy chủ backend. Vui lòng kiểm tra kết nối.'
            : (e.message.isNotEmpty
                ? e.message
                : 'Lỗi xác thực (${e.statusCode}).');
      } else {
        displayError = e.toString().replaceFirst('Exception: ', '');
      }
      setState(() => _errorMessage = displayError);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.tp;

    return Scaffold(
      backgroundColor: c.canvas,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              LoginHeaderSection(errorMessage: _errorMessage),
              OutlinedButton.icon(
                onPressed: _isLoading
                    ? null
                    : () => GoogleOAuthDialog.show(
                          context,
                          onSubmitIdToken: _submitGoogleIdToken,
                        ),
                icon: const Icon(
                  Icons.g_mobiledata_rounded,
                  size: 24,
                  color: AppTokens.googleBlue,
                ),
                label: const Text(
                  'Tiếp tục với Google',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                ),
                style: AppTokens.outlinedButtonStyle(
                  c,
                  backgroundColor: c.surface,
                  foregroundColor: c.textPrimary,
                  borderColor: c.borderStrong,
                  minHeight: 48,
                ),
              ),
              const SizedBox(height: 10),
              ElevatedButton.icon(
                onPressed: _isLoading ? null : () => PasskeyDialog.show(context),
                icon: const Icon(Icons.fingerprint_rounded, size: 20),
                label: const Text(
                  'Đăng nhập với Passkey / Face ID',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                ),
                style: AppTokens.primaryButtonStyle(
                  c,
                  backgroundColor:
                      c.isDark ? c.surfaceSubtle : const Color(0xFF0F172A),
                  foregroundColor: Colors.white,
                  borderColor: c.borderStrong,
                ),
              ),
              const SizedBox(height: 22),
              Row(
                children: [
                  Expanded(child: Divider(color: c.border)),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Text(
                      'HOẶC SỐ ĐIỆN THOẠI / EMAIL',
                      style: AppTokens.monoStyle(
                        color: c.textMuted,
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  Expanded(child: Divider(color: c.border)),
                ],
              ),
              const SizedBox(height: 18),
              if (!_isOtpStep) ...[
                TextField(
                  controller: _identifierController,
                  keyboardType: TextInputType.emailAddress,
                  style: TextStyle(color: c.textPrimary, fontSize: 14),
                  decoration: const InputDecoration(
                    hintText: 'Email hoặc số điện thoại',
                    prefixIcon: Icon(Icons.alternate_email_rounded, size: 18),
                  ),
                ),
                if (_usePasswordMode) ...[
                  const SizedBox(height: 10),
                  TextField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    style: TextStyle(color: c.textPrimary, fontSize: 14),
                    decoration: InputDecoration(
                      hintText: 'Mật khẩu tài khoản',
                      prefixIcon:
                          const Icon(Icons.lock_outline_rounded, size: 18),
                      suffixIcon: IconButton(
                        onPressed: () => setState(
                          () => _obscurePassword = !_obscurePassword,
                        ),
                        icon: Icon(
                          _obscurePassword
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
                  onPressed: _isLoading ? null : _proceedToOtpOrPassword,
                  icon: _isLoading
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
                    _usePasswordMode
                        ? 'Đăng Nhập Tài Khoản'
                        : 'Tiếp tục với OTP',
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
                    onPressed: () => setState(() {
                      _usePasswordMode = !_usePasswordMode;
                      _errorMessage = null;
                    }),
                    style: TextButton.styleFrom(
                      side: BorderSide(color: c.border),
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                    ),
                    child: Text(
                      _usePasswordMode
                          ? 'Chuyển sang xác thực OTP 6 số'
                          : 'Hoặc đăng nhập bằng Email & Mật khẩu',
                      style: TextStyle(color: c.cyanText, fontSize: 12),
                    ),
                  ),
                ),
              ] else ...[
                OtpVerificationCard(
                  identifier: _identifierController.text.trim(),
                  otpControllers: _otpControllers,
                  otpFocusNodes: _otpFocusNodes,
                  resendCountdown: _resendCountdown,
                  isLoading: _isLoading,
                  onChangeIdentifier: () => setState(() {
                    _isOtpStep = false;
                    _errorMessage = null;
                  }),
                  onSubmitOtp: _submitOtp,
                  onResend: _startOtpCountdown,
                ),
              ],
              const SizedBox(height: 28),
              Text(
                'Bảo chứng an toàn bởi Smart Contract Base Sepolia',
                textAlign: TextAlign.center,
                style: AppTokens.monoStyle(
                  color: c.textMuted,
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
