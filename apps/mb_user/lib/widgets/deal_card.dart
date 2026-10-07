import 'package:flutter/material.dart';
import '../models/deal_model.dart';

class DealCard extends StatelessWidget {
  final DealModel deal;
  final ValueChanged<DealModel> onSelect;

  const DealCard({
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

  Color _getStateColor(DealState state) {
    switch (state) {
      case DealState.pending:
        return const Color(0xFFF59E0B); // Amber
      case DealState.deposited:
      case DealState.inInspection:
        return const Color(0xFF10B981); // Emerald
      case DealState.settled:
        return const Color(0xFF06B6D4); // Cyan
      case DealState.refunded:
        return const Color(0xFF64748B); // Slate
      case DealState.disputed:
        return const Color(0xFFF43F5E); // Rose
    }
  }

  @override
  Widget build(BuildContext context) {
    final stateColor = _getStateColor(deal.state);

    return InkWell(
      onTap: () => onSelect(deal),
      borderRadius: BorderRadius.circular(16),
      child: Container(
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
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    deal.title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: stateColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(999),
                    border:
                        Border.all(color: stateColor.withValues(alpha: 0.4)),
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
            if (deal.description != null && deal.description!.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                deal.description!,
                style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
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
      ),
    );
  }
}
