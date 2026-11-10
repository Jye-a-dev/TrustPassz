import 'package:flutter/material.dart';
import '../../models/user_model.dart';
import '../../theme/app_tokens.dart';

class ProfileSummaryCard extends StatelessWidget {
  final UserModel? user;

  const ProfileSummaryCard({super.key, required this.user});

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
    final name = user?.displayName.isNotEmpty == true
        ? user!.displayName
        : 'Thành viên TrustPassz';
    final contact = user?.email ?? user?.walletAddress ?? 'Tài khoản eKYC';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: AppTokens.cardDecoration(c, radius: 22),
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [AppTokens.cyan, AppTokens.emerald],
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: c.borderStrong, width: 1.5),
            ),
            alignment: Alignment.center,
            child: Text(
              _initials(name),
              style: const TextStyle(
                color: Color(0xFF020617),
                fontWeight: FontWeight.w900,
                fontSize: 18,
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        name,
                        style: TextStyle(
                          color: c.textPrimary,
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Text(
                      'Trust Score: 99.8%',
                      style: AppTokens.monoStyle(
                        color: c.emeraldText,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 3),
                Text(
                  contact,
                  style: TextStyle(color: c.textMuted, fontSize: 12),
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 3),
                Text(
                  'eKYC Cấp 3 • Bảo vệ Smart Contract Base Sepolia',
                  style: AppTokens.monoStyle(
                    color: c.textMuted,
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
