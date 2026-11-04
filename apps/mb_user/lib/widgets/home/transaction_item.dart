import 'package:flutter/material.dart';
import '../../models/deal_model.dart';

class TransactionItem extends StatelessWidget {
  final DealModel deal;
  final ValueChanged<DealModel> onSelect;

  const TransactionItem({
    super.key,
    required this.deal,
    required this.onSelect,
  });

  String _formatVnd(double amount) {
    final intVal = amount.toInt();
    final chars = intVal.toString().split('').reversed.toList();
    final buffer = StringBuffer();
    for (int i = 0; i < chars.length; i++) {
      if (i > 0 && i % 3 == 0) {
        buffer.write('.');
      }
      buffer.write(chars[i]);
    }
    return '${buffer.toString().split('').reversed.join()} ₫';
  }

  String _formatDealId(String id) {
    if (id.length <= 8) return '#$id';
    return '#${id.substring(0, 4)}...${id.substring(id.length - 4)}';
  }

  String _formatTimestamp(String? isoString) {
    if (isoString == null || isoString.isEmpty) return 'Vừa xong';
    try {
      final dt = DateTime.parse(isoString).toLocal();
      final now = DateTime.now();
      final diff = now.difference(dt);

      if (diff.inMinutes < 60) {
        return '${diff.inMinutes.clamp(1, 60)} phút trước';
      }
      if (diff.inHours < 24) {
        return '${diff.inHours} giờ trước';
      }
      return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return 'Gần đây';
    }
  }

  Color _getStateColor(DealState state) {
    switch (state) {
      case DealState.pending:
        return const Color(0xFFF59E0B); // Amber
      case DealState.deposited:
        return const Color(0xFF10B981); // Emerald
      case DealState.inInspection:
        return const Color(0xFF06B6D4); // Cyan
      case DealState.settled:
        return const Color(0xFF34D399); // Mint Emerald
      case DealState.refunded:
        return const Color(0xFF64748B); // Slate
      case DealState.disputed:
        return const Color(0xFFF43F5E); // Rose
    }
  }

  @override
  Widget build(BuildContext context) {
    final stateColor = _getStateColor(deal.state);
    final timestampText = _formatTimestamp(deal.updatedAt ?? deal.createdAt);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => onSelect(deal),
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          decoration: BoxDecoration(
            color: const Color(0xFF0F172A),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF1E293B)),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Row: Deal ID & State Badge
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFF080C14),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: const Color(0xFF334155)),
                        ),
                        child: Text(
                          _formatDealId(deal.id),
                          style: const TextStyle(
                            color: Color(0xFF94A3B8),
                            fontSize: 10,
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        timestampText,
                        style: const TextStyle(
                          color: Color(0xFF64748B),
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: stateColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(
                        color: stateColor.withValues(alpha: 0.35),
                      ),
                    ),
                    child: Text(
                      deal.state.vietnameseLabel,
                      style: TextStyle(
                        color: stateColor,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Title Row
              Text(
                deal.title,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  height: 1.3,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 10),

              // Bottom Row: Tabular VND Amount & Duration / Meta
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  Text(
                    _formatVnd(deal.amount),
                    style: const TextStyle(
                      color: Color(0xFF22D3EE),
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      fontFamily: 'monospace',
                    ),
                  ),
                  Row(
                    children: [
                      const Icon(
                        Icons.timer_outlined,
                        size: 12,
                        color: Color(0xFF64748B),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Đồng kiểm: ${deal.inspectionDuration ~/ 3600}h',
                        style: const TextStyle(
                          color: Color(0xFF64748B),
                          fontSize: 11,
                          fontFamily: 'monospace',
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

