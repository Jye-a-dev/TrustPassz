import 'package:flutter/material.dart';
import '../../models/deal_model.dart';
import '../../theme/app_tokens.dart';
import '../../utils/formatters.dart';

class OrderHistoryCard extends StatelessWidget {
  final DealModel deal;
  final VoidCallback onOpenDetail;
  final VoidCallback onOpenCheckout;
  final VoidCallback onOpenVault;
  final VoidCallback onOpenDispute;

  const OrderHistoryCard({
    super.key,
    required this.deal,
    required this.onOpenDetail,
    required this.onOpenCheckout,
    required this.onOpenVault,
    required this.onOpenDispute,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.tp;
    final txLabel = deal.primaryTxHash != null
        ? 'Tx Base Sepolia: ${TrustPasszFormatters.shortTxHash(deal.primaryTxHash)}'
        : 'Base Sepolia • ${TrustPasszFormatters.formatDealCode(deal.id)}';

    final ({Color text, Color bg, Color border}) badgeColors = switch (deal.state) {
      DealState.pending => (
          text: c.amberText,
          bg: c.amberSoft,
          border: c.amberBorder
        ),
      DealState.inInspection => (
          text: c.cyanText,
          bg: c.cyanSoft,
          border: c.cyanBorder
        ),
      DealState.deposited || DealState.settled => (
          text: c.emeraldText,
          bg: c.emeraldSoft,
          border: c.emeraldBorder
        ),
      DealState.disputed => (
          text: c.roseText,
          bg: c.roseSoft,
          border: c.roseBorder
        ),
      DealState.refunded => (
          text: c.textMuted,
          bg: c.surfaceSubtle,
          border: c.borderStrong
        ),
    };

    String actionLabel = 'Chi Tiết';
    VoidCallback actionHandler = onOpenDetail;
    bool isPrimaryCta = false;

    if (deal.state == DealState.pending) {
      actionLabel = 'Thanh Toán QR';
      actionHandler = onOpenCheckout;
      isPrimaryCta = true;
    } else if (deal.state == DealState.deposited ||
        deal.state == DealState.inInspection) {
      actionLabel = 'Mở Két Số';
      actionHandler = onOpenVault;
      isPrimaryCta = true;
    } else if (deal.state == DealState.disputed) {
      actionLabel = 'Hồ Sơ';
      actionHandler = onOpenDispute;
    }

    return InkWell(
      onTap: onOpenDetail,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: AppTokens.cardDecoration(c, radius: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
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
                Text(
                  TrustPasszFormatters.formatTimestamp(
                    deal.updatedAt ?? deal.createdAt,
                  ),
                  style: AppTokens.monoStyle(
                    color: c.textMuted,
                    fontSize: 10.5,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              deal.title,
              style: TextStyle(
                color: c.textPrimary,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Text(
              TrustPasszFormatters.formatVnd(deal.amount),
              style: AppTokens.monoStyle(
                color: deal.state == DealState.disputed
                    ? c.roseText
                    : c.emeraldText,
                fontSize: 15,
              ),
            ),
            const SizedBox(height: 10),
            Divider(height: 1, color: c.border),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    txLabel,
                    style: AppTokens.monoStyle(
                      color: c.textMuted,
                      fontSize: 10,
                      fontWeight: FontWeight.w500,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                isPrimaryCta
                    ? ElevatedButton(
                        onPressed: actionHandler,
                        style: AppTokens.primaryButtonStyle(
                          c,
                          minHeight: 44,
                        ),
                        child: Text(
                          actionLabel,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      )
                    : OutlinedButton(
                        onPressed: actionHandler,
                        style: AppTokens.outlinedButtonStyle(c),
                        child: Text(
                          actionLabel,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
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
