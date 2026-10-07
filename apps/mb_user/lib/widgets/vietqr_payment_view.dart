import 'dart:async';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/secure_clipboard_service.dart';

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
      // Race between native launcher and 500ms timeout
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

  String _formatVnd(double amount) {
    final intVal = amount.toInt();
    final chars = intVal.toString().split('').reversed.toList();
    final buffer = StringBuffer();
    for (int i = 0; i < chars.length; i++) {
      if (i > 0 && i % 3 == 0) {
        buffer.write('.');
      }
      buffer.write(chars[i]);
    }
    return '${buffer.toString().split('').reversed.join()} ₫';
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
          // Amount Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF083344).withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF06B6D4).withValues(alpha: 0.3)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'SỐ TIỀN CẦN THANH TOÁN',
                      style: TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _formatVnd(widget.amount),
                      style: const TextStyle(
                        color: Color(0xFF22D3EE),
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ],
                ),
                OutlinedButton.icon(
                  onPressed: () => _copySecure(
                    widget.amount.toInt().toString(),
                    'amount',
                    'số tiền',
                  ),
                  icon: Icon(
                    _copiedField == 'amount' ? Icons.check : Icons.copy,
                    size: 14,
                    color: const Color(0xFF22D3EE),
                  ),
                  label: const Text(
                    'Sao chép',
                    style: TextStyle(
                      color: Color(0xFF22D3EE),
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFF0891B2)),
                    backgroundColor: const Color(0xFF164E63).withValues(alpha: 0.4),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Fallback UI Banner (rendered on 500ms timeout or scheme failure)
          if (_showFallbackUI) ...[
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFF451A03).withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.6)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.warning_amber_rounded, color: Color(0xFFFBBF24), size: 20),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Không thể mở trực tiếp App Ngân Hàng (Timeout 500ms)',
                          style: TextStyle(
                            color: Color(0xFFFDE68A),
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Thiết bị không hỗ trợ URL Scheme vietqr:// hoặc chưa cài app tương thích. Vui lòng chuyển khoản thủ công:',
                    style: TextStyle(
                      color: Color(0xFFFCD34D),
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    onPressed: () => _copySecure(
                      widget.accountNo,
                      'account',
                      'số tài khoản',
                    ),
                    icon: Icon(
                      _copiedField == 'account' ? Icons.check : Icons.copy,
                      size: 16,
                    ),
                    label: const Text(
                      'Sao chép thông tin STK (Tự xóa sau 30s)',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFF59E0B),
                      foregroundColor: const Color(0xFF0F172A),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Manual Bank Details Fields
          _buildInfoRow(
            label: 'Ngân hàng thụ hưởng',
            value: widget.bankName,
            trailingBadge: 'BIN: ${widget.bin}',
          ),
          const SizedBox(height: 8),
          _buildCopyableRow(
            label: 'Số tài khoản',
            value: widget.accountNo,
            fieldKey: 'account',
            isMono: true,
          ),
          const SizedBox(height: 8),
          _buildInfoRow(
            label: 'Chủ tài khoản',
            value: widget.accountName.toUpperCase(),
            leadingIcon: Icons.verified_user_outlined,
          ),
          const SizedBox(height: 8),
          _buildCopyableRow(
            label: 'Nội dung chuyển khoản (Bắt buộc chính xác)',
            value: widget.memo,
            fieldKey: 'memo',
            isAccent: true,
            isMono: true,
          ),
          const SizedBox(height: 12),

          // Security notice
          const Row(
            children: [
              Icon(Icons.info_outline, size: 14, color: Color(0xFF22D3EE)),
              SizedBox(width: 6),
              Expanded(
                child: Text(
                  'Dữ liệu STK và cú pháp chuyển khoản được tự động xóa khỏi bộ nhớ sau 30 giây.',
                  style: TextStyle(color: Color(0xFF64748B), fontSize: 11),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Primary Launch Button
          ElevatedButton.icon(
            onPressed: _isAttemptingDeepLink ? null : _handleOpenBankingApp,
            icon: _isAttemptingDeepLink
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                  )
                : const Icon(Icons.phone_android, size: 18),
            label: Text(
              _isAttemptingDeepLink
                  ? 'Đang kết nối App Ngân Hàng...'
                  : 'Mở App Ngân Hàng Trên Điện Thoại',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF10B981),
              foregroundColor: const Color(0xFF020617),
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow({
    required String label,
    required String value,
    String? trailingBadge,
    IconData? leadingIcon,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF020617),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(color: Color(0xFF64748B), fontSize: 11),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ],
          ),
          if (trailingBadge != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                trailingBadge,
                style: const TextStyle(
                  color: Color(0xFF94A3B8),
                  fontSize: 10,
                  fontFamily: 'monospace',
                ),
              ),
            ),
          if (leadingIcon != null)
            Icon(leadingIcon, color: const Color(0xFF10B981), size: 18),
        ],
      ),
    );
  }

  Widget _buildCopyableRow({
    required String label,
    required String value,
    required String fieldKey,
    bool isAccent = false,
    bool isMono = false,
  }) {
    final isCopied = _copiedField == fieldKey;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: isAccent
            ? const Color(0xFF451A03).withValues(alpha: 0.3)
            : const Color(0xFF020617),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isAccent
              ? const Color(0xFFF59E0B).withValues(alpha: 0.4)
              : const Color(0xFF1E293B),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    color: isAccent ? const Color(0xFFFCD34D) : const Color(0xFF64748B),
                    fontSize: 10,
                    fontWeight: isAccent ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: TextStyle(
                    color: isAccent ? const Color(0xFFFBBF24) : Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                    fontFamily: isMono ? 'monospace' : null,
                  ),
                ),
              ],
            ),
          ),
          TextButton.icon(
            onPressed: () => _copySecure(value, fieldKey, label),
            icon: Icon(
              isCopied ? Icons.check : Icons.copy,
              size: 14,
              color: isAccent ? const Color(0xFFFBBF24) : const Color(0xFF38BDF8),
            ),
            label: Text(
              isCopied ? 'Đã chép' : 'Sao chép',
              style: TextStyle(
                color: isAccent ? const Color(0xFFFBBF24) : const Color(0xFF38BDF8),
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

