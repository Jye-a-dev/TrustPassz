import 'package:flutter/material.dart';
import '../../theme/app_tokens.dart';
import '../../utils/formatters.dart';
import 'vietqr_matrix_card.dart';

/// Displays VietQR Napas 247 matrix and copyable bank credentials.
class VietQrCodeDisplay extends StatelessWidget {
  final String bankName;
  final String bin;
  final String accountNo;
  final String accountName;
  final double amount;
  final String memo;
  final String? qrImageUrl;
  final bool showFallbackUI;
  final String? copiedField;
  final Future<void> Function(String text, String fieldName, String label)
      onCopy;

  const VietQrCodeDisplay({
    super.key,
    required this.bankName,
    required this.bin,
    required this.accountNo,
    required this.accountName,
    required this.amount,
    required this.memo,
    this.qrImageUrl,
    required this.showFallbackUI,
    required this.copiedField,
    required this.onCopy,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.tp;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: c.cyanSoft,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: c.cyanBorder, width: 1.0),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'SỐ TIỀN CẦN THANH TOÁN',
                      style: AppTokens.monoStyle(
                        color: c.textMuted,
                        fontSize: 10,
                        letterSpacing: 0.4,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      TrustPasszFormatters.formatVnd(amount),
                      style: AppTokens.monoStyle(
                        color: c.cyanText,
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
              ),
              OutlinedButton.icon(
                onPressed: () =>
                    onCopy(amount.toInt().toString(), 'amount', 'số tiền'),
                icon: Icon(
                  copiedField == 'amount' ? Icons.check : Icons.copy,
                  size: 14,
                  color: c.cyanText,
                ),
                label: Text(
                  copiedField == 'amount' ? 'Đã chép' : 'Sao chép',
                  style: TextStyle(
                    color: c.cyanText,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                style: AppTokens.outlinedButtonStyle(
                  c,
                  borderColor: c.cyanBorder,
                  backgroundColor: c.surface,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        VietQrMatrixCard(qrImageUrl: qrImageUrl, seed: memo),
        const SizedBox(height: 14),
        if (showFallbackUI) ...[
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: c.amberSoft,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: c.amberBorder, width: 1.0),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.warning_amber_rounded,
                      color: c.amberText,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Không thể mở trực tiếp App Ngân Hàng (Timeout 500ms)',
                        style: TextStyle(
                          color: c.amberText,
                          fontSize: 12.5,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  'Thiết bị không hỗ trợ URL Scheme vietqr:// hoặc chưa cài app tương thích. Vui lòng chuyển khoản thủ công:',
                  style: TextStyle(color: c.amberText, fontSize: 11.5),
                ),
                const SizedBox(height: 10),
                ElevatedButton.icon(
                  onPressed: () => onCopy(accountNo, 'account', 'số tài khoản'),
                  icon: Icon(
                    copiedField == 'account' ? Icons.check : Icons.copy,
                    size: 16,
                  ),
                  label: const Text(
                    'Sao chép thông tin STK (Tự xóa sau 30s)',
                    style:
                        TextStyle(fontWeight: FontWeight.bold, fontSize: 12.5),
                  ),
                  style: AppTokens.primaryButtonStyle(
                    c,
                    backgroundColor: AppTokens.amber,
                    foregroundColor: const Color(0xFF0F172A),
                    borderColor: c.amberBorder,
                    minHeight: 44,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
        ],
        _buildInfoRow(
          c,
          label: 'Ngân hàng thụ hưởng',
          value: bankName,
          trailingBadge: 'BIN: $bin',
        ),
        const SizedBox(height: 8),
        _buildCopyableRow(
          c,
          label: 'Số tài khoản ký quỹ',
          value: accountNo,
          fieldKey: 'account',
          isMono: true,
        ),
        const SizedBox(height: 8),
        _buildInfoRow(
          c,
          label: 'Chủ tài khoản',
          value: accountName.toUpperCase(),
          leadingIcon: Icons.verified_user_outlined,
        ),
        const SizedBox(height: 8),
        _buildCopyableRow(
          c,
          label: 'Nội dung chuyển khoản (Bắt buộc chính xác)',
          value: memo,
          fieldKey: 'memo',
          isAccent: true,
          isMono: true,
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Icon(Icons.info_outline, size: 14, color: c.cyanText),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                'Dữ liệu STK và nội dung chuyển khoản tự động xóa khỏi bộ nhớ đệm sau 30 giây.',
                style: TextStyle(color: c.textMuted, fontSize: 11),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildInfoRow(
    AppColorPalette c, {
    required String label,
    required String value,
    String? trailingBadge,
    IconData? leadingIcon,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: c.surfaceSubtle,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: c.border, width: 1.0),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: TextStyle(color: c.textMuted, fontSize: 11)),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: TextStyle(
                    color: c.textPrimary,
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
          if (trailingBadge != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: c.surface,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: c.border),
              ),
              child: Text(
                trailingBadge,
                style: AppTokens.monoStyle(color: c.textMuted, fontSize: 10),
              ),
            ),
          if (leadingIcon != null)
            Icon(leadingIcon, color: c.emeraldText, size: 18),
        ],
      ),
    );
  }

  Widget _buildCopyableRow(
    AppColorPalette c, {
    required String label,
    required String value,
    required String fieldKey,
    bool isAccent = false,
    bool isMono = false,
  }) {
    final isCopied = copiedField == fieldKey;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: isAccent ? c.amberSoft : c.surfaceSubtle,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isAccent ? c.amberBorder : c.border,
          width: 1.0,
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
                    color: isAccent ? c.amberText : c.textMuted,
                    fontSize: 10.5,
                    fontWeight: isAccent ? FontWeight.bold : FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: TextStyle(
                    color: isAccent ? c.amberText : c.textPrimary,
                    fontWeight: FontWeight.bold,
                    fontSize: 14.5,
                    fontFamily: isMono ? 'monospace' : null,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          OutlinedButton.icon(
            onPressed: () => onCopy(value, fieldKey, label),
            icon: Icon(
              isCopied ? Icons.check : Icons.copy,
              size: 14,
              color: isAccent ? c.amberText : c.cyanText,
            ),
            label: Text(
              isCopied ? 'Đã chép' : 'Copy',
              style: TextStyle(
                color: isAccent ? c.amberText : c.cyanText,
                fontSize: 11.5,
                fontWeight: FontWeight.bold,
              ),
            ),
            style: AppTokens.outlinedButtonStyle(
              c,
              borderColor: isAccent ? c.amberBorder : c.cyanBorder,
              backgroundColor: c.surface,
            ),
          ),
        ],
      ),
    );
  }
}
