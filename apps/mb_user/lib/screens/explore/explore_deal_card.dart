import 'package:flutter/material.dart';
import '../../models/deal_model.dart';
import '../../theme/app_tokens.dart';
import '../../utils/formatters.dart';

class ExploreDealCard extends StatelessWidget {
  final DealModel deal;
  final VoidCallback onTap;

  const ExploreDealCard({
    super.key,
    required this.deal,
    required this.onTap,
  });

  ({IconData icon, String label, Color color, Color bg, Color border})
      _assetMeta(AppColorPalette c, String? assetType) {
    switch (assetType) {
      case 'LICENSE_KEY':
        return (
          icon: Icons.vpn_key_outlined,
          label: 'License',
          color: c.amberText,
          bg: c.amberSoft,
          border: c.amberBorder,
        );
      case 'DESIGN_ASSET':
        return (
          icon: Icons.menu_book_outlined,
          label: 'Tài liệu',
          color: c.cyanText,
          bg: c.cyanSoft,
          border: c.cyanBorder,
        );
      case 'ACCOUNT_CREDENTIAL':
        return (
          icon: Icons.cloud_outlined,
          label: 'Cloud / API',
          color: AppTokens.violet,
          bg: c.violetSoft,
          border: c.violetBorder,
        );
      default:
        return (
          icon: Icons.code_rounded,
          label: 'Git Repo',
          color: c.textSecondary,
          bg: c.surfaceSubtle,
          border: c.border,
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.tp;
    final meta = _assetMeta(c, deal.digitalAsset?.assetType);
    final sellerLabel = deal.sellerName ?? 'Thành viên eKYC';
    final hours = (deal.inspectionDuration ~/ 3600).clamp(1, 72);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: AppTokens.cardDecoration(c, radius: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  children: [
                    Container(
                      width: 30,
                      height: 30,
                      decoration: BoxDecoration(
                        color: meta.bg,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: meta.border),
                      ),
                      child: Icon(meta.icon, size: 15, color: meta.color),
                    ),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        '${meta.label} • $sellerLabel ✓',
                        style: TextStyle(
                          color: c.textSecondary,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: c.emeraldSoft,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: c.emeraldBorder),
                ),
                child: Text(
                  '${hours}h kiểm thử',
                  style: AppTokens.monoStyle(color: c.emeraldText, fontSize: 10.5),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            deal.title,
            style: TextStyle(
              color: c.textPrimary,
              fontSize: 14.5,
              fontWeight: FontWeight.bold,
              height: 1.35,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 12),
          Divider(height: 1, color: c.border),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                TrustPasszFormatters.formatVnd(deal.amount),
                style: AppTokens.monoStyle(
                  color: c.textPrimary,
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                ),
              ),
              OutlinedButton(
                onPressed: onTap,
                style: AppTokens.outlinedButtonStyle(
                  c,
                  backgroundColor: c.textPrimary,
                  foregroundColor: c.surface,
                  borderColor: c.textPrimary,
                ),
                child: const Text(
                  'Xem giao dịch →',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
