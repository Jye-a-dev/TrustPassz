import 'package:flutter/material.dart';
import '../../theme/app_tokens.dart';

/// Modal 05: 6-Digit PIN & Biometric Face ID / Touch ID Vault Unlock Sheet.
class VaultUnlockSheet extends StatefulWidget {
  final VoidCallback onAuthenticated;

  const VaultUnlockSheet({super.key, required this.onAuthenticated});

  static Future<bool?> show(
    BuildContext context, {
    required VoidCallback onAuthenticated,
  }) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => VaultUnlockSheet(onAuthenticated: onAuthenticated),
    );
  }

  @override
  State<VaultUnlockSheet> createState() => _VaultUnlockSheetState();
}

class _VaultUnlockSheetState extends State<VaultUnlockSheet> {
  String _pin = '';
  bool _isVerifyingBiometric = false;

  void _appendDigit(String digit) {
    if (_pin.length >= 6) return;
    setState(() {
      _pin += digit;
    });
  }

  void _backspace() {
    if (_pin.isEmpty) return;
    setState(() {
      _pin = _pin.substring(0, _pin.length - 1);
    });
  }

  Future<void> _triggerBiometric() async {
    setState(() => _isVerifyingBiometric = true);
    await Future<void>.delayed(const Duration(milliseconds: 350));
    if (!mounted) return;
    Navigator.of(context).pop(true);
    widget.onAuthenticated();
  }

  void _confirmPin() {
    if (_pin.length < 6) return;
    Navigator.of(context).pop(true);
    widget.onAuthenticated();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.tp;
    final canSubmit = _pin.length == 6;

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
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Xác Thực Mở Khóa Két Số',
                  style: TextStyle(
                    color: c.textPrimary,
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(
                  width: 44,
                  height: 44,
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(false),
                    style: OutlinedButton.styleFrom(
                      padding: EdgeInsets.zero,
                      minimumSize: const Size(44, 44),
                      backgroundColor: c.surfaceSubtle,
                      side: BorderSide(color: c.border),
                      shape: const CircleBorder(),
                    ),
                    child: Icon(Icons.close_rounded, size: 18, color: c.textMuted),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Center(
              child: Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: c.cyanSoft,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppTokens.cyan, width: 2),
                ),
                child: _isVerifyingBiometric
                    ? const Padding(
                        padding: EdgeInsets.all(16),
                        child: CircularProgressIndicator(
                          strokeWidth: 2.5,
                          color: AppTokens.cyan,
                        ),
                      )
                    : Icon(Icons.fingerprint_rounded, color: c.cyanText, size: 32),
              ),
            ),
            const SizedBox(height: 10),
            Text(
              'Nhập mã PIN cá nhân 6 số hoặc sử dụng Face ID / Touch ID',
              textAlign: TextAlign.center,
              style: TextStyle(color: c.textMuted, fontSize: 12),
            ),
            const SizedBox(height: 14),

            // 6 PIN Dots
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(6, (index) {
                final filled = index < _pin.length;
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  margin: const EdgeInsets.symmetric(horizontal: 6),
                  width: 14,
                  height: 14,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: filled ? AppTokens.emerald : c.surfaceSubtle,
                    border: Border.all(
                      color: filled ? AppTokens.emeraldDark : c.borderStrong,
                    ),
                  ),
                );
              }),
            ),
            const SizedBox(height: 16),

            // 3x4 Numeric Keypad with >= 48px touch targets & borders
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 300),
              child: Column(
                children: [
                  _keypadRow(c, ['1', '2', '3']),
                  const SizedBox(height: 8),
                  _keypadRow(c, ['4', '5', '6']),
                  const SizedBox(height: 8),
                  _keypadRow(c, ['7', '8', '9']),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: SizedBox(
                          height: 48,
                          child: OutlinedButton(
                            onPressed: _triggerBiometric,
                            style: AppTokens.outlinedButtonStyle(
                              c,
                              foregroundColor: c.cyanText,
                              borderColor: c.cyanBorder,
                              backgroundColor: c.cyanSoft,
                              minHeight: 48,
                            ),
                            child: const Text(
                              'Face ID',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(child: _digitButton(c, '0')),
                      const SizedBox(width: 8),
                      Expanded(
                        child: SizedBox(
                          height: 48,
                          child: OutlinedButton(
                            onPressed: _backspace,
                            style: AppTokens.outlinedButtonStyle(
                              c,
                              foregroundColor: c.textMuted,
                              minHeight: 48,
                            ),
                            child: const Icon(Icons.backspace_outlined, size: 18),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            ElevatedButton(
              onPressed: canSubmit ? _confirmPin : null,
              style: AppTokens.primaryButtonStyle(c),
              child: Text(
                canSubmit
                    ? 'Giải Mã Ngay (Khớp PIN)'
                    : 'Nhập đủ 6 số hoặc chạm Face ID',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _keypadRow(AppColorPalette c, List<String> digits) {
    return Row(
      children: [
        Expanded(child: _digitButton(c, digits[0])),
        const SizedBox(width: 8),
        Expanded(child: _digitButton(c, digits[1])),
        const SizedBox(width: 8),
        Expanded(child: _digitButton(c, digits[2])),
      ],
    );
  }

  Widget _digitButton(AppColorPalette c, String digit) {
    return SizedBox(
      height: 48,
      child: OutlinedButton(
        onPressed: () => _appendDigit(digit),
        style: AppTokens.outlinedButtonStyle(
          c,
          backgroundColor: c.surfaceSubtle,
          minHeight: 48,
        ),
        child: Text(
          digit,
          style: AppTokens.monoStyle(
            color: c.textPrimary,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}
