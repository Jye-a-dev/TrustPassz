import 'package:flutter/material.dart';
import '../../theme/app_tokens.dart';

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
    final c = context.tp;

    return Row(
      children: [
        Expanded(
          child: _QuickActionButton(
            label: 'Quét VietQR',
            subtitle: 'Thanh toán nhanh',
            icon: Icons.qr_code_scanner_rounded,
            iconBg: c.cyanSoft,
            iconBorder: c.cyanBorder,
            accentColor: c.cyanText,
            onTap: onScanQr,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _QuickActionButton(
            label: 'Tạo Giao Dịch Mới',
            subtitle: 'Ký quỹ tức thì',
            icon: Icons.edit_note_rounded,
            iconBg: c.emeraldSoft,
            iconBorder: c.emeraldBorder,
            accentColor: c.emeraldText,
            onTap: onCreateDeal,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _QuickActionButton(
            label: 'Mở Két Số',
            subtitle: 'Digital Vault',
            icon: Icons.lock_open_rounded,
            iconBg: c.amberSoft,
            iconBorder: c.amberBorder,
            accentColor: c.amberText,
            onTap: onOpenVault,
          ),
        ),
      ],
    );
  }
}

class _QuickActionButton extends StatelessWidget {
  final String label;
  final String subtitle;
  final IconData icon;
  final Color iconBg;
  final Color iconBorder;
  final Color accentColor;
  final VoidCallback onTap;

  const _QuickActionButton({
    required this.label,
    required this.subtitle,
    required this.icon,
    required this.iconBg,
    required this.iconBorder,
    required this.accentColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.tp;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Ink(
          decoration: BoxDecoration(
            color: c.surface,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: c.border, width: 1.0),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 74),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 34,
                  height: 34,
                  decoration: BoxDecoration(
                    color: iconBg,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: iconBorder, width: 1.0),
                  ),
                  child: Icon(icon, color: accentColor, size: 18),
                ),
                const SizedBox(height: 8),
                Text(
                  label,
                  style: TextStyle(
                    color: c.textPrimary,
                    fontSize: 11.5,
                    fontWeight: FontWeight.w700,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: TextStyle(color: c.textMuted, fontSize: 9.5),
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
