import 'dart:async';
import 'package:flutter/material.dart';
import '../models/deal_model.dart';
import '../services/deal_service.dart';
import '../theme/app_tokens.dart';
import '../utils/formatters.dart';
import '../widgets/bargain_slider.dart';
import '../widgets/modals/bargain_confirm_dialog.dart';
import 'checkout_vietqr_screen.dart';
import 'deal_room/deal_audit_timeline.dart';
import 'deal_room/deal_status_badge.dart';
import 'deal_room/deal_summary_card.dart';
import 'deal_room/deal_vault_ready_card.dart';
import 'digital_vault_screen.dart';

/// Screen 06: Deal Negotiation Room V2 (Light/Dark adaptive, 4-step horizontal timeline,
/// BargainSlider with -5/-10/-15% chips, separated CheckoutVietQrScreen).
class DealRoomScreen extends StatefulWidget {
  final String dealId;
  final bool initialFocusVault;
  final VoidCallback onBack;
  final ValueChanged<String> onOpenDispute;

  const DealRoomScreen({
    super.key,
    required this.dealId,
    this.initialFocusVault = false,
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
    setState(() => _isLoading = true);
    try {
      final deal = await DealService.instance.fetchDealById(widget.dealId);
      if (!mounted) return;
      setState(() => _deal = deal);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi tải giao dịch: $e'),
          backgroundColor: AppTokens.rose,
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _pollDealSilent() async {
    try {
      final updated = await DealService.instance.fetchDealById(widget.dealId);
      if (!mounted) return;
      setState(() => _deal = updated);
    } catch (_) {}
  }

  Future<void> _handleBargainRequest(double newPrice) async {
    if (_deal == null) return;
    await BargainConfirmDialog.show(
      context,
      originalPrice: _deal!.amount,
      proposedPrice: newPrice,
      onConfirm: () => _submitBargain(newPrice),
    );
  }

  Future<void> _submitBargain(double newPrice) async {
    if (_deal == null) return;
    try {
      await DealService.instance.proposeBargain(
        dealId: _deal!.id,
        offerPrice: newPrice,
      );
      if (!mounted) return;
      setState(() => _feedbackMessage = '✓ Đã gửi đề xuất giá mới thành công!');
      Future.delayed(const Duration(seconds: 3), () {
        if (mounted) setState(() => _feedbackMessage = null);
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi gửi đề xuất giá: $e'),
          backgroundColor: AppTokens.rose,
        ),
      );
    }
  }

  void _openCheckoutVietQr(DealModel deal) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (ctx) => CheckoutVietQrScreen(
          dealId: deal.id,
          initialDeal: deal,
          onBack: () => Navigator.of(ctx).pop(),
          onOpenVault: () {
            Navigator.of(ctx).pushReplacement(
              MaterialPageRoute<void>(
                builder: (vCtx) => DigitalVaultScreen(
                  dealId: deal.id,
                  inspectionDeadline: deal.inspectionDeadline,
                  onBack: () => Navigator.of(vCtx).pop(),
                  onOpenDispute: widget.onOpenDispute,
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  void _openDigitalVault(DealModel deal) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (ctx) => DigitalVaultScreen(
          dealId: deal.id,
          inspectionDeadline: deal.inspectionDeadline,
          onBack: () => Navigator.of(ctx).pop(),
          onOpenDispute: widget.onOpenDispute,
        ),
      ),
    );
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.tp;

    if (_isLoading && _deal == null) {
      return Scaffold(
        backgroundColor: c.canvas,
        body: const Center(
          child: CircularProgressIndicator(color: AppTokens.cyan),
        ),
      );
    }

    if (_deal == null) {
      return Scaffold(
        backgroundColor: c.canvas,
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Không tìm thấy giao dịch',
                style: TextStyle(color: c.textPrimary, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: widget.onBack,
                style: AppTokens.outlinedButtonStyle(c),
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
      backgroundColor: c.canvas,
      appBar: AppBar(
        backgroundColor: c.canvas,
        leadingWidth: 60,
        leading: Padding(
          padding: const EdgeInsets.only(left: 12),
          child: Center(
            child: SizedBox(
              width: 44,
              height: 44,
              child: OutlinedButton(
                onPressed: widget.onBack,
                style: OutlinedButton.styleFrom(
                  padding: EdgeInsets.zero,
                  minimumSize: const Size(44, 44),
                  backgroundColor: c.surface,
                  side: BorderSide(color: c.border),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Icon(
                  Icons.arrow_back_rounded,
                  size: 18,
                  color: c.textPrimary,
                ),
              ),
            ),
          ),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  'Bàn Đàm Phán',
                  style: TextStyle(
                    color: c.textPrimary,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: c.cyanSoft,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: c.cyanBorder),
                  ),
                  child: Text(
                    TrustPasszFormatters.formatDealCode(deal.id),
                    style: AppTokens.monoStyle(color: c.cyanText, fontSize: 9.5),
                  ),
                ),
              ],
            ),
            Text(
              'Đối tác: ${deal.sellerName ?? "Thành viên eKYC (Uy tín 99.8%)"}',
              style: AppTokens.monoStyle(
                color: c.textMuted,
                fontSize: 10,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Center(child: DealStatusBadge(state: deal.state)),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_feedbackMessage != null) ...[
                Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: c.emeraldSoft,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: c.emeraldBorder),
                  ),
                  child: Text(
                    _feedbackMessage!,
                    style: TextStyle(
                      color: c.emeraldText,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
              DealAuditTimeline(deal: deal),
              const SizedBox(height: 14),
              DealSummaryCard(deal: deal),
              const SizedBox(height: 14),
              if (isPending) ...[
                BargainSlider(
                  dealId: deal.id,
                  basePrice: deal.amount,
                  currentUserId: deal.buyerId ?? 'buyer_current_user',
                  onOfferSubmit: _handleBargainRequest,
                ),
                const SizedBox(height: 12),
                OutlinedButton(
                  onPressed: () => _openCheckoutVietQr(deal),
                  style: AppTokens.outlinedButtonStyle(c, minHeight: 46),
                  child: const Text(
                    'Chấp Nhận Giá Gốc & Thanh Toán VietQR',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                  ),
                ),
              ],
              if (hasDeposited) ...[
                DealVaultReadyCard(
                  highlighted: widget.initialFocusVault,
                  onOpenVault: () => _openDigitalVault(deal),
                ),
              ],
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
