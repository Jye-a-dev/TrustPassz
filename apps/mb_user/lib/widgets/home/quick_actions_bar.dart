import 'package:flutter/material.dart';

class QuickActionsBar extends StatelessWidget {
  final VoidCallback onCreateDeal;
  final VoidCallback onScanQr;
  final VoidCallback onOpenVault;

  const QuickActionsBar({
    super.key,
    required this.onCreateDeal,
    required this.onScanQr,
    required this.onOpenVault,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return Row(
          children: [
            Expanded(
              child: _QuickActionButton(
                label: 'Tạo Kèo Mới',
                subtitle: 'Ký quỹ tức thì',
                icon: Icons.add_circle_outline_rounded,
                accentColor: const Color(0xFF10B981),
                onTap: onCreateDeal,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _QuickActionButton(
                label: 'Quét VietQR',
                subtitle: 'Thanh toán bảo lưu',
                icon: Icons.qr_code_scanner_rounded,
                accentColor: const Color(0xFF06B6D4),
                onTap: onScanQr,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _QuickActionButton(
                label: 'Mở Két Số',
                subtitle: 'Digital Vault',
                icon: Icons.lock_open_rounded,
                accentColor: const Color(0xFFF59E0B),
                onTap: onOpenVault,
              ),
            ),
          ],
        );
      },
    );
  }
}

class _QuickActionButton extends StatelessWidget {
  final String label;
  final String subtitle;
  final IconData icon;
  final Color accentColor;
  final VoidCallback onTap;

  const _QuickActionButton({
    required this.label,
    required this.subtitle,
    required this.icon,
    required this.accentColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          decoration: BoxDecoration(
            color: const Color(0xFF0F172A),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF1E293B)),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 68),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: accentColor.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: accentColor.withValues(alpha: 0.25),
                    ),
                  ),
                  child: Icon(icon, color: accentColor, size: 20),
                ),
                const SizedBox(height: 8),
                Text(
                  label,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 9,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
