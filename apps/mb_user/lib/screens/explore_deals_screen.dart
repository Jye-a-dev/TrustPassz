import 'package:flutter/material.dart';
import '../models/deal_model.dart';
import '../services/deal_service.dart';
import '../theme/app_tokens.dart';
import '../widgets/home/home_shimmer.dart';
import 'explore/explore_deal_card.dart';

/// Screen 04: Explore Marketplace Deals with Spotlight Search & Asset Category Filters.
class ExploreDealsScreen extends StatefulWidget {
  final ValueChanged<DealModel> onSelectDeal;

  const ExploreDealsScreen({super.key, required this.onSelectDeal});

  @override
  State<ExploreDealsScreen> createState() => _ExploreDealsScreenState();
}

class _ExploreDealsScreenState extends State<ExploreDealsScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<DealModel> _deals = [];
  bool _isLoading = true;
  String? _error;
  String _selectedCategory = 'ALL';
  bool _onlyFastInspection = false;

  static const List<({String id, String label})> _categories = [
    (id: 'ALL', label: 'Tất cả'),
    (id: 'SOURCE_CODE', label: 'Mã nguồn Git'),
    (id: 'LICENSE_KEY', label: 'License Soft'),
    (id: 'DESIGN_ASSET', label: 'Ebook / PDF'),
    (id: 'ACCOUNT_CREDENTIAL', label: 'Cloud / API'),
    (id: 'OTHER', label: 'Khác'),
  ];

  @override
  void initState() {
    super.initState();
    _loadDeals();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadDeals() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final results = await DealService.instance.fetchDeals(
        limit: 50,
        search: _searchController.text,
      );
      if (!mounted) return;
      setState(() {
        _deals = results;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  List<DealModel> get _filteredDeals {
    final query = _searchController.text.trim().toLowerCase();
    return _deals.where((d) {
      final assetType = d.digitalAsset?.assetType ?? 'SOURCE_CODE';
      if (_selectedCategory != 'ALL' && assetType != _selectedCategory) {
        return false;
      }
      if (_onlyFastInspection && d.inspectionDuration > 43200) {
        return false;
      }
      if (query.isNotEmpty) {
        final matchTitle = d.title.toLowerCase().contains(query);
        final matchDesc = (d.description ?? '').toLowerCase().contains(query);
        return matchTitle || matchDesc;
      }
      return true;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.tp;
    final visibleDeals = _filteredDeals;

    return Scaffold(
      backgroundColor: c.canvas,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      height: 46,
                      decoration: BoxDecoration(
                        color: c.surface,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: c.borderStrong),
                      ),
                      child: TextField(
                        controller: _searchController,
                        onChanged: (_) => setState(() {}),
                        onSubmitted: (_) => _loadDeals(),
                        style: TextStyle(color: c.textPrimary, fontSize: 13),
                        decoration: InputDecoration(
                          hintText: 'Tìm mã nguồn, license, tài liệu...',
                          prefixIcon: Icon(
                            Icons.search_rounded,
                            color: c.textMuted,
                            size: 20,
                          ),
                          suffixIcon: _searchController.text.isNotEmpty
                              ? IconButton(
                                  icon: Icon(
                                    Icons.clear_rounded,
                                    size: 16,
                                    color: c.textMuted,
                                  ),
                                  onPressed: () {
                                    _searchController.clear();
                                    setState(() {});
                                  },
                                )
                              : null,
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          filled: false,
                          contentPadding: const EdgeInsets.symmetric(
                            vertical: 12,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  SizedBox(
                    width: 46,
                    height: 46,
                    child: OutlinedButton(
                      onPressed: () => setState(
                        () => _onlyFastInspection = !_onlyFastInspection,
                      ),
                      style: OutlinedButton.styleFrom(
                        padding: EdgeInsets.zero,
                        minimumSize: const Size(46, 46),
                        backgroundColor:
                            _onlyFastInspection ? c.emeraldSoft : c.surface,
                        side: BorderSide(
                          color: _onlyFastInspection
                              ? AppTokens.emerald
                              : c.borderStrong,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: Icon(
                        Icons.tune_rounded,
                        size: 20,
                        color: _onlyFastInspection
                            ? c.emeraldText
                            : c.textSecondary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(
              height: 48,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                itemCount: _categories.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  final cat = _categories[index];
                  final selected = _selectedCategory == cat.id;
                  return OutlinedButton(
                    onPressed: () => setState(() => _selectedCategory = cat.id),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(44, 44),
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      backgroundColor: selected ? c.textPrimary : c.surface,
                      foregroundColor: selected ? c.surface : c.textSecondary,
                      side: BorderSide(
                        color: selected ? c.textPrimary : c.border,
                        width: 1.0,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                    child: Text(
                      cat.label,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: selected ? FontWeight.bold : FontWeight.w500,
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: RefreshIndicator(
                onRefresh: _loadDeals,
                color: AppTokens.emerald,
                child: _buildBody(c, visibleDeals),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBody(AppColorPalette c, List<DealModel> visibleDeals) {
    if (_isLoading && _deals.isEmpty) {
      return ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: 4,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, __) => const TransactionItemSkeleton(),
      );
    }

    if (_error != null && _deals.isEmpty) {
      return ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const SizedBox(height: 40),
          Icon(Icons.cloud_off_rounded, size: 42, color: c.roseText),
          const SizedBox(height: 12),
          Text(
            'Không thể tải danh sách thị trường',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: c.textPrimary,
              fontSize: 15,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            _error!,
            textAlign: TextAlign.center,
            style: TextStyle(color: c.textMuted, fontSize: 12),
          ),
          const SizedBox(height: 16),
          Center(
            child: OutlinedButton.icon(
              onPressed: _loadDeals,
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: const Text('Thử lại'),
              style: AppTokens.outlinedButtonStyle(c),
            ),
          ),
        ],
      );
    }

    if (visibleDeals.isEmpty) {
      return ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const SizedBox(height: 48),
          Icon(Icons.search_off_rounded, size: 42, color: c.textMuted),
          const SizedBox(height: 10),
          Text(
            'Không tìm thấy giao dịch phù hợp',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: c.textPrimary,
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc phân loại tài sản số.',
            textAlign: TextAlign.center,
            style: TextStyle(color: c.textMuted, fontSize: 12),
          ),
        ],
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 20),
      itemCount: visibleDeals.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) => ExploreDealCard(
        deal: visibleDeals[index],
        onTap: () => widget.onSelectDeal(visibleDeals[index]),
      ),
    );
  }
}
