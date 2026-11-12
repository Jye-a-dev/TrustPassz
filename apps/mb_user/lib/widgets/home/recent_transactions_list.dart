import 'package:flutter/material.dart';
import '../../models/deal_model.dart';
import '../../theme/app_tokens.dart';
import 'home_shimmer.dart';
import 'transaction_item.dart';

class RecentTransactionsList extends StatefulWidget {
  final List<DealModel> deals;
  final bool isLoading;
  final bool isFetchingMore;
  final String? errorMessage;
  final String activeFilter;
  final ValueChanged<String> onFilterChanged;
  final ValueChanged<DealModel> onSelectDeal;
  final Future<void> Function() onRefresh;
  final VoidCallback onLoadMore;
  final VoidCallback onRetry;
  final VoidCallback? onViewAll;

  const RecentTransactionsList({
    super.key,
    required this.deals,
    required this.isLoading,
    required this.isFetchingMore,
    required this.errorMessage,
    required this.activeFilter,
    required this.onFilterChanged,
    required this.onSelectDeal,
    required this.onRefresh,
    required this.onLoadMore,
    required this.onRetry,
    this.onViewAll,
  });

  @override
  State<RecentTransactionsList> createState() => _RecentTransactionsListState();
}

class _RecentTransactionsListState extends State<RecentTransactionsList> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!_scrollController.hasClients) return;
    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentScroll = _scrollController.offset;
    if (currentScroll >= (maxScroll - 200) &&
        !widget.isFetchingMore &&
        !widget.isLoading) {
      widget.onLoadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.tp;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(Icons.history_rounded, size: 17, color: c.cyanText),
                  const SizedBox(width: 8),
                  Text(
                    'GIAO DỊCH ĐANG CHẠY',
                    style: AppTokens.monoStyle(
                      color: c.textPrimary,
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.4,
                    ),
                  ),
                ],
              ),
              if (widget.onViewAll != null)
                TextButton(
                  onPressed: widget.onViewAll,
                  style: TextButton.styleFrom(
                    minimumSize: const Size(44, 44),
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    side: BorderSide(color: c.border, width: 1.0),
                    backgroundColor: c.surface,
                  ),
                  child: Text(
                    'Tất cả (${widget.deals.length}) →',
                    style: TextStyle(
                      color: c.cyanText,
                      fontSize: 11.5,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                )
              else
                Text(
                  '${widget.deals.length} kết quả',
                  style: AppTokens.monoStyle(
                    color: c.textMuted,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 8),

        // Filter Chips (>= 44px height)
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              _buildFilterChip(c, 'ALL', 'Tất cả'),
              const SizedBox(width: 8),
              _buildFilterChip(c, 'PENDING', 'Chờ Ký Quỹ'),
              const SizedBox(width: 8),
              _buildFilterChip(c, 'DEPOSITED', 'Đã Khóa'),
              const SizedBox(width: 8),
              _buildFilterChip(c, 'IN_INSPECTION', 'Đồng Kiểm'),
              const SizedBox(width: 8),
              _buildFilterChip(c, 'SETTLED', 'Hoàn Tất'),
            ],
          ),
        ),
        const SizedBox(height: 10),

        Expanded(
          child: RefreshIndicator(
            onRefresh: widget.onRefresh,
            color: AppTokens.cyan,
            backgroundColor: c.surface,
            child: _buildListContent(c),
          ),
        ),
      ],
    );
  }

  Widget _buildFilterChip(AppColorPalette c, String key, String label) {
    final isSelected = widget.activeFilter == key;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => widget.onFilterChanged(key),
        borderRadius: BorderRadius.circular(12),
        child: Container(
          constraints: const BoxConstraints(minHeight: 44),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? c.cyanSoft : c.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? AppTokens.cyan : c.border,
              width: 1.0,
            ),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              color: isSelected ? c.cyanText : c.textMuted,
              fontSize: 12,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildListContent(AppColorPalette c) {
    if (widget.isLoading && widget.deals.isEmpty) {
      return ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        itemCount: 4,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, __) => const TransactionItemSkeleton(),
      );
    }

    if (widget.errorMessage != null && widget.deals.isEmpty) {
      return ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const SizedBox(height: 32),
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.cloud_off_rounded, color: c.roseText, size: 42),
                const SizedBox(height: 12),
                Text(
                  'Không thể đồng bộ danh sách',
                  style: TextStyle(
                    color: c.textPrimary,
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  widget.errorMessage!,
                  textAlign: TextAlign.center,
                  style: TextStyle(color: c.roseText, fontSize: 12),
                  maxLines: 3,
                ),
                const SizedBox(height: 16),
                OutlinedButton.icon(
                  onPressed: widget.onRetry,
                  icon: Icon(Icons.refresh_rounded, size: 18, color: c.cyanText),
                  label: Text(
                    'Thử Lại Ngay',
                    style: TextStyle(
                      color: c.cyanText,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  style: AppTokens.outlinedButtonStyle(
                    c,
                    borderColor: c.cyanBorder,
                    backgroundColor: c.cyanSoft,
                    minHeight: 48,
                  ),
                ),
              ],
            ),
          ),
        ],
      );
    }

    if (widget.deals.isEmpty) {
      return ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const SizedBox(height: 40),
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.inbox_outlined,
                  size: 42,
                  color: c.textMuted,
                ),
                const SizedBox(height: 12),
                Text(
                  'Chưa có giao dịch phù hợp',
                  style: TextStyle(
                    color: c.textPrimary,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Kéo xuống để làm mới hoặc tạo giao dịch ký quỹ mới.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: c.textMuted, fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      );
    }

    return ListView.builder(
      controller: _scrollController,
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 20),
      itemCount: widget.deals.length + (widget.isFetchingMore ? 1 : 0),
      itemBuilder: (context, index) {
        if (index < widget.deals.length) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: TransactionItem(
              deal: widget.deals[index],
              onSelect: widget.onSelectDeal,
            ),
          );
        }

        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Center(
            child: SizedBox(
              width: 22,
              height: 22,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: c.cyanText,
              ),
            ),
          ),
        );
      },
    );
  }
}
