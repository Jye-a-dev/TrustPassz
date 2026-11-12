import 'package:flutter/material.dart';
import '../../models/user_model.dart';
import '../../theme/app_tokens.dart';

/// Modal 06: Read-only Google OAuth Account Status Dialog for Profile Settings.
class GoogleOAuthDialog extends StatelessWidget {
  final UserModel? currentUser;

  const GoogleOAuthDialog({
    super.key,
    this.currentUser,
  });

  static Future<void> show(
    BuildContext context, {
    UserModel? currentUser,
  }) {
    return showDialog<void>(
      context: context,
      builder: (_) => GoogleOAuthDialog(currentUser: currentUser),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = context.tp;
    final user = currentUser;
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
                  'Trạng thái Google OAuth',
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
              hasLinkedAccount
                  ? 'Tài khoản Google đã liên kết'
                  : 'Chưa liên kết tài khoản Google',
              style: TextStyle(
                color: c.textPrimary,
                fontSize: 15,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Ứng dụng chỉ nhận tên, email và ảnh đại diện công khai qua OpenID Connect.',
              style: TextStyle(color: c.textMuted, fontSize: 12),
            ),
            const SizedBox(height: 14),
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
                              : 'Google Sign-In Native',
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
                              : 'Đăng xuất và chọn "Tiếp tục với Google" trên màn hình đăng nhập để liên kết.',
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
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: () => Navigator.of(context).pop(),
              style: AppTokens.outlinedButtonStyle(c),
              child: Text(
                hasLinkedAccount ? 'Đã hiểu' : 'Đóng',
                style:
                    const TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
