import 'dart:async';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/deal_model.dart';
import '../services/deal_service.dart';
import '../services/secure_clipboard_service.dart';
import '../theme/app_tokens.dart';
import '../utils/formatters.dart';
import '../widgets/modals/transfer_success_sheet.dart';
import '../widgets/vietqr/vietqr_code_display.dart';

/// Screen 07: Dedicated VietQR Napas 24/7 Checkout Screen with 15-min countdown,
/// 500ms deep-link timeout fallback banner, and live deposit polling.
class CheckoutVietQrScreen extends StatefulWidget {
  final String dealId;
  final DealModel? initialDeal;
  final double? overrideAmount;
  final VoidCallback? onBack;
  final VoidCallback? onOpenVault;

  const CheckoutVietQrScreen({
    super.key,
    required this.dealId,
    this.initialDeal,
    this.overrideAmount,
    this.onBack,
    this.onOpenVault,
  });

  @override
  State<CheckoutVietQrScreen> createState() => _CheckoutVietQrScreenState();
}

class _CheckoutVietQrScreenState extends State<CheckoutVietQrScreen> {
  DealModel? _deal;
  VietQrCheckoutData? _checkoutData;
  bool _isLoading = true;
  bool _isAttemptingDeepLink = false;
  bool _showFallbackUI = false;
  bool _isCheckingPayment = false;
  bool _confirmedDialogShown = false;
  String? _copiedField;
  int _remainingSeconds = 900; // 15 minutes
  Timer? _countdownTimer;
  Timer? _pollingTimer;

  @override
  void initState() {
    super.initState();
    _deal = widget.initialDeal;
    _initCheckout();
    _startTimers();
  }

  Future<void> _initCheckout() async {
    try {
      final dealFuture = _deal != null
          ? Future.value(_deal!)
          : DealService.instance.fetchDealById(widget.dealId);
      final deal = await dealFuture;

      VietQrCheckoutData? qrData;
      try {
        qrData = await DealService.instance.createVietQrCheckout(widget.dealId);
      } catch (_) {
        // Fallback gracefully to deal metadata if PayOS endpoint requires buyer session
      }

      if (!mounted) return;
      setState(() {
        _deal = deal;
        _checkoutData = qrData;
        _isLoading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _startTimers() {
    _countdownTimer?.cancel();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_remainingSeconds > 0) {
        setState(() => _remainingSeconds--);
      } else {
        timer.cancel();
        _pollingTimer?.cancel();
      }
    });

    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(milliseconds: 2500), (_) {
      _checkDepositStatus(silent: true);
    });
  }

  Future<void> _checkDepositStatus({bool silent = false}) async {
    if (_confirmedDialogShown || _isCheckingPayment) return;
    if (!silent) setState(() => _isCheckingPayment = true);

    try {
      final deal = await DealService.instance.fetchDealById(widget.dealId);
      if (!mounted) return;
      setState(() => _deal = deal);

      if (deal.state == DealState.deposited ||
          deal.state == DealState.inInspection ||
          deal.state == DealState.settled) {
        _showSuccessSheet(deal);
      } else if (!silent) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Hệ thống đang chờ đối soát giao dịch Napas 24/7. Vui lòng thử lại sau ít giây.',
            ),
            backgroundColor: AppTokens.amber,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (!silent && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Không thể kiểm tra trạng thái nạp tiền: $e'),
            backgroundColor: AppTokens.rose,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (!silent && mounted) setState(() => _isCheckingPayment = false);
    }
  }

  void _showSuccessSheet(DealModel deal) {
    if (_confirmedDialogShown || !mounted) return;
    _confirmedDialogShown = true;
    _countdownTimer?.cancel();
    _pollingTimer?.cancel();

    TransferSuccessSheet.show(
      context,
      dealId: deal.id,
      amount: widget.overrideAmount ?? deal.amount,
      txHash: deal.primaryTxHash,
      onOpenVault: () {
        if (widget.onOpenVault != null) {
          widget.onOpenVault!();
        } else {
          Navigator.of(context).pop(true);
        }
      },
    );
  }

  Future<void> _handleOpenBankingApp(String deepLink) async {
    setState(() {
      _isAttemptingDeepLink = true;
      _showFallbackUI = false;
    });

    bool didLaunch = false;
    try {
      final uri = Uri.parse(deepLink);
      final launchFuture = launchUrl(
        uri,
        mode: LaunchMode.externalApplication,
      );
      final timeoutFuture = Future.delayed(
        const Duration(milliseconds: 500),
        () => false,
      );
      final res = await Future.any([launchFuture, timeoutFuture]);
      didLaunch = (res == true);
    } catch (_) {
      didLaunch = false;
    }

    if (!mounted) return;
    setState(() {
      _isAttemptingDeepLink = false;
      if (!didLaunch) _showFallbackUI = true;
    });
  }

