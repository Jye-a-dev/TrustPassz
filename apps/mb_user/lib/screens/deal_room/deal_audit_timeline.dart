import 'package:flutter/material.dart';
import '../../models/deal_model.dart';

/// DealAuditTimeline
/// Khối render lịch sử giao dịch và mốc thời gian inspection window đếm ngược.
class DealAuditTimeline extends StatelessWidget {
  final DealModel deal;

  const DealAuditTimeline({
    super.key,
    required this.deal,
  });

  bool _isStepCompleted(int stepIndex) {
    switch (stepIndex) {
      case 0:
        return true; // Deal đã khởi tạo
      case 1:
        return deal.state != DealState.pending;
      case 2:
        return deal.state == DealState.inInspection ||
            deal.state == DealState.settled ||
            deal.state == DealState.disputed;
      case 3:
        return deal.state == DealState.settled ||
            deal.state == DealState.refunded ||
            deal.state == DealState.disputed;
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
        return deal.state == DealState.inInspection;
      case 3:
        return deal.state == DealState.settled ||
            deal.state == DealState.refunded ||
            deal.state == DealState.disputed;
      default:
        return false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final inspectionHours = deal.inspectionDuration ~/ 3600;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.history_toggle_off, size: 16, color: Color(0xFF22D3EE)),
                  SizedBox(width: 8),
                  Text(
                    'TIẾN TRÌNH & ĐỒNG KIỂM',
                    style: TextStyle(
                      color: Color(0xFF94A3B8),
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.8,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFF164E63).withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  'Hạn kiểm định: $inspectionHours Giờ',
                  style: const TextStyle(
                    color: Color(0xFF22D3EE),
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'monospace',
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Timeline Step List
          _buildTimelineItem(
            index: 0,
            title: 'Khởi tạo Deal & Thỏa thuận giá',
            subtitle: 'Thỏa thuận giá niêm yết qua Bargain Slider',
            isLast: false,
          ),
          _buildTimelineItem(
            index: 1,
            title: 'Ký quỹ Escrow (Napas 247)',
            subtitle: 'Tiền buyer được khóa an toàn trên Smart Contract',
            isLast: false,
          ),
          _buildTimelineItem(
            index: 2,
            title: 'Mở Két Số & Thời hạn Đồng kiểm',
            subtitle: 'Kiểm thử license key/source code trong $inspectionHours giờ',
            isLast: false,
          ),
          _buildTimelineItem(
            index: 3,
            title: 'Tất toán / Phân xử Trọng tài AI',
            subtitle: deal.state == DealState.disputed
                ? 'Đang tiếp nhận phân xử tranh chấp'
                : 'Giải ngân thanh toán trực tiếp cho seller',
            isLast: true,
          ),
        ],
      ),
    );
  }

  Widget _buildTimelineItem({
    required int index,
    required String title,
    required String subtitle,
    required bool isLast,
  }) {
    final isDone = _isStepCompleted(index);
    final isActive = _isStepActive(index);

    final dotColor = isDone
        ? const Color(0xFF10B981)
        : (isActive ? const Color(0xFF06B6D4) : const Color(0xFF334155));

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Step Dot and Connector Line
          SizedBox(
            width: 24,
            child: Column(
              children: [
                Container(
                  width: 14,
                  height: 14,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: dotColor,
                    border: Border.all(
                      color: isActive
                          ? Colors.white
                          : dotColor.withValues(alpha: 0.5),
                      width: isActive ? 2 : 1,
                    ),
                  ),
                  child: isDone
                      ? const Icon(Icons.check, size: 9, color: Colors.black)
                      : null,
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      color: isDone
                          ? const Color(0xFF10B981).withValues(alpha: 0.5)
                          : const Color(0xFF1E293B),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 8),

          // Content
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      color: isDone || isActive
                          ? Colors.white
                          : const Color(0xFF64748B),
                      fontSize: 13,
                      fontWeight:
                          isActive ? FontWeight.bold : FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      color: isDone || isActive
                          ? const Color(0xFF94A3B8)
                          : const Color(0xFF475569),
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

