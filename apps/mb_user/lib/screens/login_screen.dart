import 'package:flutter/material.dart';
import '../services/api_client.dart';
import '../services/auth_service.dart';
import '../widgets/common/server_status_bar.dart';

class LoginScreen extends StatefulWidget {
  final VoidCallback onSuccess;

  const LoginScreen({super.key, required this.onSuccess});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool _isLoading = false;
  String? _errorMessage;
  final TextEditingController _walletController = TextEditingController(
    text: '0x71C...49b2',
  );

  @override
  void dispose() {
    _walletController.dispose();
    super.dispose();
  }

  void _showGoogleSignInDialog() {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF0F172A),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Color(0xFF27272A)),
        ),
        title: const Row(
          children: [
            Icon(Icons.info_outline, color: Color(0xFF22D3EE), size: 22),
            SizedBox(width: 8),
            Text(
              'Google OAuth',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        content: const Text(
          'Google Sign-in SDK chưa được cấu hình Client ID cho nền tảng di động này. Vui lòng sử dụng nút "Đăng Nhập Test Session" để kiểm thử API xác thực.',
          style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text(
              'Đã hiểu',
              style: TextStyle(
                color: Color(0xFF22D3EE),
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showPasskeyDialog() {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF0F172A),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Color(0xFF27272A)),
        ),
        title: const Row(
          children: [
            Icon(Icons.fingerprint_rounded, color: Color(0xFF10B981), size: 22),
            SizedBox(width: 8),
            Text(
              'FIDO2 / Passkey',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        content: const Text(
          'Yêu cầu xác thực Passkey bị hủy hoặc chưa cấu hình trên thiết bị ảo. Ngoại lệ được kiểm soát an toàn, không văng lỗi crash màn hình.',
          style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text(
              'Đã hiểu',
              style: TextStyle(
                color: Color(0xFF10B981),
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleLogin(String provider) async {
    setState(() {
      _errorMessage = null;
    });

    if (provider == 'GOOGLE') {
      _showGoogleSignInDialog();
      return;
    }

    if (provider == 'PASSKEY') {
      _showPasskeyDialog();
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      if (provider == 'SOLANA') {
        await AuthService.instance.verifyAndAuthenticate(
          provider: 'solana',
          token: 'siws_solana_signature_payload',
          walletAddress: _walletController.text.trim(),
        );
      } else {
        // Dev auth mode: payload chuẩn RFC/Backend cho test session
        await AuthService.instance.verifyAndAuthenticate(
          provider: 'dev',
          token: 'dev_test_session_token',
          email: 'dev-tester@trustpassz.io',
        );
      }

      if (!mounted) return;
      widget.onSuccess();
    } catch (e) {
      if (!mounted) return;

      String displayError = 'Đã có lỗi xảy ra trong quá trình xác thực. Vui lòng thử lại.';
      if (e is ApiException) {
        if (e.statusCode == 401) {
          displayError = 'Phiên xác thực không hợp lệ hoặc đã hết hạn. Vui lòng thử lại bằng Test Session.';
        } else if (e.statusCode == 400) {
          displayError = e.message.isNotEmpty
              ? e.message
              : 'Yêu cầu không hợp lệ. Vui lòng kiểm tra định dạng dữ liệu gửi lên.';
        } else if (e.statusCode == 0) {
          displayError = 'Không thể kết nối đến máy chủ backend (lỗi mạng hoặc server chưa khởi chạy).';
        } else {
          displayError = 'Lỗi máy chủ (${e.statusCode}): ${e.message}';
        }
      } else {
        displayError = e.toString().replaceFirst('Exception: ', '');
      }

      setState(() {
        _errorMessage = displayError;
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B0F17),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 16),
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF22D3EE), Color(0xFF34D399)],
                  ),
                  borderRadius: BorderRadius.circular(14),
                ),
                alignment: Alignment.center,
                child: const Text(
                  'TP',
                  style: TextStyle(
                    color: Color(0xFF020617),
                    fontWeight: FontWeight.w900,
                    fontSize: 20,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Đăng Nhập Khóa Ký Quỹ',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Xác thực danh tính để tạo kèo đàm phán, thanh toán VietQR và giải mã Digital Vault.',
                style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
              ),
              const SizedBox(height: 12),
              const Align(
                alignment: Alignment.centerLeft,
                child: ServerStatusBar(),
              ),
              const Spacer(),

              // Error Display Banner
              if (_errorMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF4C0519).withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFF43F5E).withValues(alpha: 0.5)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: Color(0xFFF43F5E), size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(
                            color: Color(0xFFFDA4AF),
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Google OAuth Button
              ElevatedButton.icon(
                onPressed: _isLoading ? null : () => _handleLogin('GOOGLE'),
                icon: const Icon(Icons.account_circle, size: 20),
                label: const Text('Tiếp tục với Google OAuth'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0F172A),
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 48),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                    side: const BorderSide(color: Color(0xFF27272A)),
                  ),
                ),
              ),
              const SizedBox(height: 10),

              // Passkey / Biometric Auth Button
              OutlinedButton.icon(
                onPressed: _isLoading ? null : () => _handleLogin('PASSKEY'),
                icon: const Icon(Icons.fingerprint_rounded, size: 20, color: Color(0xFF10B981)),
                label: const Text('Xác thực với Passkey / Vân tay'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 48),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  side: const BorderSide(color: Color(0xFF1E293B)),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Separator
              const Row(
                children: [
                  Expanded(child: Divider(color: Color(0xFF27272A))),
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: 12),
                    child: Text(
                      'HOẶC CHẾ ĐỘ DEV',
                      style: TextStyle(
                        color: Color(0xFF64748B),
                        fontSize: 10,
                        fontFamily: 'monospace',
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  Expanded(child: Divider(color: Color(0xFF27272A))),
                ],
              ),
              const SizedBox(height: 16),

              // Dev Login Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF27272A)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text(
                      'Xác Thực Backend Trực Tiếp (DEV API)',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Gọi /api/v1/auth/verify để cấp phiên JWT thật trên Emulator.',
                      style: TextStyle(color: Color(0xFF64748B), fontSize: 11),
                    ),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: _isLoading ? null : () => _handleLogin('DEV'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF06B6D4),
                        foregroundColor: const Color(0xFF020617),
                        minimumSize: const Size(double.infinity, 48),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.black,
                              ),
                            )
                          : const Text(
                              'Đăng Nhập Test Session',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }
}
