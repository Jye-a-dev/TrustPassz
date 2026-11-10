import 'dart:async';
import 'package:flutter/material.dart';
import '../../models/deal_model.dart';
import '../../services/secure_clipboard_service.dart';
import '../../theme/app_tokens.dart';

/// Modal 09: Decrypted Digital Vault Sheet with 30-second RAM & clipboard self-destruct progress bar.
class VaultDecryptedSheet extends StatefulWidget {
  final DealModel deal;
  final UnlockedVaultPayload vaultData;
  final VoidCallback onSettle;
  final VoidCallback onDispute;

  const VaultDecryptedSheet({
    super.key,
    required this.deal,
    required this.vaultData,
    required this.onSettle,
    required this.onDispute,
  });

  static Future<void> show({
    required BuildContext context,
    required DealModel deal,
    required UnlockedVaultPayload vaultData,
    required VoidCallback onSettle,
    required VoidCallback onDispute,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => VaultDecryptedSheet(
        deal: deal,
        vaultData: vaultData,
        onSettle: onSettle,
        onDispute: onDispute,
      ),
    );
  }

  @override
  State<VaultDecryptedSheet> createState() => _VaultDecryptedSheetState();
}

class _VaultDecryptedSheetState extends State<VaultDecryptedSheet> {
  static const int _maxSeconds = 30;
  String? _ephemeralSecret;
  int _remainingSeconds = _maxSeconds;
  Timer? _destructTimer;

  @override
  void initState() {
    super.initState();
    _ephemeralSecret = widget.vaultData.decryptedKeyOrUrl ??
        widget.vaultData.encryptedPayload ??
        'Khóa truy cập bảo mật hợp lệ';
    _startSelfDestructCountdown();
  }

  void _startSelfDestructCountdown() {
    _destructTimer?.cancel();
    _destructTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_remainingSeconds <= 1) {
        timer.cancel();
        _ephemeralSecret = null;
        SecureClipboardService.instance.forceClear();
        setState(() => _remainingSeconds = 0);
      } else {
        setState(() => _remainingSeconds--);
      }
    });
  }

  @override
  void dispose() {
    _destructTimer?.cancel();
    _ephemeralSecret = null;
    super.dispose();
  }

  Future<void> _copyContent(BuildContext context, String content) async {
    final success = await SecureClipboardService.instance.copy(content);
    if (!context.mounted) return;
    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Đã sao chép khóa/nội dung! (Tự động xóa sau 30 giây bảo mật)',
          ),
          backgroundColor: AppTokens.emeraldDark,
          duration: Duration(seconds: 3),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.tp;
    final secretData =
        _ephemeralSecret ?? 'Dữ liệu đã được xóa an toàn khỏi RAM.';
    final progress = _remainingSeconds / _maxSeconds;

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 24),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        border: Border.all(color: c.border, width: 1.0),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 38,
                height: 4,
                decoration: BoxDecoration(
                  color: c.borderStrong,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 14),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Row(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: c.emeraldSoft,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: c.emeraldBorder),
                        ),
                        child: Icon(
                          Icons.check_rounded,
                          color: c.emeraldText,
                          size: 18,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Két Số Digital Vault (AES-256-GCM)',
                          style: TextStyle(
                            color: c.textPrimary,
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
                SizedBox(
                  width: 44,
                  height: 44,
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    style: OutlinedButton.styleFrom(
                      padding: EdgeInsets.zero,
                      minimumSize: const Size(44, 44),
                      backgroundColor: c.surfaceSubtle,
                      side: BorderSide(color: c.border),
                      shape: const CircleBorder(),
                    ),
                    child:
                        Icon(Icons.close_rounded, size: 18, color: c.textMuted),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // 30s Self-Destruct Bar
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Tự hủy sau: ${_remainingSeconds}s',
                  style: AppTokens.monoStyle(color: c.amberText, fontSize: 11),
                ),
                Text(
                  'RAM Cleared Protection',
                  style: AppTokens.monoStyle(color: c.amberText, fontSize: 11),
                ),
              ],
            ),
            const SizedBox(height: 6),
            ClipRRect(
              borderRadius: BorderRadius.circular(999),
              child: LinearProgressIndicator(
                value: progress.clamp(0.0, 1.0),
                minHeight: 6,
                backgroundColor: c.surfaceSubtle,
                valueColor:
                    const AlwaysStoppedAnimation<Color>(AppTokens.amber),
              ),
            ),
            const SizedBox(height: 14),

            // Decrypted Payload Card
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: c.canvas,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: c.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          widget.vaultData.fileName,
                          style: TextStyle(
                            color: c.textPrimary,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: c.emeraldSoft,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: c.emeraldBorder),
                        ),
                        child: Text(
                          widget.vaultData.assetType,
                          style: AppTokens.monoStyle(
                            color: c.emeraldText,
                            fontSize: 10,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: c.surface,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: c.borderStrong),
                    ),
                    child: SelectableText(
                      secretData,
                      style: AppTokens.monoStyle(
                        color: c.cyanText,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Align(
                    alignment: Alignment.centerRight,
                    child: OutlinedButton.icon(
                      onPressed: _ephemeralSecret == null
                          ? null
                          : () => _copyContent(context, secretData),
                      icon:
                          Icon(Icons.copy_rounded, size: 15, color: c.cyanText),
                      label: Text(
                        'Sao chép (Tự xóa sau 30s)',
                        style: TextStyle(
                          color: c.cyanText,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      style: AppTokens.outlinedButtonStyle(
                        c,
                        borderColor: c.cyanBorder,
                        backgroundColor: c.cyanSoft,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                widget.onSettle();
              },
              style: AppTokens.primaryButtonStyle(c),
              child: const Text(
                '✓ Xác Nhận Đúng Hàng & Giải Ngân',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
            ),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: () {
                Navigator.of(context).pop();
                widget.onDispute();
              },
              style: AppTokens.outlinedButtonStyle(
                c,
                foregroundColor: c.roseText,
                borderColor: c.roseBorder,
                backgroundColor: c.roseSoft,
                minHeight: 46,
              ),
              child: const Text(
                '⚖️ Báo Cáo Sai Hàng / Khiếu Nại Trọng Tài AI',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
