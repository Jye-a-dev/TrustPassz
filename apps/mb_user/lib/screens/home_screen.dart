import 'package:flutter/material.dart';
import '../models/deal_model.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/deal_service.dart';
import '../services/deal_cache_service.dart';
import '../widgets/home/home_app_bar.dart';
import '../widgets/home/balance_escrow_card.dart';
import '../widgets/home/quick_actions_bar.dart';
import '../widgets/home/recent_transactions_list.dart';
import '../widgets/home/home_shimmer.dart';
import '../widgets/vault_modal.dart';

class HomeScreen extends StatefulWidget {
  final ValueChanged<DealModel> onSelectDeal;
  final VoidCallback onOpenDisputeFlow;
  final VoidCallback onLogout;

  const HomeScreen({
    super.key,
    required this.onSelectDeal,
    required this.onOpenDisputeFlow,
    required this.onLogout,
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
    // Phase 1: Fast local cache hydration for FCP < 1s
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

    // Phase 2: Live network synchronization
    await _fetchDeals(isInitial: true);
  }

  Future<void> _fetchDeals(
      {bool isInitial = false, bool resetPage = false}) async {
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

      if (!mounted) return;

      setState(() {
        if (resetPage || isInitial) {
          _deals = results;
        } else {
          _deals.addAll(results);
        }
        _hasMore = results.length >= 20;
        _balanceSummary = EscrowBalanceSummary.fromDeals(_deals);
      });

      // Persist in-memory & local storage
      if (_activeFilter == 'ALL') {
        await DealCacheService.instance.cacheDeals(_deals);
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _loadMoreDeals() async {
    if (_isFetchingMore || !_hasMore || _isLoading) return;

    setState(() {
      _isFetchingMore = true;
    });

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
      // Keep existing list on pagination error
    } finally {
      if (mounted) {
        setState(() {
          _isFetchingMore = false;
        });
      }
    }
  }

  void _onFilterChanged(String filter) {
    if (_activeFilter == filter) return;
    setState(() {
      _activeFilter = filter;
    });
    _fetchDeals(resetPage: true);
  }

  void _handleCreateDeal() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Khởi tạo giao dịch ký quỹ mới qua Smart Contract...'),
        backgroundColor: Color(0xFF0F766E),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _handleScanQr() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Mở module quét mã VietQR bảo lưu...'),
        backgroundColor: Color(0xFF0284C7),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _handleOpenVault() async {
    final depositedDeals = _deals
        .where((d) =>
            d.state == DealState.deposited || d.state == DealState.inInspection)
        .toList();

    if (depositedDeals.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
              'Chưa có hợp đồng nào ở trạng thái đã khóa tiền để mở két số.'),
          backgroundColor: Color(0xFFB45309),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    final targetDeal = depositedDeals.first;
    try {
      final vault = await DealService.instance.unlockDealVault(targetDeal.id);
      if (!mounted) return;

      await VaultModal.show(
        context: context,
        deal: targetDeal,
        vaultData: vault,
        onSettle: () => DealService.instance.settleEscrowDeal(targetDeal.id),
        onDispute: widget.onOpenDisputeFlow,
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi mở két số: $e'),
          backgroundColor: const Color(0xFFBE123C),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF080C14),
      appBar: HomeAppBar(
        user: _currentUser,
        isRefreshing: _isLoading,
        onRefresh: () => _fetchDeals(resetPage: true),
        onNotificationsTap: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Không có thông báo mới từ hệ thống Trọng tài AI.'),
              backgroundColor: Color(0xFF1E293B),
              behavior: SnackBarBehavior.floating,
            ),
          );
        },
        onLogout: widget.onLogout,
      ),
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final isTablet = constraints.maxWidth > 600;
            final horizontalPadding = isTablet ? 32.0 : 16.0;

            return Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 720),
                child: Column(
                  children: [
                    // Top Overview Section
                    Padding(
                      padding:
                          EdgeInsets.symmetric(horizontal: horizontalPadding),
                      child: Column(
                        children: [
                          const SizedBox(height: 8),
                          if (_isLoading && _deals.isEmpty)
                            const BalanceCardSkeleton()
                          else
                            BalanceEscrowCard(
                              balanceSummary: _balanceSummary,
                              onDepositTap: _handleCreateDeal,
                              onWithdrawTap: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text(
                                        'Số dư khả dụng sẵn sàng rút về tài khoản ngân hàng liên kết.'),
                                    backgroundColor: Color(0xFF0F766E),
                                    behavior: SnackBarBehavior.floating,
                                  ),
                                );
                              },
                            ),
                          const SizedBox(height: 12),
                          QuickActionsBar(
                            onCreateDeal: _handleCreateDeal,
                            onScanQr: _handleScanQr,
                            onOpenVault: _handleOpenVault,
                          ),
                          const SizedBox(height: 14),
                        ],
                      ),
                    ),

                    // Recent Transactions List Section
                    Expanded(
                      child: RecentTransactionsList(
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
                      ),
                    ),

                    // AI Dispute Center Action Bar
                    Padding(
                      padding: EdgeInsets.fromLTRB(
                        horizontalPadding,
                        6,
                        horizontalPadding,
                        12,
                      ),
                      child: SizedBox(
                        height: 48,
                        child: ElevatedButton.icon(
                          onPressed: widget.onOpenDisputeFlow,
                          icon:
                              const Text('⚖️', style: TextStyle(fontSize: 14)),
                          label: const Text(
                            'Khiếu Nại Trọng Tài AI (Dispute Center)',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0F172A),
                            foregroundColor: const Color(0xFFF43F5E),
                            side: const BorderSide(
                              color: Color(0xFFF43F5E),
                              width: 0.8,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
