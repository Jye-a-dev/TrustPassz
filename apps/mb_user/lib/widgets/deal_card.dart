import 'package:flutter/material.dart';
import '../models/deal_model.dart';
import '../theme/app_tokens.dart';
import '../utils/formatters.dart';

class DealCard extends StatelessWidget {
  final DealModel deal;
  final ValueChanged<DealModel> onSelect;

  const DealCard({
    super.key,
    required this.deal,
    required this.onSelect,
  });

  ({Color text, Color bg, Color border}) _stateColors(
    AppColorPalette c,
    DealState state,
  ) {
    switch (state) {
      case DealState.pending:
        return (text: c.amberText, bg: c.amberSoft, border: c.amberBorder);
      case DealState.deposited:
      case DealState.inInspection:
        return (text: c.emeraldText, bg: c.emeraldSoft, border: c.emeraldBorder);
      case DealState.settled:
        return (text: c.cyanText, bg: c.cyanSoft, border: c.cyanBorder);
      case DealState.refunded:
        return (text: c.textMuted, bg: c.surfaceSubtle, border: c.borderStrong);
      case DealState.disputed:
        return (text: c.roseText, bg: c.roseSoft, border: c.roseBorder);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.tp;
    final badgeColors = _stateColors(c, deal.state);

    return InkWell(
      onTap: () => onSelect(deal),
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: AppTokens.cardDecoration(c, radius: 18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    deal.title,
                    style: TextStyle(
                      color: c.textPrimary,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: badgeColors.bg,
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: badgeColors.border),
                  ),
                  child: Text(
                    deal.state.vietnameseLabel,
                    style: AppTokens.monoStyle(
                      color: badgeColors.text,
                      fontSize: 10,
                    ),
                  ),
                ),
              ],
            ),
            if (deal.description != null && deal.description!.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                deal.description!,
                style: TextStyle(color: c.textMuted, fontSize: 12),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  TrustPasszFormatters.formatVnd(deal.amount),
                  style: AppTokens.monoStyle(
                    color: c.cyanText,
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                Text(
                  'Đồng kiểm: ${deal.inspectionDuration ~/ 3600}h',
                  style: AppTokens.monoStyle(
                    color: c.textMuted,
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
