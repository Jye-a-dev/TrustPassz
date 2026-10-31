import 'package:flutter/material.dart';
import '../../models/deal_model.dart';
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Title & Counter
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.history_rounded,
                      size: 18, color: Color(0xFF22D3EE)),
                  SizedBox(width: 8),
                  Text(
                    'Giao Dịch Gần Đây',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              Text(
                '${widget.deals.length} kết quả',
                style: const TextStyle(
                  color: Color(0xFF64748B),
                  fontSize: 12,
                  fontFamily: 'monospace',
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),

        // Filter Tabs Row
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              _buildFilterChip('ALL', 'Tất cả'),
              const SizedBox(width: 8),
              _buildFilterChip('PENDING', 'Chờ Ký Quỹ'),
              const SizedBox(width: 8),
              _buildFilterChip('DEPOSITED', 'Đã Khóa'),
              const SizedBox(width: 8),
              _buildFilterChip('IN_INSPECTION', 'Đồng Kiểm'),
              const SizedBox(width: 8),
              _buildFilterChip('SETTLED', 'Hoàn Tất'),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // List View / States
        Expanded(
          child: RefreshIndicator(
            onRefresh: widget.onRefresh,
            color: const Color(0xFF22D3EE),
            backgroundColor: const Color(0xFF0F172A),
            child: _buildListContent(),
          ),
        ),
      ],
    );
  }

  Widget _buildFilterChip(String key, String label) {
    final isSelected = widget.activeFilter == key;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => widget.onFilterChanged(key),
        borderRadius: BorderRadius.circular(10),
        child: Container(
          constraints: const BoxConstraints(minHeight: 36),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: isSelected
                ? const Color(0xFF0891B2).withValues(alpha: 0.2)
                : const Color(0xFF0F172A),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isSelected
                  ? const Color(0xFF06B6D4)
                  : const Color(0xFF1E293B),
            ),
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                color: isSelected
                    ? const Color(0xFF22D3EE)
                    : const Color(0xFF94A3B8),
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                fontFamily: 'monospace',
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildListContent() {
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
          const SizedBox(height: 40),
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.cloud_off_rounded,
                  color: Color(0xFFF43F5E),
                  size: 44,
                ),
                const SizedBox(height: 12),
                const Text(
                  'Không thể đồng bộ danh sách',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  widget.errorMessage!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Color(0xFFFDA4AF),
                    fontSize: 12,
                  ),
                  maxLines: 3,
                ),
                const SizedBox(height: 16),
                SizedBox(
                  height: 48,
                  child: ElevatedButton.icon(
                    onPressed: widget.onRetry,
                    icon: const Icon(Icons.refresh_rounded, size: 18),
                    label: const Text('Thử Lại Ngay'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0F172A),
                      foregroundColor: const Color(0xFF22D3EE),
                      side: const BorderSide(color: Color(0xFF0891B2)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
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
        children: const [
          SizedBox(height: 48),
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('📭', style: TextStyle(fontSize: 36)),
                SizedBox(height: 12),
                Text(
                  'Chưa có giao dịch phù hợp',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Kéo xuống để làm mới hoặc tạo giao dịch ký quỹ mới.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Color(0xFF64748B), fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      );
    }

    // High performance list with pagination indicator
    return ListView.builder(
      controller: _scrollController,
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
      itemCount: widget.deals.length + (widget.isFetchingMore ? 1 : 0),
      itemBuilder: (context, index) {
        if (index < widget.deals.length) {
          final deal = widget.deals[index];
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: TransactionItem(
              deal: deal,
              onSelect: widget.onSelectDeal,
            ),
          );
        }

        // Pagination loading indicator
        return const Padding(
          padding: EdgeInsets.symmetric(vertical: 16),
          child: Center(
            child: SizedBox(
              width: 22,
              height: 22,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Color(0xFF22D3EE),
              ),
            ),
          ),
        );
      },
    );
  }
}
