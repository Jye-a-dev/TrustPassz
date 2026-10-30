import 'dart:async';
import 'package:flutter/material.dart';
import '../../models/deal_model.dart';
import '../../services/deal_service.dart';

/// PaymentPollingTimer
/// Quản lý Timer.periodic, bộ đếm timeout và callback bắt trạng thái DEPOSITED
/// sau khi người dùng thực hiện chuyển khoản VietQR Napas 247.
class PaymentPollingTimer extends StatefulWidget {
  final String? dealId;
  final int timeoutSeconds;
  final Duration pollingInterval;
  final VoidCallback? onDepositedConfirmed;
  final VoidCallback? onTimeout;

  const PaymentPollingTimer({
    super.key,
    this.dealId,
    this.timeoutSeconds = 900, // 15 phút mặc định
    this.pollingInterval = const Duration(milliseconds: 2500),
    this.onDepositedConfirmed,
    this.onTimeout,
  });

  @override
  State<PaymentPollingTimer> createState() => _PaymentPollingTimerState();
}

class _PaymentPollingTimerState extends State<PaymentPollingTimer> {
  late int _remainingSeconds;
  Timer? _countdownTimer;
  Timer? _pollingTimer;
  bool _isDeposited = false;

  @override
  void initState() {
    super.initState();
    _remainingSeconds = widget.timeoutSeconds;
    _startCountdown();
    _startPolling();
  }

  void _startCountdown() {
    _countdownTimer?.cancel();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      if (_remainingSeconds > 0) {
        setState(() {
          _remainingSeconds--;
        });
      } else {
        timer.cancel();
        _pollingTimer?.cancel();
        widget.onTimeout?.call();
      }
    });
  }

  void _startPolling() {
    if (widget.dealId == null || widget.dealId!.isEmpty) return;

    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(widget.pollingInterval, (_) {
      _checkPaymentStatus();
    });
  }

  Future<void> _checkPaymentStatus() async {
    if (_isDeposited || widget.dealId == null) return;

    try {
      final deal = await DealService.instance.fetchDealById(widget.dealId!);
      if (!mounted) return;

      if (deal.state == DealState.deposited ||
          deal.state == DealState.inInspection ||
          deal.state == DealState.settled) {
        _isDeposited = true;
        _countdownTimer?.cancel();
        _pollingTimer?.cancel();
        widget.onDepositedConfirmed?.call();
      }
    } catch (_) {
      // Bỏ qua lỗi polling mạng ngầm để tránh ngắt quãng giao diện
    }
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _pollingTimer?.cancel();
    super.dispose();
  }

  String _formatDuration(int seconds) {
    final m = (seconds ~/ 60).toString().padLeft(2, '0');
    final s = (seconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    final isWarning = _remainingSeconds < 180;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: isWarning
            ? const Color(0xFF451A03).withValues(alpha: 0.4)
            : const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isWarning
              ? const Color(0xFFF59E0B).withValues(alpha: 0.6)
              : const Color(0xFF0284C7).withValues(alpha: 0.4),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              SizedBox(
                width: 14,
                height: 14,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: isWarning
                      ? const Color(0xFFF59E0B)
                      : const Color(0xFF38BDF8),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                'Chờ quét mã VietQR...',
                style: TextStyle(
                  color: isWarning
                      ? const Color(0xFFFCD34D)
                      : const Color(0xFF94A3B8),
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: isWarning
                  ? const Color(0xFF78350F)
                  : const Color(0xFF0369A1).withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              _formatDuration(_remainingSeconds),
              style: TextStyle(
                color: isWarning
                    ? const Color(0xFFFEF08A)
                    : const Color(0xFF38BDF8),
                fontSize: 12,
                fontWeight: FontWeight.bold,
                fontFamily: 'monospace',
              ),
            ),
          ),
        ],
      ),
    );
  }
}

