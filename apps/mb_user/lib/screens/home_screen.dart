import 'package:flutter/material.dart';
import '../models/deal_model.dart';
import '../services/deal_service.dart';
import '../widgets/deal_card.dart';

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
  List<DealModel> _deals = [];
  bool _isLoading = false;
  String? _errorMessage;
  String _activeFilter = 'ALL';

  @override
  void initState() {
    super.initState();
    _loadDeals();
  }

  Future<void> _loadDeals() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final results = await DealService.instance.fetchDeals(
        status: _activeFilter == 'ALL' ? null : _activeFilter,
      );
      if (!mounted) return;
      setState(() {
        _deals = results;
      });
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

  void _onFilterChanged(String filter) {
    if (_activeFilter == filter) return;
    setState(() {
      _activeFilter = filter;
    });
    _loadDeals();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF080C14),
      appBar: AppBar(
        backgroundColor: const Color(0xFF080C14),
        elevation: 0,
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Sàn Kèo Ký Quỹ',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              'Realtime Escrow Marketplace',
              style: TextStyle(
                color: Color(0xFF64748B),
                fontSize: 10,
                fontFamily: 'monospace',
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            onPressed: _isLoading ? null : _loadDeals,
            icon: const Icon(Icons.refresh, color: Color(0xFF22D3EE), size: 20),
            tooltip: 'Làm mới',
          ),
          IconButton(
            onPressed: widget.onLogout,
            icon: const Icon(Icons.logout, color: Color(0xFF64748B), size: 20),
            tooltip: 'Đăng xuất',
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Filter Tabs
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  _buildFilterChip('ALL', 'Tất cả'),
                  const SizedBox(width: 8),
                  _buildFilterChip('PENDING', 'Chờ Ký Quỹ'),
                  const SizedBox(width: 8),
                  _buildFilterChip('DEPOSITED', 'Đã Khóa Tiền'),
                  const SizedBox(width: 8),
                  _buildFilterChip('IN_INSPECTION', 'Đồng Kiểm'),
                ],
              ),
            ),

            // Deals List / Content
            Expanded(
              child: RefreshIndicator(
                onRefresh: _loadDeals,
                color: const Color(0xFF22D3EE),
                backgroundColor: const Color(0xFF0F172A),
                child: _buildBody(),
              ),
            ),

            // AI Dispute Floating Button Bar
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              child: ElevatedButton.icon(
                onPressed: widget.onOpenDisputeFlow,
                icon: const Text('⚖️', style: TextStyle(fontSize: 14)),
                label: const Text(
                  'Khiếu Nại Trọng Tài AI (Dispute Center)',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0F172A),
                  foregroundColor: const Color(0xFFF43F5E),
                  side: const BorderSide(color: Color(0xFFF43F5E), width: 0.8),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String key, String label) {
    final isSelected = _activeFilter == key;

    return InkWell(
      onTap: () => _onFilterChanged(key),
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFF0891B2).withValues(alpha: 0.2)
              : const Color(0xFF0F172A),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color:
                isSelected ? const Color(0xFF06B6D4) : const Color(0xFF1E293B),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color:
                isSelected ? const Color(0xFF22D3EE) : const Color(0xFF94A3B8),
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            fontFamily: 'monospace',
          ),
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading && _deals.isEmpty) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(color: Color(0xFF22D3EE)),
            SizedBox(height: 12),
            Text(
              'Đang tải danh sách kèo trực tiếp...',
              style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
            ),
          ],
        ),
      );
    }

    if (_errorMessage != null && _deals.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.cloud_off, color: Color(0xFFF43F5E), size: 40),
              const SizedBox(height: 12),
              Text(
                'Không thể kết nối API:\n$_errorMessage',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Color(0xFFFDA4AF), fontSize: 12),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _loadDeals,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0F172A),
                ),
                child: const Text('Thử Lại'),
              ),
            ],
          ),
        ),
      );
    }

    if (_deals.isEmpty) {
      return ListView(
        children: const [
          SizedBox(height: 80),
          Center(
            child: Column(
              children: [
                Text('📭', style: TextStyle(fontSize: 36)),
                SizedBox(height: 12),
                Text(
                  'Không có kèo phù hợp',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Hiện chưa có giao dịch nào ở trạng thái này.',
                  style: TextStyle(color: Color(0xFF64748B), fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: _deals.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, index) {
        final deal = _deals[index];
        return DealCard(deal: deal, onSelect: widget.onSelectDeal);
      },
    );
  }
}
