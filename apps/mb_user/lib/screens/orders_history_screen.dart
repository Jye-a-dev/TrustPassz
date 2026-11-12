import 'package:flutter/material.dart';
import '../models/deal_model.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/deal_service.dart';
import '../theme/app_tokens.dart';
import '../widgets/home/home_shimmer.dart';
import 'orders/order_history_card.dart';

/// Screen 10: Orders & Escrow Deals History with Buy / Sell tabs, Base Sepolia TxHash & quick actions.
class OrdersHistoryScreen extends StatefulWidget {
  final ValueChanged<DealModel> onSelectDeal;
  final ValueChanged<DealModel> onOpenCheckout;
  final ValueChanged<DealModel> onOpenVault;
  final ValueChanged<String> onOpenDispute;

  const OrdersHistoryScreen({
    super.key,
    required this.onSelectDeal,
    required this.onOpenCheckout,
    required this.onOpenVault,
    required this.onOpenDispute,
  });

  @override
  State<OrdersHistoryScreen> createState() => _OrdersHistoryScreenState();
}

class _OrdersHistoryScreenState extends State<OrdersHistoryScreen> {
  UserModel? _currentUser;
  List<DealModel> _deals = [];
  bool _isLoading = true;
  bool _isBuyTab = true;
  String _statusFilter = 'ALL';

  static const List<({String key, String label})> _filters = [
    (key: 'ALL', label: 'Tất cả'),
    (key: 'PENDING', label: 'Chờ ký quỹ'),
    (key: 'DEPOSITED', label: 'Đang giữ cọc'),
    (key: 'IN_INSPECTION', label: 'Đang đồng kiểm'),
    (key: 'SETTLED', label: 'Hoàn tất'),
    (key: 'DISPUTED', label: 'Tranh chấp'),
  ];

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    setState(() => _isLoading = true);
    try {
      final user = await AuthService.instance.getStoredUser();
      final deals = await DealService.instance.fetchDeals(limit: 50);
      if (!mounted) return;
      setState(() {
        _currentUser = user;
        _deals = deals;
        _isLoading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _isLoading = false);
    }
  }

  List<DealModel> _dealsForTab(bool buyTab) {
    final uid = _currentUser?.id;
    if (uid == null || uid.isEmpty) return _deals;
    return _deals
        .where((d) => buyTab ? d.sellerId != uid : d.sellerId == uid)
        .toList();
  }

  List<DealModel> get _visibleDeals {
    final base = _dealsForTab(_isBuyTab);
    if (_statusFilter == 'ALL') return base;
    return base.where((d) => d.state.label == _statusFilter).toList();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.tp;
    final buyCount = _dealsForTab(true).length;
    final sellCount = _dealsForTab(false).length;
    final visible = _visibleDeals;

    return Scaffold(
      backgroundColor: c.canvas,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Lịch Sử Giao Dịch',
                        style: TextStyle(
                          color: c.textPrimary,
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Quản lý toàn bộ giao dịch Escrow',
                        style: AppTokens.monoStyle(
                          color: c.textMuted,
                          fontSize: 10.5,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: c.emeraldSoft,
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: c.emeraldBorder),
                    ),
                    child: Text(
                      '${_deals.length} Giao dịch',
                      style: AppTokens.monoStyle(
                        color: c.emeraldText,
                        fontSize: 11,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: c.surfaceSubtle,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: c.border),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: _segmentTab(
                        c,
                        label: 'Giao Dịch Mua ($buyCount)',
                        selected: _isBuyTab,
                        onTap: () => setState(() => _isBuyTab = true),
                      ),
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: _segmentTab(
                        c,
                        label: 'Giao Dịch Bán ($sellCount)',
                        selected: !_isBuyTab,
                        onTap: () => setState(() => _isBuyTab = false),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              height: 46,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _filters.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  final f = _filters[index];
                  final selected = _statusFilter == f.key;
                  return OutlinedButton(
                    onPressed: () => setState(() => _statusFilter = f.key),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(44, 44),
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      backgroundColor: selected ? c.textPrimary : c.surface,
                      foregroundColor: selected ? c.surface : c.textMuted,
                      side: BorderSide(
                        color: selected ? c.textPrimary : c.border,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                    child: Text(
                      f.label,
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: selected ? FontWeight.bold : FontWeight.w500,
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 10),
            Expanded(
              child: RefreshIndicator(
                onRefresh: _loadOrders,
                color: AppTokens.emerald,
                child: _isLoading && _deals.isEmpty
                    ? ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: 3,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (_, __) => const TransactionItemSkeleton(),
                      )
                    : visible.isEmpty
                        ? ListView(
                            padding: const EdgeInsets.all(32),
                            children: [
                              const SizedBox(height: 36),
                              Icon(
                                Icons.receipt_long_outlined,
                                size: 42,
                                color: c.textMuted,
                              ),
                              const SizedBox(height: 10),
                              Text(
                                'Chưa có đơn hàng trong mục này',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  color: c.textPrimary,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.fromLTRB(16, 4, 16, 20),
                            itemCount: visible.length,
                            separatorBuilder: (_, __) =>
                                const SizedBox(height: 12),
                            itemBuilder: (context, index) => OrderHistoryCard(
                              deal: visible[index],
                              onOpenDetail: () =>
                                  widget.onSelectDeal(visible[index]),
                              onOpenCheckout: () =>
                                  widget.onOpenCheckout(visible[index]),
                              onOpenVault: () =>
                                  widget.onOpenVault(visible[index]),
                              onOpenDispute: () =>
                                  widget.onOpenDispute(visible[index].id),
                            ),
                          ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _segmentTab(
    AppColorPalette c, {
    required String label,
    required bool selected,
    required VoidCallback onTap,
  }) {
    return SizedBox(
      height: 44,
      child: OutlinedButton(
        onPressed: onTap,
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(44, 44),
          backgroundColor: selected ? c.surface : Colors.transparent,
          foregroundColor: selected ? c.textPrimary : c.textMuted,
          side: BorderSide(
            color: selected ? c.borderStrong : Colors.transparent,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: selected ? FontWeight.bold : FontWeight.w500,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ),
    );
  }
}
