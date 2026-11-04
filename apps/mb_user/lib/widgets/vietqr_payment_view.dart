import 'dart:async';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/secure_clipboard_service.dart';
import 'vietqr/payment_polling_timer.dart';
import 'vietqr/vietqr_code_display.dart';

/// VietQR Payment View with 500ms deep link timeout and Fallback UI.
/// Specifically handles legacy mobile devices where `vietqr://` schemes fail silently.
class VietQrPaymentView extends StatefulWidget {
  final String bankName;
  final String bin;
  final String accountNo;
  final String accountName;
  final double amount;
  final String memo;
  final String deepLink;
  final String? qrImageUrl;
  final String? dealId;
  final VoidCallback? onPaymentConfirmed;

  const VietQrPaymentView({
    super.key,
    required this.bankName,
    required this.bin,
    required this.accountNo,
    required this.accountName,
    required this.amount,
    required this.memo,
    required this.deepLink,
    this.qrImageUrl,
    this.dealId,
    this.onPaymentConfirmed,
  });

  @override
  State<VietQrPaymentView> createState() => _VietQrPaymentViewState();
}

class _VietQrPaymentViewState extends State<VietQrPaymentView> {
  bool _isAttemptingDeepLink = false;
  bool _showFallbackUI = false;
  String? _copiedField;

  /// Attempts URL scheme invocation with strict 500ms timeout threshold
  Future<void> _handleOpenBankingApp() async {
    setState(() {
      _isAttemptingDeepLink = true;
      _showFallbackUI = false;
    });

    final uri = Uri.parse(widget.deepLink);
    bool didLaunch = false;

    try {
      final launchFuture = launchUrl(
        uri,
        mode: LaunchMode.externalApplication,
      );

      final timeoutFuture = Future.delayed(
        const Duration(milliseconds: 500),
        () => false,
      );

      final result = await Future.any([launchFuture, timeoutFuture]);
      didLaunch = (result == true);
    } catch (_) {
      didLaunch = false;
    }

    if (!mounted) return;

    setState(() {
      _isAttemptingDeepLink = false;
      if (!didLaunch) {
        _showFallbackUI = true;
      }
    });
  }

  Future<void> _copySecure(String text, String fieldName, String label) async {
    final success = await SecureClipboardService.instance.copy(text);
    if (!mounted) return;

    if (success) {
      setState(() {
        _copiedField = fieldName;
      });

      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Đã sao chép $label! (Tự động xóa sau 30 giây)'),
          backgroundColor: const Color(0xFF0F766E),
          duration: const Duration(seconds: 3),
          behavior: SnackBarBehavior.floating,
        ),
      );

      Future.delayed(const Duration(seconds: 2), () {
        if (mounted && _copiedField == fieldName) {
          setState(() {
            _copiedField = null;
          });
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Polling Timer & Webhook Listener
          PaymentPollingTimer(
            dealId: widget.dealId,
            onDepositedConfirmed: widget.onPaymentConfirmed,
          ),

          // Code display & copyable bank credentials
          VietQrCodeDisplay(
            bankName: widget.bankName,
            bin: widget.bin,
            accountNo: widget.accountNo,
            accountName: widget.accountName,
            amount: widget.amount,
            memo: widget.memo,
            qrImageUrl: widget.qrImageUrl,
            showFallbackUI: _showFallbackUI,
            copiedField: _copiedField,
            onCopy: _copySecure,
          ),
          const SizedBox(height: 16),

          // Primary Launch Button
          ElevatedButton.icon(
            onPressed: _isAttemptingDeepLink ? null : _handleOpenBankingApp,
            icon: _isAttemptingDeepLink
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.black),
                  )
                : const Icon(Icons.phone_android, size: 18),
            label: Text(
              _isAttemptingDeepLink
                  ? 'Đang kết nối App Ngân Hàng...'
                  : 'Mở App Ngân Hàng Trên Điện Thoại',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ),
            style: ElevatedButton.styleFrom(
              minimumSize: const Size.fromHeight(48),
              backgroundColor: const Color(0xFF10B981),
              foregroundColor: const Color(0xFF020617),
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
            ),
          ),
        ],
      ),
    );
  }
}
