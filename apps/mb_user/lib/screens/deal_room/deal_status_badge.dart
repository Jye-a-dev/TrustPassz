import 'package:flutter/material.dart';
import '../../models/deal_model.dart';

/// DealStatusBadge
/// Quản lý hiển thị badge trạng thái động (PENDING, DEPOSITED, IN_INSPECTION, SETTLED, REFUNDED, DISPUTED)
/// theo chuẩn Cyber-Escrow Dark Theme của TrustPassz.
class DealStatusBadge extends StatelessWidget {
  final DealState state;
  final bool showIcon;
  final bool useVietnamese;
  final double fontSize;

  const DealStatusBadge({
    super.key,
    required this.state,
    this.showIcon = true,
    this.useVietnamese = false,
    this.fontSize = 11,
  });

  Color _getBadgeColor() {
    switch (state) {
      case DealState.pending:
        return const Color(0xFFF59E0B); // Amber
      case DealState.deposited:
        return const Color(0xFF10B981); // Emerald
      case DealState.inInspection:
        return const Color(0xFF06B6D4); // Cyan
      case DealState.settled:
        return const Color(0xFF10B981); // Emerald
      case DealState.refunded:
        return const Color(0xFF94A3B8); // Slate
      case DealState.disputed:
        return const Color(0xFFF43F5E); // Rose
    }
  }

  IconData _getBadgeIcon() {
    switch (state) {
      case DealState.pending:
        return Icons.hourglass_top_rounded;
      case DealState.deposited:
        return Icons.lock_outline_rounded;
      case DealState.inInspection:
        return Icons.search_rounded;
      case DealState.settled:
        return Icons.check_circle_outline_rounded;
      case DealState.refunded:
        return Icons.replay_rounded;
      case DealState.disputed:
        return Icons.gavel_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    final baseColor = _getBadgeColor();
    final text = useVietnamese ? state.vietnameseLabel : state.label;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: baseColor.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: baseColor.withValues(alpha: 0.6)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (showIcon) ...[
            Icon(_getBadgeIcon(), size: fontSize + 2, color: baseColor),
            const SizedBox(width: 5),
          ],
          Text(
            text,
            style: TextStyle(
              color: baseColor,
              fontSize: fontSize,
              fontWeight: FontWeight.bold,
              fontFamily: useVietnamese ? null : 'monospace',
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}
