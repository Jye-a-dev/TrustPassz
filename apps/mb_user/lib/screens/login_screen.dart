import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../services/api_client.dart';
import '../services/auth_service.dart';
import '../theme/app_tokens.dart';
import '../widgets/modals/passkey_dialog.dart';
import 'login/google_sign_in_button.dart';
import 'login/login_credentials_section.dart';
import 'login/login_header.dart';
import 'login/otp_verification_card.dart';

/// Screen 02: Version 2 Light-default (#FAFAFB) / Dark (#080C14) Authentication Screen
/// featuring native OS Google Sign-In, Passkey FIDO2, 6-digit OTP, and Email/Password.
class LoginScreen extends StatefulWidget {
  final VoidCallback onSuccess;

  const LoginScreen({super.key, required this.onSuccess});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  static const String _googleWebClientId = String.fromEnvironment(
    'GOOGLE_WEB_CLIENT_ID',
    defaultValue: '',
  );

  late final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: const <String>['email', 'profile', 'openid'],
    serverClientId: _googleWebClientId.isNotEmpty ? _googleWebClientId : null,
  );

  final TextEditingController _identifierController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  late final List<TextEditingController> _otpControllers;
  late final List<FocusNode> _otpFocusNodes;

  bool _isLoading = false;
  bool _isGoogleSigningIn = false;
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

  Future<void> _handleGoogleSignIn() async {
    if (_isLoading) return;

    setState(() {
      _isLoading = true;
      _isGoogleSigningIn = true;
      _errorMessage = null;
    });

    try {
      // Clear cached session so the native picker lets the user choose any account.
      try {
        if (await _googleSignIn.isSignedIn()) {
          await _googleSignIn.signOut();
        }
      } catch (_) {
        // Non-fatal: continue to interactive sign-in.
      }

      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) {
        return;
      }

      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;
      final String? idToken = googleAuth.idToken;
      if (idToken == null || idToken.trim().isEmpty) {
        if (!mounted) return;
        _showErrorSnackBar(
          'Không lấy được ID Token từ Google. Vui lòng kiểm tra cấu hình Client ID.',
        );
        return;
      }

      final authRes = await AuthService.instance.verifyAndAuthenticate(
        provider: 'google',
        token: idToken.trim(),
        email: googleUser.email,
      );
      if (authRes.accessToken.isEmpty) {
        if (!mounted) return;
        _showErrorSnackBar(
          'Phản hồi xác thực từ máy chủ không hợp lệ. Vui lòng thử lại.',
        );
        return;
      }

      if (!mounted) return;
      widget.onSuccess();
    } on PlatformException catch (e) {
      if (!mounted) return;
      if (e.code == GoogleSignIn.kSignInCanceledError) {
        return;
      }
      _showErrorSnackBar(_mapGooglePlatformError(e));
    } on ApiException catch (e) {
      if (!mounted) return;
      final msg = e.statusCode == 0
          ? 'Không thể kết nối đến máy chủ backend. Vui lòng kiểm tra kết nối.'
          : (e.message.isNotEmpty
              ? e.message
              : 'Lỗi xác thực (${e.statusCode}).');
      _showErrorSnackBar(msg);
    } catch (_) {
      if (!mounted) return;
      _showErrorSnackBar('Đăng nhập Google thất bại. Vui lòng thử lại sau.');
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _isGoogleSigningIn = false;
        });
      }
    }
  }

  String _mapGooglePlatformError(PlatformException e) {
    final details = '${e.code} ${e.message ?? ''}'.toLowerCase();
    if (e.code == GoogleSignIn.kNetworkError || details.contains('network')) {
      return 'Lỗi kết nối mạng khi đăng nhập Google. Vui lòng kiểm tra kết nối và thử lại.';
    }
    if (details.contains('10:') || details.contains('developer_error')) {
      return 'Lỗi cấu hình Google Sign-In (SHA-1 hoặc Client ID chưa khớp). Vui lòng kiểm tra lại cấu hình.';
    }
    if (e.code == GoogleSignIn.kSignInRequiredError) {
      return 'Phiên Google đã hết hạn. Vui lòng chọn lại tài khoản Google.';
    }
    return 'Không thể đăng nhập Google (${e.code}). Vui lòng thử lại hoặc sử dụng OTP.';
  }

  void _showErrorSnackBar(String message) {
    final c = context.tp;
    final messenger = ScaffoldMessenger.maybeOf(context);
    if (messenger == null) return;
    messenger
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(
            message,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
          backgroundColor: c.isDark ? const Color(0xFF9F1239) : AppTokens.rose,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          margin: const EdgeInsets.all(16),
          duration: const Duration(seconds: 4),
        ),
      );
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
              GoogleSignInButton(
                isLoading: _isGoogleSigningIn,
                isDisabled: _isLoading,
                onPressed: _handleGoogleSignIn,
              ),
              const SizedBox(height: 10),
              ElevatedButton.icon(
                onPressed:
                    _isLoading ? null : () => PasskeyDialog.show(context),
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
                  minHeight: 48,
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
              if (!_isOtpStep)
                LoginCredentialsSection(
                  identifierController: _identifierController,
                  passwordController: _passwordController,
                  usePasswordMode: _usePasswordMode,
                  obscurePassword: _obscurePassword,
                  isLoading: _isLoading,
                  showButtonSpinner: _isLoading && !_isGoogleSigningIn,
                  onTogglePasswordVisibility: () => setState(
                    () => _obscurePassword = !_obscurePassword,
                  ),
                  onSubmit: _proceedToOtpOrPassword,
                  onToggleMode: () => setState(() {
                    _usePasswordMode = !_usePasswordMode;
                    _errorMessage = null;
                  }),
                )
              else
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
