import 'package:flutter/material.dart';
import '../../services/deal_cache_service.dart';
import '../../theme/app_tokens.dart';
import '../../utils/formatters.dart';

class BalanceEscrowCard extends StatelessWidget {
  final EscrowBalanceSummary balanceSummary;
  final VoidCallback onDepositTap;
  final VoidCallback onWithdrawTap;

  const BalanceEscrowCard({
    super.key,
    required this.balanceSummary,
    required this.onDepositTap,
    required this.onWithdrawTap,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.tp;

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: c.isDark
              ? const [Color(0xFF0F172A), Color(0xFF0A101D)]
              : const [Color(0xFFFFFFFF), Color(0xFFF8FAFC)],
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: c.border, width: 1.0),
        boxShadow: c.isDark
            ? const [
                BoxShadow(
                  color: Color(0x33000000),
                  blurRadius: 16,
                  offset: Offset(0, 6),
                ),
              ]
            : const [
                BoxShadow(
                  color: Color(0x0F0F172A),
                  blurRadius: 14,
                  offset: Offset(0, 5),
                ),
              ],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Label & Napas Locked Pill
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(
                    Icons.shield_outlined,
                    size: 16,
                    color: AppTokens.emerald,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'TỔNG GIÁ TRỊ KÝ QUỸ',
                    style: AppTokens.monoStyle(
                      color: c.textMuted,
                      fontSize: 10.5,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.6,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: c.emeraldSoft,
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: c.emeraldBorder, width: 1.0),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: const BoxDecoration(
                        color: AppTokens.emerald,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      '${balanceSummary.activeDealsCount} Giao dịch chạy',
                      style: AppTokens.monoStyle(
                        color: c.emeraldText,
                        fontSize: 10,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Main Escrow Total Figure (Tabular figures)
          Text(
            TrustPasszFormatters.formatVnd(balanceSummary.totalBalance),
            style: AppTokens.monoStyle(
              color: c.textPrimary,
              fontSize: 28,
              fontWeight: FontWeight.w900,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 14),

          // Sub Balances Row
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: c.surfaceSubtle,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: c.border, width: 1.0),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Đang khóa đồng kiểm:',
                        style: TextStyle(color: c.textMuted, fontSize: 11),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        TrustPasszFormatters.formatVnd(
                          balanceSummary.lockedBalance,
                        ),
                        style: AppTokens.monoStyle(
                          color: c.cyanText,
                          fontSize: 13.5,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(width: 1, height: 30, color: c.border),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Số dư khả dụng:',
                        style: TextStyle(color: c.textMuted, fontSize: 11),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        TrustPasszFormatters.formatVnd(
                          balanceSummary.availableBalance,
                        ),
                        style: AppTokens.monoStyle(
                          color: c.emeraldText,
                          fontSize: 13.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // 2 Action Buttons with Borders & Height >= 48px
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: onDepositTap,
                  icon: const Icon(Icons.add_rounded, size: 18),
                  label: const Text(
                    'Nạp Ký Quỹ',
                    style:
                        TextStyle(fontWeight: FontWeight.bold, fontSize: 12.5),
                  ),
                  style: AppTokens.primaryButtonStyle(c),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onWithdrawTap,
                  icon: const Icon(
                    Icons.arrow_downward_rounded,
                    size: 16,
                  ),
                  label: const Text(
                    'Rút Tiền',
                    style:
                        TextStyle(fontWeight: FontWeight.w600, fontSize: 12.5),
                  ),
                  style: AppTokens.outlinedButtonStyle(
                    c,
                    minHeight: AppTokens.primaryButtonHeight,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
