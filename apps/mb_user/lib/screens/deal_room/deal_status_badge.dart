import 'package:flutter/material.dart';
import '../../models/deal_model.dart';
import '../../theme/app_tokens.dart';

/// DealStatusBadge supporting Light & Dark semantic styling.
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

  ({Color text, Color bg, Color border}) _colors(AppColorPalette c) {
    switch (state) {
      case DealState.pending:
        return (text: c.amberText, bg: c.amberSoft, border: c.amberBorder);
      case DealState.deposited:
      case DealState.settled:
        return (text: c.emeraldText, bg: c.emeraldSoft, border: c.emeraldBorder);
      case DealState.inInspection:
        return (text: c.cyanText, bg: c.cyanSoft, border: c.cyanBorder);
      case DealState.refunded:
        return (text: c.textMuted, bg: c.surfaceSubtle, border: c.borderStrong);
      case DealState.disputed:
        return (text: c.roseText, bg: c.roseSoft, border: c.roseBorder);
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
    final c = context.tp;
    final palette = _colors(c);
    final text = useVietnamese ? state.vietnameseLabel : state.label;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: palette.bg,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: palette.border, width: 1.0),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (showIcon) ...[
            Icon(_getBadgeIcon(), size: fontSize + 2, color: palette.text),
            const SizedBox(width: 5),
          ],
          Text(
            text,
            style: TextStyle(
              color: palette.text,
              fontSize: fontSize,
              fontWeight: FontWeight.bold,
              fontFamily: useVietnamese ? null : 'monospace',
              letterSpacing: 0.4,
            ),
          ),
        ],
      ),
    );
  }
}
