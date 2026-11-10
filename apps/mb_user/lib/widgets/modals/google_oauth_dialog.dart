import 'package:flutter/material.dart';
import '../../models/user_model.dart';
import '../../theme/app_tokens.dart';

/// Modal 06: Google OAuth Identity Dialog matching V2 design.
class GoogleOAuthDialog extends StatefulWidget {
  final UserModel? currentUser;
  final ValueChanged<String>? onSubmitIdToken;

  const GoogleOAuthDialog({
    super.key,
    this.currentUser,
    this.onSubmitIdToken,
  });

  static Future<void> show(
    BuildContext context, {
    UserModel? currentUser,
    ValueChanged<String>? onSubmitIdToken,
  }) {
    return showDialog<void>(
      context: context,
      builder: (_) => GoogleOAuthDialog(
        currentUser: currentUser,
        onSubmitIdToken: onSubmitIdToken,
      ),
    );
  }

  @override
  State<GoogleOAuthDialog> createState() => _GoogleOAuthDialogState();
}

class _GoogleOAuthDialogState extends State<GoogleOAuthDialog> {
  final TextEditingController _idTokenController = TextEditingController();
  bool _showManualToken = false;

  @override
  void dispose() {
    _idTokenController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.tp;
    final user = widget.currentUser;
    final hasLinkedAccount = user?.email != null && user!.email!.isNotEmpty;
    final initials = hasLinkedAccount
        ? user.displayName
            .trim()
            .split(' ')
            .where((w) => w.isNotEmpty)
            .take(2)
            .map((w) => w[0].toUpperCase())
            .join()
        : 'G';

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
            Row(
              children: [
                Container(
                  width: 30,
                  height: 30,
                  decoration: BoxDecoration(
                    color: c.surfaceSubtle,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: c.border),
                  ),
                  alignment: Alignment.center,
                  child: const Text(
                    'G',
                    style: TextStyle(
                      color: AppTokens.googleBlue,
                      fontWeight: FontWeight.w900,
                      fontSize: 16,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  'Đăng nhập bằng Google',
                  style: TextStyle(
                    color: c.textSecondary,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Divider(height: 1, color: c.border),
            const SizedBox(height: 14),
            Text(
              'Chọn tài khoản tiếp tục với TrustPassz',
              style: TextStyle(
                color: c.textPrimary,
                fontSize: 15,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Ứng dụng sẽ chỉ nhận tên, email và ảnh đại diện công khai qua OpenID Connect.',
              style: TextStyle(color: c.textMuted, fontSize: 12),
            ),
            const SizedBox(height: 14),

            // Account status / Google Client info card
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: c.canvas,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: c.border),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: AppTokens.googleBlue,
                    child: Text(
                      initials.isEmpty ? 'G' : initials,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          hasLinkedAccount
                              ? user.displayName
                              : 'Google Sign-In SDK',
                          style: TextStyle(
                            color: c.textPrimary,
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          hasLinkedAccount
                              ? user.email!
                              : 'Chưa cấu hình Google Client ID cho thiết bị này. Vui lòng nhập ID Token hợp lệ hoặc đăng nhập qua OTP/Mật khẩu.',
                          style: TextStyle(color: c.textMuted, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  if (hasLinkedAccount)
                    const Icon(
                      Icons.check_circle_rounded,
                      color: AppTokens.emerald,
                      size: 18,
                    ),
                ],
              ),
            ),

            if (widget.onSubmitIdToken != null) ...[
              const SizedBox(height: 10),
              if (!_showManualToken)
                Align(
                  alignment: Alignment.centerLeft,
                  child: TextButton(
                    onPressed: () => setState(() => _showManualToken = true),
                    style: TextButton.styleFrom(
                      side: BorderSide(color: c.border),
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                    ),
                    child: Text(
                      'Nhập Google OAuth ID Token',
                      style: TextStyle(color: c.cyanText, fontSize: 12),
                    ),
                  ),
                )
              else ...[
                TextField(
                  controller: _idTokenController,
                  style: AppTokens.monoStyle(
                    color: c.textPrimary,
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 2,
                  decoration: const InputDecoration(
                    hintText: 'Dán Google ID Token (JWT 3 đoạn)...',
                  ),
                ),
              ],
            ],

            const SizedBox(height: 16),
            if (_showManualToken && widget.onSubmitIdToken != null) ...[
              ElevatedButton(
                onPressed: () {
                  final token = _idTokenController.text.trim();
                  if (token.isEmpty) return;
                  Navigator.of(context).pop();
                  widget.onSubmitIdToken!(token);
                },
                style: AppTokens.primaryButtonStyle(
                  c,
                  backgroundColor: AppTokens.googleBlue,
                  foregroundColor: Colors.white,
                  borderColor: const Color(0xFF1D4ED8),
                ),
                child: const Text(
                  'Xác Thực Google ID Token',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
              ),
              const SizedBox(height: 8),
            ],
            OutlinedButton(
              onPressed: () => Navigator.of(context).pop(),
              style: AppTokens.outlinedButtonStyle(c),
              child: Text(
                hasLinkedAccount ? 'Đã hiểu' : 'Đóng',
                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