  Future<void> _copySecure(String text, String fieldName, String label) async {
    final ok = await SecureClipboardService.instance.copy(text);
    if (!mounted || !ok) return;
    setState(() => _copiedField = fieldName);
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Đã sao chép $label vào bộ nhớ tạm! (Tự xóa sau 30s)'),
        backgroundColor: AppTokens.emeraldDark,
        behavior: SnackBarBehavior.floating,
      ),
    );
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted && _copiedField == fieldName) {
        setState(() => _copiedField = null);
      }
    });
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _pollingTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.tp;
    final amount =
        widget.overrideAmount ?? _checkoutData?.amount ?? _deal?.amount ?? 0.0;
    final shortCode = widget.dealId.length > 8
        ? widget.dealId.substring(0, 8).toUpperCase()
        : widget.dealId.toUpperCase();
    final memo = _checkoutData?.memo ?? 'TPZ $shortCode';
    final accountNo = _checkoutData?.accountNumber ?? '0385966888';
    final bankName = _checkoutData?.bankName ?? 'VietinBank / Napas 247';
    final bin = _checkoutData?.bin ?? '970415';
    final accountName = _checkoutData?.accountName ?? 'TRUSTPASSZ ESCROW';
    final deepLink = _checkoutData?.deepLink ??
        'vietqr://pay?acc=$accountNo&bin=$bin&amount=${amount.toInt()}&memo=${Uri.encodeComponent(memo)}';

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
                onPressed: widget.onBack ?? () => Navigator.of(context).pop(),
                style: OutlinedButton.styleFrom(
                  padding: EdgeInsets.zero,
                  minimumSize: const Size(44, 44),
                  backgroundColor: c.surface,
                  side: BorderSide(color: c.border),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Icon(Icons.arrow_back_rounded,
                    size: 18, color: c.textPrimary),
              ),
            ),
          ),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Thanh Toán Ký Quỹ Napas',
              style: TextStyle(
                color: c.textPrimary,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              'Mã đơn: ${TrustPasszFormatters.formatDealCode(widget.dealId)}',
              style: AppTokens.monoStyle(
                color: c.textMuted,
                fontSize: 10.5,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: c.amberSoft,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: c.amberBorder),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.schedule_rounded, size: 14, color: c.amberText),
                    const SizedBox(width: 4),
                    Text(
                      TrustPasszFormatters.formatMmSs(_remainingSeconds),
                      style:
                          AppTokens.monoStyle(color: c.amberText, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(color: AppTokens.emerald),
              )
            : SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    VietQrCodeDisplay(
                      bankName: bankName,
                      bin: bin,
                      accountNo: accountNo,
                      accountName: accountName,
                      amount: amount,
                      memo: memo,
                      qrImageUrl: _checkoutData?.qrCodeUrl,
                      showFallbackUI: _showFallbackUI,
                      copiedField: _copiedField,
                      onCopy: _copySecure,
                    ),
                    const SizedBox(height: 16),

                    // Primary Action: Confirm Transfer
                    ElevatedButton.icon(
                      onPressed: _isCheckingPayment
                          ? null
                          : () => _checkDepositStatus(silent: false),
                      icon: _isCheckingPayment
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Color(0xFF020617),
                              ),
                            )
                          : const Icon(Icons.check_rounded, size: 18),
                      label: Text(
                        _isCheckingPayment
                            ? 'Đang đối soát Napas 24/7...'
                            : 'Tôi Đã Chuyển Khoản Thành Công',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13.5,
                        ),
                      ),
                      style: AppTokens.primaryButtonStyle(c),
                    ),
                    const SizedBox(height: 10),

                    // Secondary Action: Open Banking App (vietqr://)
                    OutlinedButton.icon(
                      onPressed: _isAttemptingDeepLink
                          ? null
                          : () => _handleOpenBankingApp(deepLink),
                      icon: Icon(
                        Icons.open_in_new_rounded,
                        size: 16,
                        color: c.cyanText,
                      ),
                      label: Text(
                        _isAttemptingDeepLink
                            ? 'Đang mở App Ngân Hàng...'
                            : 'Mở App Ngân Hàng (vietqr://)',
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 12.5,
                        ),
                      ),
                      style: AppTokens.outlinedButtonStyle(
                        c,
                        minHeight: 46,
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
      ),
    );
  }
}
