import 'package:flutter/material.dart';
import '../../models/deal_model.dart';
import '../../theme/app_tokens.dart';

/// DealAuditTimeline V2: 4-step horizontal grid (Khởi tạo -> Ký quỹ -> Đồng kiểm -> Giải ngân).
class DealAuditTimeline extends StatelessWidget {
  final DealModel deal;

  const DealAuditTimeline({
    super.key,
    required this.deal,
  });

  bool _isStepCompleted(int stepIndex) {
    switch (stepIndex) {
      case 0:
        return true;
      case 1:
        return deal.state != DealState.pending;
      case 2:
        return deal.state == DealState.settled ||
            deal.state == DealState.refunded;
      case 3:
        return deal.state == DealState.settled ||
            deal.state == DealState.refunded;
      default:
        return false;
    }
  }

  bool _isStepActive(int stepIndex) {
    switch (stepIndex) {
      case 0:
        return deal.state == DealState.pending;
      case 1:
        return deal.state == DealState.deposited;
      case 2:
        return deal.state == DealState.inInspection ||
            deal.state == DealState.disputed;
      case 3:
        return deal.state == DealState.settled ||
            deal.state == DealState.refunded;
      default:
        return false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.tp;
    final inspectionHours = deal.inspectionDuration ~/ 3600;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: AppTokens.cardDecoration(c, radius: 22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'TIẾN TRÌNH HỢP ĐỒNG KÝ QUỸ',
                style: AppTokens.monoStyle(
                  color: c.textMuted,
                  fontSize: 10.5,
                  letterSpacing: 0.6,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: c.cyanSoft,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: c.cyanBorder),
                ),
                child: Text(
                  'Hạn kiểm: ${inspectionHours}h',
                  style: AppTokens.monoStyle(color: c.cyanText, fontSize: 10),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // 4-Column Horizontal Stepper Grid
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: _buildStep(c, 0, 'Khởi tạo')),
              Expanded(child: _buildStep(c, 1, 'Ký quỹ')),
              Expanded(
                child: _buildStep(
                  c,
                  2,
                  deal.state == DealState.disputed ? 'Tranh chấp' : 'Đồng kiểm',
                ),
              ),
              Expanded(child: _buildStep(c, 3, 'Giải ngân')),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStep(AppColorPalette c, int index, String label) {
    final done = _isStepCompleted(index);
    final active = _isStepActive(index);
    final isDisputed = index == 2 && deal.state == DealState.disputed;

    Color circleBg;
    Color circleBorder;
    Color textColor;
    Widget inner;

    if (isDisputed) {
      circleBg = AppTokens.rose;
      circleBorder = c.roseBorder;
      textColor = c.roseText;
      inner = const Text(
        '!',
        style: TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w900,
          fontSize: 13,
        ),
      );
    } else if (done) {
      circleBg = AppTokens.emerald;
      circleBorder = c.emeraldBorder;
      textColor = c.emeraldText;
      inner = const Icon(Icons.check_rounded, size: 16, color: Color(0xFF020617));
    } else if (active) {
      circleBg = AppTokens.cyan;
      circleBorder = c.cyanBorder;
      textColor = c.cyanText;
      inner = Text(
        '${index + 1}',
        style: const TextStyle(
          color: Color(0xFF020617),
          fontWeight: FontWeight.w900,
          fontSize: 12,
        ),
      );
    } else {
      circleBg = c.surfaceSubtle;
      circleBorder = c.borderStrong;
      textColor = c.textMuted;
      inner = Text(
        '${index + 1}',
        style: TextStyle(
          color: c.textMuted,
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
      );
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            color: circleBg,
            shape: BoxShape.circle,
            border: Border.all(color: circleBorder, width: 1.5),
          ),
          alignment: Alignment.center,
          child: inner,
        ),
        const SizedBox(height: 6),
        Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: textColor,
            fontSize: 10.5,
            fontWeight: (done || active) ? FontWeight.bold : FontWeight.w500,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }
}
