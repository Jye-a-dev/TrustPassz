import 'package:flutter/material.dart';
import '../../models/deal_model.dart';
import '../../theme/app_tokens.dart';
import '../../utils/formatters.dart';

class TransactionItem extends StatelessWidget {
  final DealModel deal;
  final ValueChanged<DealModel> onSelect;

  const TransactionItem({
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
        return (text: c.emeraldText, bg: c.emeraldSoft, border: c.emeraldBorder);
      case DealState.inInspection:
        return (text: c.cyanText, bg: c.cyanSoft, border: c.cyanBorder);
      case DealState.settled:
        return (text: c.emeraldText, bg: c.emeraldSoft, border: c.emeraldBorder);
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
    final timestampText =
        TrustPasszFormatters.formatTimestamp(deal.updatedAt ?? deal.createdAt);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => onSelect(deal),
        borderRadius: BorderRadius.circular(18),
        child: Ink(
          decoration: BoxDecoration(
            color: c.surface,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: c.border, width: 1.0),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: badgeColors.bg,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: badgeColors.border,
                              width: 1.0,
                            ),
                          ),
                          child: Text(
                            deal.state.vietnameseLabel,
                            style: AppTokens.monoStyle(
                              color: badgeColors.text,
                              fontSize: 10,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          TrustPasszFormatters.formatDealCode(deal.id),
                          style: AppTokens.monoStyle(
                            color: c.textMuted,
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const Spacer(),
                        Text(
                          timestampText,
                          style: TextStyle(color: c.textMuted, fontSize: 10.5),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      deal.title,
                      style: TextStyle(
                        color: c.textPrimary,
                        fontSize: 13.5,
                        fontWeight: FontWeight.w700,
                        height: 1.3,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          TrustPasszFormatters.formatVnd(deal.amount),
                          style: AppTokens.monoStyle(
                            color: c.emeraldText,
                            fontSize: 14.5,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        Row(
                          children: [
                            Icon(
                              Icons.timer_outlined,
                              size: 12,
                              color: c.textMuted,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              'Đồng kiểm: ${deal.inspectionDuration ~/ 3600}h',
                              style: AppTokens.monoStyle(
                                color: c.textMuted,
                                fontSize: 10.5,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Icon(Icons.chevron_right_rounded, color: c.textMuted, size: 18),
            ],
          ),
        ),
      ),
    );
  }
}
