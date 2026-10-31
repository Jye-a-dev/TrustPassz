import 'package:flutter/material.dart';
import '../../models/user_model.dart';

class HomeAppBar extends StatelessWidget implements PreferredSizeWidget {
  final UserModel? user;
  final bool isRefreshing;
  final VoidCallback onRefresh;
  final VoidCallback onNotificationsTap;
  final VoidCallback onLogout;

  const HomeAppBar({
    super.key,
    required this.user,
    required this.isRefreshing,
    required this.onRefresh,
    required this.onNotificationsTap,
    required this.onLogout,
  });

  @override
  Size get preferredSize => const Size.fromHeight(72);

  String _formatAddress(String? address) {
    if (address == null || address.length < 10) return '0xTRP...Vault';
    return '${address.substring(0, 6)}...${address.substring(address.length - 4)}';
  }

  @override
  Widget build(BuildContext context) {
    final displayName = user?.displayName.isNotEmpty == true
        ? user!.displayName
        : 'Người dùng TrustPassz';
    final initial = displayName.isNotEmpty ? displayName[0].toUpperCase() : 'T';

    return Container(
      color: const Color(0xFF080C14),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: SafeArea(
        bottom: false,
        child: Row(
          children: [
            // User Avatar with Emerald Active Node
            Stack(
              clipBehavior: Clip.none,
              children: [
                CircleAvatar(
                  radius: 22,
                  backgroundColor: const Color(0xFF1E293B),
                  backgroundImage: user?.avatarUrl != null
                      ? NetworkImage(user!.avatarUrl!)
                      : null,
                  child: user?.avatarUrl == null
                      ? Text(
                          initial,
                          style: const TextStyle(
                            color: Color(0xFF22D3EE),
                            fontWeight: FontWeight.bold,
                            fontSize: 18,
                          ),
                        )
                      : null,
                ),
                Positioned(
                  bottom: -1,
                  right: -1,
                  child: Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: const Color(0xFF080C14),
                        width: 2,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 12),

            // User Info & Node Details
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    displayName,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      letterSpacing: -0.2,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0F172A),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: const Color(0xFF1E293B)),
                        ),
                        child: Text(
                          _formatAddress(user?.walletAddress),
                          style: const TextStyle(
                            color: Color(0xFF06B6D4),
                            fontSize: 10,
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      const Text(
                        'Escrow Node',
                        style: TextStyle(
                          color: Color(0xFF64748B),
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Notification Bell with >= 48x48 Touch Target
            SizedBox(
              width: 48,
              height: 48,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  IconButton(
                    onPressed: onNotificationsTap,
                    icon: const Icon(
                      Icons.notifications_none_rounded,
                      color: Color(0xFF94A3B8),
                      size: 24,
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 48,
                      minHeight: 48,
                    ),
                    tooltip: 'Thông báo',
                  ),
                  Positioned(
                    top: 10,
                    right: 10,
                    child: Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: Color(0xFFF43F5E),
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Refresh Button with >= 48x48 Touch Target
            SizedBox(
              width: 48,
              height: 48,
              child: IconButton(
                onPressed: isRefreshing ? null : onRefresh,
                icon: isRefreshing
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Color(0xFF22D3EE),
                        ),
                      )
                    : const Icon(
                        Icons.refresh_rounded,
                        color: Color(0xFF22D3EE),
                        size: 22,
                      ),
                constraints: const BoxConstraints(
                  minWidth: 48,
                  minHeight: 48,
                ),
                tooltip: 'Làm mới',
              ),
            ),

            // Logout Button with >= 48x48 Touch Target
            SizedBox(
              width: 48,
              height: 48,
              child: IconButton(
                onPressed: onLogout,
                icon: const Icon(
                  Icons.logout_rounded,
                  color: Color(0xFF64748B),
                  size: 20,
                ),
                constraints: const BoxConstraints(
                  minWidth: 48,
                  minHeight: 48,
                ),
                tooltip: 'Đăng xuất',
              ),
            ),
          ],
        ),
      ),
    );
  }
}
