import 'package:flutter/material.dart';
import '../../theme/app_tokens.dart';

/// Modal 07: Hardware FIDO2 / Passkey Authentication Dialog.
class PasskeyDialog extends StatefulWidget {
  final String deviceLabel;
  final VoidCallback? onVerifyComplete;

  const PasskeyDialog({
    super.key,
    this.deviceLabel = 'Thiết bị FIDO2 / Sinh trắc học',
    this.onVerifyComplete,
  });

  static Future<void> show(
    BuildContext context, {
    String deviceLabel = 'Thiết bị FIDO2 / Sinh trắc học',
    VoidCallback? onVerifyComplete,
  }) {
    return showDialog<void>(
      context: context,
      builder: (_) => PasskeyDialog(
        deviceLabel: deviceLabel,
        onVerifyComplete: onVerifyComplete,
      ),
    );
  }

  @override
  State<PasskeyDialog> createState() => _PasskeyDialogState();
}

class _PasskeyDialogState extends State<PasskeyDialog>
    with SingleTickerProviderStateMixin {
  late final AnimationController _spinController;
  String? _statusMessage;

  @override
  void initState() {
    super.initState();
    _spinController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
  }

  @override
  void dispose() {
    _spinController.dispose();
    super.dispose();
  }

  void _handleHardwarePrompt() {
    if (widget.onVerifyComplete != null) {
      Navigator.of(context).pop();
      widget.onVerifyComplete!();
      return;
    }
    setState(() {
      _statusMessage =
          'Thiết bị ảo chưa đăng ký khóa phần cứng FIDO2 / WebAuthn. Vui lòng dùng OTP hoặc tài khoản email để xác thực.';
    });
  }

  @override
  Widget build(BuildContext context) {
    final c = context.tp;

    return Dialog(
      backgroundColor: c.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
        side: BorderSide(color: c.border, width: 1.0),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: c.cyanSoft,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTokens.cyan, width: 1.5),
                ),
                child: Icon(
                  Icons.fingerprint_rounded,
                  color: c.cyanText,
                  size: 30,
                ),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Xác Thực Passkey FIDO2',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: c.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Chạm vào cảm biến vân tay hoặc Face ID để xác thực phần cứng',
              textAlign: TextAlign.center,
              style: TextStyle(color: c.textMuted, fontSize: 12),
            ),
            const SizedBox(height: 18),

            // Animated Biometric Ring
            Center(
              child: SizedBox(
                width: 82,
                height: 82,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    RotationTransition(
                      turns: _spinController,
                      child: Container(
                        width: 82,
                        height: 82,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: AppTokens.cyan.withValues(alpha: 0.35),
                            width: 3,
                          ),
                        ),
                        child: Align(
                          alignment: Alignment.topCenter,
                          child: Container(
                            width: 14,
                            height: 4,
                            decoration: BoxDecoration(
                              color: AppTokens.cyanBright,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                        ),
                      ),
                    ),
                    Container(
                      width: 54,
                      height: 54,
                      decoration: BoxDecoration(
                        color: c.cyanSoft,
                        shape: BoxShape.circle,
                        border: Border.all(color: c.cyanBorder),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        'ID',
                        style: AppTokens.monoStyle(
                          color: c.cyanText,
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 14),
            Text(
              widget.deviceLabel,
              textAlign: TextAlign.center,
              style: AppTokens.monoStyle(color: c.cyanText, fontSize: 11),
            ),
            if (_statusMessage != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: c.amberSoft,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: c.amberBorder),
                ),
                child: Text(
                  _statusMessage!,
                  style: TextStyle(
                    color: c.amberText,
                    fontSize: 11,
                    height: 1.35,
                  ),
                ),
              ),
            ],
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _handleHardwarePrompt,
              style: AppTokens.primaryButtonStyle(c),
              child: const Text(
                'Kích Hoạt Cảm Biến Passkey',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: () => Navigator.of(context).pop(),
              style: AppTokens.outlinedButtonStyle(c),
              child: const Text(
                'Hủy Bỏ',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
