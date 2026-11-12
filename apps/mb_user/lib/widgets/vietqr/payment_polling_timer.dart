import 'dart:async';
import 'package:flutter/material.dart';
import '../../models/deal_model.dart';
import '../../services/deal_service.dart';
import '../../theme/app_tokens.dart';
import '../../utils/formatters.dart';

/// Manages countdown timer and background polling for VietQR DEPOSITED confirmation.
class PaymentPollingTimer extends StatefulWidget {
  final String? dealId;
  final int timeoutSeconds;
  final Duration pollingInterval;
  final VoidCallback? onDepositedConfirmed;
  final VoidCallback? onTimeout;

  const PaymentPollingTimer({
    super.key,
    this.dealId,
    this.timeoutSeconds = 900,
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
      // Ignore background poll error silently
    }
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
    final isWarning = _remainingSeconds < 180;

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: isWarning ? c.amberSoft : c.cyanSoft,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isWarning ? c.amberBorder : c.cyanBorder,
          width: 1.0,
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
                  color: isWarning ? c.amberText : c.cyanText,
                ),
              ),
              const SizedBox(width: 10),
              Text(
                'Chờ quét mã VietQR...',
                style: TextStyle(
                  color: isWarning ? c.amberText : c.cyanText,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: c.surface,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: isWarning ? c.amberBorder : c.cyanBorder,
              ),
            ),
            child: Text(
              TrustPasszFormatters.formatMmSs(_remainingSeconds),
              style: AppTokens.monoStyle(
                color: isWarning ? c.amberText : c.cyanText,
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
