import 'package:flutter/material.dart';
import '../../models/user_model.dart';
import '../../theme/app_tokens.dart';

class HomeAppBar extends StatelessWidget implements PreferredSizeWidget {
  final UserModel? user;
  final bool isRefreshing;
  final VoidCallback onRefresh;
  final VoidCallback onNotificationsTap;
  final VoidCallback? onProfileTap;

  const HomeAppBar({
    super.key,
    required this.user,
    required this.isRefreshing,
    required this.onRefresh,
    required this.onNotificationsTap,
    this.onProfileTap,
    required VoidCallback onLogout,
  });

  @override
  Size get preferredSize => const Size.fromHeight(72);

  String _initials(String name) {
    final parts =
        name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return 'TP';
    if (parts.length == 1) return parts.first[0].toUpperCase();
    return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.tp;
    final displayName = user?.displayName.isNotEmpty == true
        ? user!.displayName
        : 'Thành viên TrustPassz';
    final initials = _initials(displayName);

    return Container(
      color: c.canvas,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: SafeArea(
        bottom: false,
        child: Row(
          children: [
            // Avatar with active node status dot
            GestureDetector(
              onTap: onProfileTap,
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppTokens.cyan, AppTokens.emerald],
                        begin: Alignment.bottomLeft,
                        end: Alignment.topRight,
                      ),
                      shape: BoxShape.circle,
                      border: Border.all(color: c.borderStrong, width: 1.5),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      initials,
                      style: const TextStyle(
                        color: Color(0xFF020617),
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        color: AppTokens.emerald,
                        shape: BoxShape.circle,
                        border: Border.all(color: c.canvas, width: 2),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),

            // User Info & eKYC Reputation
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          displayName,
                          style: TextStyle(
                            color: c.textPrimary,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            letterSpacing: -0.2,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        width: 6,
                        height: 6,
                        decoration: const BoxDecoration(
                          color: AppTokens.emerald,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'eKYC Cấp 3 • Uy Tín 99.8%',
                    style: AppTokens.monoStyle(
                      color: c.emeraldText,
                      fontSize: 10.5,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),

            // Refresh Button (>= 44x44 with border)
            SizedBox(
              width: 44,
              height: 44,
              child: OutlinedButton(
                onPressed: isRefreshing ? null : onRefresh,
                style: OutlinedButton.styleFrom(
                  padding: EdgeInsets.zero,
                  minimumSize: const Size(44, 44),
                  backgroundColor: c.surface,
                  side: BorderSide(color: c.border, width: 1.0),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: isRefreshing
                    ? SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: c.cyanText,
                        ),
                      )
                    : Icon(
                        Icons.refresh_rounded,
                        color: c.textSecondary,
                        size: 20,
                      ),
              ),
            ),
            const SizedBox(width: 8),

            // Notification Bell (>= 44x44 with border)
            SizedBox(
              width: 44,
              height: 44,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  OutlinedButton(
                    onPressed: onNotificationsTap,
                    style: OutlinedButton.styleFrom(
                      padding: EdgeInsets.zero,
                      minimumSize: const Size(44, 44),
                      backgroundColor: c.surface,
                      side: BorderSide(color: c.border, width: 1.0),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Icon(
                      Icons.notifications_none_rounded,
                      color: c.textSecondary,
                      size: 20,
                    ),
                  ),
                  Positioned(
                    top: 10,
                    right: 10,
                    child: Container(
                      width: 7,
                      height: 7,
                      decoration: const BoxDecoration(
                        color: AppTokens.emerald,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
