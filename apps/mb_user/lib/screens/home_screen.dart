import 'package:flutter/material.dart';
import '../models/deal_model.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/deal_cache_service.dart';
import '../services/deal_service.dart';
import '../theme/app_tokens.dart';
import '../widgets/home/balance_escrow_card.dart';
import '../widgets/home/home_app_bar.dart';
import '../widgets/home/home_shimmer.dart';
import '../widgets/home/quick_actions_bar.dart';
import '../widgets/home/recent_transactions_list.dart';
import '../widgets/modals/qr_scan_sheet.dart';
import 'checkout_vietqr_screen.dart';
import 'digital_vault_screen.dart';

/// Screen 03: Home & Escrow Dashboard V2 (Light Mode Default, 5-tab Shell ready,
/// zero sticky dispute button, zero SnackBar placeholders).
class HomeScreen extends StatefulWidget {
  final ValueChanged<DealModel> onSelectDeal;
  final ValueChanged<String> onOpenDisputeFlow;
  final VoidCallback onLogout;
  final VoidCallback? onCreateDealTap;
  final VoidCallback? onViewAllOrdersTap;
  final VoidCallback? onProfileTap;

  const HomeScreen({
    super.key,
    required this.onSelectDeal,
    required this.onOpenDisputeFlow,
    required this.onLogout,
    this.onCreateDealTap,
    this.onViewAllOrdersTap,
    this.onProfileTap,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  UserModel? _currentUser;
  List<DealModel> _deals = [];
  EscrowBalanceSummary _balanceSummary = const EscrowBalanceSummary(
    lockedBalance: 0,
    availableBalance: 0,
    disputedBalance: 0,
    activeDealsCount: 0,
  );

  bool _isLoading = false;
  bool _isFetchingMore = false;
  int _currentPage = 1;
  bool _hasMore = true;
  String? _errorMessage;
  String _activeFilter = 'ALL';

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    final cachedDeals = await DealCacheService.instance.loadCachedDeals();
    final storedUser = await AuthService.instance.getStoredUser();

    if (mounted) {
      setState(() {
        _currentUser = storedUser;
        if (cachedDeals.isNotEmpty) {
          _deals = cachedDeals;
          _balanceSummary = EscrowBalanceSummary.fromDeals(cachedDeals);
        }
      });
    }

    await _fetchDeals(isInitial: true);
  }

  Future<void> _fetchDeals({
    bool isInitial = false,
    bool resetPage = false,
  }) async {
    if (resetPage) {
      _currentPage = 1;
      _hasMore = true;
    }

    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final results = await DealService.instance.fetchDeals(
        page: _currentPage,
        limit: 20,
        status: _activeFilter == 'ALL' ? null : _activeFilter,
      );

      EscrowBalanceSummary summary = EscrowBalanceSummary.fromDeals(
        resetPage || isInitial ? results : [..._deals, ...results],
      );
      try {
        summary = await DealService.instance.fetchEscrowBalance();
      } catch (_) {
        // Fallback to locally computed balance from fetched deals
      }

      if (!mounted) return;
      setState(() {
        if (resetPage || isInitial) {
          _deals = results;
        } else {
          _deals.addAll(results);
        }
        _hasMore = results.length >= 20;
        _balanceSummary = summary;
      });

      if (_activeFilter == 'ALL') {
        await DealCacheService.instance.cacheDeals(_deals);
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString();
        if (_deals.isEmpty) {
          _balanceSummary = const EscrowBalanceSummary(
            lockedBalance: 0,
            availableBalance: 0,
            disputedBalance: 0,
            activeDealsCount: 0,
          );
        }
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _loadMoreDeals() async {
    if (_isFetchingMore || !_hasMore || _isLoading) return;
    setState(() => _isFetchingMore = true);
    try {
      final nextPage = _currentPage + 1;
      final results = await DealService.instance.fetchDeals(
        page: nextPage,
        limit: 20,
        status: _activeFilter == 'ALL' ? null : _activeFilter,
      );
      if (!mounted) return;
      setState(() {
        _currentPage = nextPage;
        _deals.addAll(results);
        _hasMore = results.length >= 20;
        _balanceSummary = EscrowBalanceSummary.fromDeals(_deals);
      });
    } catch (_) {
      // Keep loaded items on pagination error
    } finally {
      if (mounted) setState(() => _isFetchingMore = false);
    }
  }

  void _onFilterChanged(String filter) {
    if (_activeFilter == filter) return;
    setState(() => _activeFilter = filter);
    _fetchDeals(resetPage: true);
  }

  void _handleDepositTap() {
    final pendingDeals =
        _deals.where((d) => d.state == DealState.pending).toList();
    if (pendingDeals.isNotEmpty) {
      final target = pendingDeals.first;
      Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (ctx) => CheckoutVietQrScreen(
            dealId: target.id,
            initialDeal: target,
            onBack: () => Navigator.of(ctx).pop(),
            onOpenVault: () {
              Navigator.of(ctx).pushReplacement(
                MaterialPageRoute<void>(
                  builder: (vCtx) => DigitalVaultScreen(
                    dealId: target.id,
                    onBack: () => Navigator.of(vCtx).pop(),
                    onOpenDispute: widget.onOpenDisputeFlow,
                  ),
                ),
              );
            },
          ),
        ),
      );
      return;
    }

    if (widget.onCreateDealTap != null) {
      widget.onCreateDealTap!();
    }
  }

  Future<void> _handleWithdrawTap() async {
    final c = context.tp;
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: c.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Rút Tiền Về Ngân Hàng VietQR',
            style: TextStyle(
                color: c.textPrimary,
                fontSize: 15,
                fontWeight: FontWeight.bold)),
        content: Text(
          'Số dư khả dụng được chuyển tự động về STK VietQR đã liên kết trong mục Cá Nhân.',
          style: TextStyle(color: c.textMuted, fontSize: 13),
        ),
        actions: [
          OutlinedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              widget.onProfileTap?.call();
            },
            style: AppTokens.outlinedButtonStyle(c),
            child: const Text('Cấu hình STK'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(),
            style: AppTokens.primaryButtonStyle(c),
            child: const Text('Đóng'),
          ),
        ],
      ),
    );
  }

  Future<void> _handleScanQr() async {
    final scannedCode = await QrScanSheet.show(context);
    if (!mounted || scannedCode == null || scannedCode.trim().isEmpty) return;
    final clean = scannedCode.trim();
    final matched = _deals.where((d) => d.id == clean).toList();
    if (matched.isNotEmpty) {
      widget.onSelectDeal(matched.first);
    } else {
      Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (ctx) => CheckoutVietQrScreen(
              dealId: clean, onBack: () => Navigator.of(ctx).pop()),
        ),
      );
    }
  }

  Future<void> _handleOpenVault() async {
    final vaultDeals = _deals
        .where((d) =>
            d.state == DealState.deposited || d.state == DealState.inInspection)
        .toList();

    if (vaultDeals.isEmpty) {
      final c = context.tp;
      await showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: c.surface,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text('Chưa Có Két Số Sẵn Sàng',
              style: TextStyle(
                  color: c.textPrimary,
                  fontSize: 15,
                  fontWeight: FontWeight.bold)),
          content: Text(
            'Chưa có giao dịch nào ở trạng thái đã khóa ký quỹ.',
            style: TextStyle(color: c.textMuted, fontSize: 13),
          ),
          actions: [
            OutlinedButton(
              onPressed: () => Navigator.of(ctx).pop(),
              style: AppTokens.outlinedButtonStyle(c),
              child: const Text('Đóng'),
            ),
            if (widget.onCreateDealTap != null)
              ElevatedButton(
                onPressed: () {
                  Navigator.of(ctx).pop();
                  widget.onCreateDealTap!();
                },
                style: AppTokens.primaryButtonStyle(c),
                child: const Text('Tạo Giao Dịch'),
              ),
          ],
        ),
      );
      return;
    }

    final target = vaultDeals.first;
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (ctx) => DigitalVaultScreen(
          dealId: target.id,
          inspectionDeadline: target.inspectionDeadline,
          onBack: () => Navigator.of(ctx).pop(),
          onOpenDispute: widget.onOpenDisputeFlow,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = context.tp;

    return Scaffold(
      backgroundColor: c.canvas,
      appBar: HomeAppBar(
        user: _currentUser,
        isRefreshing: _isLoading,
        onRefresh: () => _fetchDeals(resetPage: true),
        onNotificationsTap: () => widget.onViewAllOrdersTap?.call(),
        onProfileTap: widget.onProfileTap,
        onLogout: () {},
      ),
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final isTablet = constraints.maxWidth > 600;
            final horizontalPadding = isTablet ? 32.0 : 16.0;

            final topSection = Padding(
              padding: EdgeInsets.symmetric(horizontal: horizontalPadding),
              child: Column(
                children: [
                  const SizedBox(height: 8),
                  if (_isLoading && _deals.isEmpty)
                    const BalanceCardSkeleton()
                  else
                    BalanceEscrowCard(
                      balanceSummary: _balanceSummary,
                      onDepositTap: _handleDepositTap,
                      onWithdrawTap: _handleWithdrawTap,
                    ),
                  const SizedBox(height: 12),
                  QuickActionsBar(
                    onCreateDeal: widget.onCreateDealTap ?? _handleDepositTap,
                    onScanQr: _handleScanQr,
                    onOpenVault: _handleOpenVault,
                  ),
                  const SizedBox(height: 14),
                ],
              ),
            );
            final list = RecentTransactionsList(
              deals: _deals,
              isLoading: _isLoading,
              isFetchingMore: _isFetchingMore,
              errorMessage: _errorMessage,
              activeFilter: _activeFilter,
              onFilterChanged: _onFilterChanged,
              onSelectDeal: widget.onSelectDeal,
              onRefresh: () => _fetchDeals(resetPage: true),
              onLoadMore: _loadMoreDeals,
              onRetry: () => _fetchDeals(resetPage: true),
              onViewAll: widget.onViewAllOrdersTap,
            );

            return Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 720),
                child: constraints.maxHeight < 640
                    ? SingleChildScrollView(
                        child: Column(
                          children: [
                            topSection,
                            SizedBox(height: 360, child: list),
                          ],
                        ),
                      )
                    : Column(children: [topSection, Expanded(child: list)]),
              ),
            );
          },
        ),
      ),
    );
  }
}
