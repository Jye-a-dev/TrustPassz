import 'package:flutter/material.dart';
import '../../models/deal_model.dart';
import '../../theme/app_tokens.dart';
import '../../utils/formatters.dart';

class DealSummaryCard extends StatelessWidget {
  final DealModel deal;

  const DealSummaryCard({super.key, required this.deal});

  @override
  Widget build(BuildContext context) {
    final c = context.tp;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: AppTokens.cardDecoration(
        c,
        radius: 22,
        backgroundColor: c.surfaceSubtle,
      ),
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
                    fontSize: 14.5,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                TrustPasszFormatters.formatVnd(deal.amount),
                style: AppTokens.monoStyle(
                  color: c.emeraldText,
                  fontSize: 14.5,
                ),
              ),
            ],
          ),
          if (deal.description != null && deal.description!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              deal.description!,
              style: TextStyle(
                color: c.textMuted,
                fontSize: 12,
                height: 1.4,
              ),
            ),
          ],
          const SizedBox(height: 10),
          Row(
            children: [
              Text(
                'Thời hạn kiểm: ${deal.inspectionDuration ~/ 3600} Giờ',
                style: AppTokens.monoStyle(
                  color: c.textSecondary,
                  fontSize: 11,
                ),
              ),
              const SizedBox(width: 14),
              Text(
                'Bảo vệ: AI Trọng Tài',
                style: AppTokens.monoStyle(color: c.cyanText, fontSize: 11),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
