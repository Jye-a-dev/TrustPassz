import 'dart:async';
import 'package:flutter/material.dart';
import '../models/deal_model.dart';
import '../services/deal_service.dart';
import '../widgets/bargain_slider.dart';
import '../widgets/vietqr_payment_view.dart';
import '../widgets/vault_modal.dart';

class DealRoomScreen extends StatefulWidget {
  final String dealId;
  final VoidCallback onBack;
  final ValueChanged<String> onOpenDispute;

  const DealRoomScreen({
    super.key,
    required this.dealId,
    required this.onBack,
    required this.onOpenDispute,
  });

  @override
  State<DealRoomScreen> createState() => _DealRoomScreenState();
}

class _DealRoomScreenState extends State<DealRoomScreen> {
  DealModel? _deal;
  bool _isLoading = true;
  String? _feedbackMessage;
  Timer? _pollingTimer;

  @override
  void initState() {
    super.initState();
    _fetchDeal();
    _startPolling();
  }

  void _startPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(milliseconds: 2500), (_) {
      _pollDealSilent();
    });
  }

  Future<void> _fetchDeal() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final deal = await DealService.instance.fetchDealById(widget.dealId);
      if (!mounted) return;
      setState(() {
        _deal = deal;
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi tải deal: $e'),
          backgroundColor: const Color(0xFFF43F5E),
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _pollDealSilent() async {
    try {
      final updated = await DealService.instance.fetchDealById(widget.dealId);
      if (!mounted) return;

      if (_deal != null &&
          _deal!.state == DealState.pending &&
          (updated.state == DealState.deposited ||
              updated.state == DealState.inInspection)) {
        _onAutoUnlockVault(updated);
      }

      setState(() {
        _deal = updated;
      });
    } catch (_) {
      // Polling silent error suppression
    }
  }

  Future<void> _onAutoUnlockVault(DealModel deal) async {
    try {
      final vault = await DealService.instance.unlockDealVault(deal.id);
      if (!mounted) return;
      VaultModal.show(
        context: context,
        deal: deal,
        vaultData: vault,
        onSettle: _handleSettle,
        onDispute: () => widget.onOpenDispute(deal.id),
      );
    } catch (_) {}
  }

  Future<void> _handleBargainSubmit(double newPrice) async {
    if (_deal == null) return;
    try {
      await DealService.instance.proposeBargain(
        dealId: _deal!.id,
        offerPrice: newPrice,
      );
      if (!mounted) return;
      setState(() {
        _feedbackMessage = '✓ Đã gửi đề xuất giá mới thành công!';
      });
      Future.delayed(const Duration(seconds: 3), () {
        if (mounted) {
          setState(() {
            _feedbackMessage = null;
          });
        }
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi đề xuất giá: $e'),
          backgroundColor: const Color(0xFFF43F5E),
        ),
      );
    }
  }

  Future<void> _handleOpenVault() async {
    if (_deal == null) return;
    try {
      final vault = await DealService.instance.unlockDealVault(_deal!.id);
      if (!mounted) return;
      VaultModal.show(
        context: context,
        deal: _deal!,
        vaultData: vault,
        onSettle: _handleSettle,
        onDispute: () => widget.onOpenDispute(_deal!.id),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi mở két số: $e'),
          backgroundColor: const Color(0xFFF43F5E),
        ),
      );
    }
  }

  Future<void> _handleSettle() async {
    if (_deal == null) return;
    try {
      await DealService.instance.settleEscrowDeal(_deal!.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('✓ Đã xác nhận nhận hàng và giải ngân thành công!'),
          backgroundColor: Color(0xFF10B981),
        ),
      );
      _fetchDeal();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi giải ngân: $e'),
          backgroundColor: const Color(0xFFF43F5E),
        ),
      );
    }
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading && _deal == null) {
      return const Scaffold(
        backgroundColor: Color(0xFF080C14),
        body: Center(
          child: CircularProgressIndicator(color: Color(0xFF22D3EE)),
        ),
      );
    }

    if (_deal == null) {
      return Scaffold(
        backgroundColor: const Color(0xFF080C14),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Không tìm thấy giao dịch',
                  style: TextStyle(color: Colors.white)),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: widget.onBack,
                child: const Text('Quay lại'),
              ),
            ],
          ),
        ),
      );
    }

    final deal = _deal!;
    final isPending = deal.state == DealState.pending;
    final hasDeposited = deal.state == DealState.deposited ||
        deal.state == DealState.inInspection;

    return Scaffold(
      backgroundColor: const Color(0xFF080C14),
      appBar: AppBar(
        backgroundColor: const Color(0xFF080C14),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: widget.onBack,
        ),
        title: Text(
          'Deal: ${deal.id.length > 8 ? deal.id.substring(0, 8) : deal.id}',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.bold,
            fontFamily: 'monospace',
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_feedbackMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF064E3B).withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFF10B981)),
                  ),
                  child: Text(
                    _feedbackMessage!,
                    style: const TextStyle(
                      color: Color(0xFF34D399),
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
              ],

              // Deal Summary Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF1E293B)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            deal.title,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color:
                                const Color(0xFF0891B2).withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(999),
                            border: Border.all(color: const Color(0xFF06B6D4)),
                          ),
                          child: Text(
                            deal.state.label,
                            style: const TextStyle(
                              color: Color(0xFF22D3EE),
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'monospace',
                            ),
                          ),
                        ),
                      ],
                    ),
                    if (deal.description != null &&
                        deal.description!.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(
                        deal.description!,
                        style: const TextStyle(
                            color: Color(0xFF94A3B8), fontSize: 12),
                      ),
                    ],
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Thời hạn đồng kiểm:',
                          style:
                              TextStyle(color: Color(0xFF64748B), fontSize: 12),
                        ),
                        Text(
                          '${deal.inspectionDuration ~/ 3600} Giờ',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Pending State: Bargain Slider & VietQR Payment View
              if (isPending) ...[
                BargainSlider(
                  dealId: deal.id,
                  basePrice: deal.amount,
                  currentUserId: deal.buyerId ?? 'buyer_current_user',
                  onOfferSubmit: _handleBargainSubmit,
                ),
                const SizedBox(height: 16),
                VietQrPaymentView(
                  bankName: 'MBBank',
                  bin: '970422',
                  accountNo: '0385966888',
                  accountName: 'TRUSTPASSZ ESCROW',
                  amount: deal.amount,
                  memo:
                      'TPZ ${deal.id.length > 8 ? deal.id.substring(0, 8).toUpperCase() : deal.id}',
                  deepLink:
                      'vietqr://pay?acc=0385966888&bin=970422&amount=${deal.amount.toInt()}&memo=TPZ${deal.id.length > 8 ? deal.id.substring(0, 8) : deal.id}',
                ),
              ],

              // Deposited State: Digital Vault Banner & Actions
              if (hasDeposited) ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF064E3B).withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                        color: const Color(0xFF10B981).withValues(alpha: 0.5)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.verified_user,
                              color: Color(0xFF10B981), size: 22),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Tiền Ký Quỹ Đã Được Khóa An Toàn',
                              style: TextStyle(
                                color: Color(0xFF34D399),
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Két số Digital Vault đã được mở khóa. Bạn có thể kiểm tra nội dung/license key và xác nhận giải ngân.',
                        style:
                            TextStyle(color: Color(0xFFCBD5E1), fontSize: 12),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _handleOpenVault,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF10B981),
                          foregroundColor: const Color(0xFF020617),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        child: const Text(
                          'Mở Két Số Digital Vault',
                          style: TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
