import 'package:flutter/material.dart';
import '../../theme/app_tokens.dart';

/// Highlighted Emerald Escrow Card shown in DealRoomScreen once funds are deposited.
class DealVaultReadyCard extends StatelessWidget {
  final bool highlighted;
  final VoidCallback onOpenVault;

  const DealVaultReadyCard({
    super.key,
    this.highlighted = false,
    required this.onOpenVault,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.tp;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: c.emeraldSoft,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: highlighted ? AppTokens.emerald : c.emeraldBorder,
          width: highlighted ? 1.6 : 1.0,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Icon(Icons.verified_user, color: c.emeraldText, size: 22),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Tiền Ký Quỹ Đã Được Khóa An Toàn',
                  style: TextStyle(
                    color: c.emeraldText,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              if (highlighted)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: c.surface,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: c.emeraldBorder),
                  ),
                  child: Text(
                    'SẴN SÀNG MỞ KÉT',
                    style: AppTokens.monoStyle(
                      color: c.emeraldText,
                      fontSize: 9,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Két số Digital Vault đã sẵn sàng. Bạn có thể mở khóa để kiểm tra nội dung/license key và xác nhận giải ngân.',
            style: TextStyle(color: c.textSecondary, fontSize: 12),
          ),
          const SizedBox(height: 14),
          ElevatedButton(
            onPressed: onOpenVault,
            style: AppTokens.primaryButtonStyle(c),
            child: const Text(
              'Mở Két Số Digital Vault',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}
