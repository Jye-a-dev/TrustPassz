import 'dart:async';
import 'package:flutter/material.dart';
import '../models/deal_model.dart';
import '../services/deal_service.dart';
import '../theme/app_tokens.dart';
import '../widgets/modals/dispute_warning_dialog.dart';
import '../widgets/modals/vault_decrypted_sheet.dart';
import '../widgets/modals/vault_unlock_sheet.dart';
import 'vault/vault_cards.dart';

/// Screen 08: Fullscreen Digital Vault & Co-Inspection Screen.
class DigitalVaultScreen extends StatefulWidget {
  final String dealId;
  final String? vaultId;
  final String? inspectionDeadline;
  final VoidCallback onBack;
  final ValueChanged<String> onOpenDispute;

  const DigitalVaultScreen({
    super.key,
    required this.dealId,
    this.vaultId,
    this.inspectionDeadline,
    required this.onBack,
    required this.onOpenDispute,
  });

  @override
  State<DigitalVaultScreen> createState() => _DigitalVaultScreenState();
}

class _DigitalVaultScreenState extends State<DigitalVaultScreen> {
  DealModel? _deal;
  bool _isLoading = true;
  bool _isSettling = false;
  String? _errorMessage;
  Timer? _countdownTimer;
  Duration _remaining = Duration.zero;
  Duration _totalWindow = const Duration(hours: 24);

  @override
  void initState() {
    super.initState();
    _loadDealAndTimer();
  }

  Future<void> _loadDealAndTimer() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final deal = await DealService.instance.fetchDealById(widget.dealId);
      if (!mounted) return;
      setState(() {
        _deal = deal;
        _totalWindow = Duration(seconds: deal.inspectionDuration);
        _isLoading = false;
      });
      _initDeadlineCountdown(
        widget.inspectionDeadline ?? deal.inspectionDeadline,
        deal.inspectionDuration,
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
      _initDeadlineCountdown(widget.inspectionDeadline, 86400);
    }
  }

  void _initDeadlineCountdown(String? isoDeadline, int fallbackDurationSec) {
    final parsed = isoDeadline != null ? DateTime.tryParse(isoDeadline) : null;
    final targetDeadline = parsed ??
        DateTime.now().toUtc().add(Duration(seconds: fallbackDurationSec));

    void update() {
      final diff = targetDeadline.difference(DateTime.now().toUtc());
      if (mounted) {
        setState(() {
          _remaining = diff.isNegative ? Duration.zero : diff;
        });
      }
    }

    update();
    _countdownTimer?.cancel();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      update();
    });
  }

  Future<void> _startUnlockFlow() async {
    await VaultUnlockSheet.show(
      context,
      onAuthenticated: _decryptAndShowSecret,
    );
  }

  Future<void> _decryptAndShowSecret() async {
    try {
      final vault = await DealService.instance.unlockDealVault(widget.dealId);
      if (!mounted) return;
      final deal = _deal ??
          DealModel(
            id: widget.dealId,
            sellerId: '',
            title: 'Két số Digital Vault',
            amount: 0,
            currency: 'VND',
            state: DealState.inInspection,
            inspectionDuration: 86400,
          );

      await VaultDecryptedSheet.show(
        context: context,
        deal: deal,
        vaultData: vault,
        onSettle: _handleSettle,
        onDispute: _openDisputeWithWarning,
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi giải mã két số: $e'),
          backgroundColor: AppTokens.rose,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _handleSettle() async {
    setState(() => _isSettling = true);
    try {
      await DealService.instance.settleEscrowDeal(widget.dealId);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('✓ Đã xác nhận nghiệm thu & giải ngân thành công!'),
          backgroundColor: AppTokens.emeraldDark,
          behavior: SnackBarBehavior.floating,
        ),
      );
      widget.onBack();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi giải ngân: $e'),
          backgroundColor: AppTokens.rose,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) setState(() => _isSettling = false);
    }
  }

  Future<void> _openDisputeWithWarning() async {
    await DisputeWarningDialog.show(
      context,
      onContinue: () => widget.onOpenDispute(widget.dealId),
    );
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.tp;
    final ratio = _totalWindow.inSeconds > 0
        ? (_remaining.inSeconds / _totalWindow.inSeconds).clamp(0.0, 1.0)
        : 0.75;

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
            Text(
              'Két Số Digital Vault',
              style: TextStyle(
                color: c.textPrimary,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              'AES-256-GCM Encrypted',
              style: AppTokens.monoStyle(color: c.cyanText, fontSize: 10.5),
            ),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: c.emeraldSoft,
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: c.emeraldBorder),
                ),
                child: Text(
                  _deal?.state.vietnameseLabel ?? 'Tiền Đã Khóa',
                  style: AppTokens.monoStyle(color: c.emeraldText, fontSize: 10),
                ),
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(color: AppTokens.cyan),
              )
            : SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_errorMessage != null) ...[
                      Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: c.roseSoft,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: c.roseBorder),
                        ),
                        child: Text(
                          _errorMessage!,
                          style: TextStyle(color: c.roseText, fontSize: 12),
                        ),
                      ),
                    ],
                    VaultCountdownCard(
                      remaining: _remaining,
                      progressRatio: ratio,
                    ),
                    const SizedBox(height: 16),
                    VaultLockedAssetCard(onUnlockTap: _startUnlockFlow),
                    const SizedBox(height: 18),
                    ElevatedButton.icon(
                      onPressed: _isSettling ? null : _handleSettle,
                      icon: const Icon(Icons.verified_rounded, size: 18),
                      label: Text(
                        _isSettling
                            ? 'Đang giải ngân...'
                            : '✓ Xác Nhận Nghiệm Thu & Giải Ngân',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13.5,
                        ),
                      ),
                      style: AppTokens.primaryButtonStyle(c),
                    ),
                    const SizedBox(height: 10),
                    OutlinedButton.icon(
                      onPressed: _openDisputeWithWarning,
                      icon: Icon(
                        Icons.gavel_rounded,
                        size: 18,
                        color: c.roseText,
                      ),
                      label: Text(
                        '⚖️ Báo Sai Hàng / Mở Khiếu Nại',
                        style: TextStyle(
                          color: c.roseText,
                          fontWeight: FontWeight.bold,
                          fontSize: 12.5,
                        ),
                      ),
                      style: AppTokens.outlinedButtonStyle(
                        c,
                        backgroundColor: c.roseSoft,
                        borderColor: c.roseBorder,
                        minHeight: 46,
                      ),
                    ),
                  ],
                ),
              ),
      ),
    );
  }
}
