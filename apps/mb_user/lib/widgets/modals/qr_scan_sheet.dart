import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../theme/app_tokens.dart';

/// Modal 01: VietQR & Deal QR Scanner Bottom Sheet with animated laser viewfinder.
class QrScanSheet extends StatefulWidget {
  final ValueChanged<String>? onCodeScanned;

  const QrScanSheet({super.key, this.onCodeScanned});

  static Future<String?> show(
    BuildContext context, {
    ValueChanged<String>? onCodeScanned,
  }) {
    return showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => QrScanSheet(onCodeScanned: onCodeScanned),
    );
  }

  @override
  State<QrScanSheet> createState() => _QrScanSheetState();
}

class _QrScanSheetState extends State<QrScanSheet>
    with SingleTickerProviderStateMixin {
  late final AnimationController _laserController;
  final TextEditingController _manualCodeController = TextEditingController();
  final ImagePicker _picker = ImagePicker();
  bool _flashEnabled = false;
  String? _statusNote;

  @override
  void initState() {
    super.initState();
    _laserController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2400),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _laserController.dispose();
    _manualCodeController.dispose();
    super.dispose();
  }

  Future<void> _pickFromAlbum() async {
    try {
      final image = await _picker.pickImage(source: ImageSource.gallery);
      if (!mounted || image == null) return;
      setState(() {
        _statusNote = 'Đã nạp ảnh QR: ${image.name}';
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _statusNote = 'Không thể truy cập thư viện ảnh trên thiết bị này.';
      });
    }
  }

  void _submitManualCode() {
    final code = _manualCodeController.text.trim();
    if (code.isEmpty) return;
    widget.onCodeScanned?.call(code);
    Navigator.of(context).pop(code);
  }

  @override
  Widget build(BuildContext context) {
    final c = context.tp;
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: Container(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
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
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: c.borderStrong,
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 34,
                        height: 34,
                        decoration: BoxDecoration(
                          color: c.cyanSoft,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: c.cyanBorder),
                        ),
                        child: Icon(
                          Icons.qr_code_scanner_rounded,
                          color: c.cyanText,
                          size: 18,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        'Quét Mã VietQR / Giao Dịch',
                        style: TextStyle(
                          color: c.textPrimary,
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
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
                      child: Icon(
                        Icons.close_rounded,
                        size: 18,
                        color: c.textMuted,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Viewfinder with Animated Cyan Laser Beam
              Container(
                height: 210,
                decoration: BoxDecoration(
                  color: const Color(0xFF020617),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFF334155), width: 1.5),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // Inner guide target box
                      Container(
                        width: 164,
                        height: 164,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: AppTokens.cyan.withValues(alpha: 0.55),
                            width: 1.5,
                          ),
                        ),
                        alignment: Alignment.center,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.65),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: AppTokens.cyan.withValues(alpha: 0.4),
                            ),
                          ),
                          child: Text(
                            _flashEnabled
                                ? 'Đèn Flash Đang Bật • Căn mã QR'
                                : 'Căn chỉnh mã QR vào khung',
                            style: AppTokens.monoStyle(
                              color: AppTokens.cyanBright,
                              fontSize: 10,
                            ),
                          ),
                        ),
                      ),
                      // 4 Corner Brackets
                      Positioned.fill(
                        child: CustomPaint(painter: _ViewfinderCornersPainter()),
                      ),
                      // Animated Laser Scan Line
                      AnimatedBuilder(
                        animation: _laserController,
                        builder: (context, child) {
                          final topOffset = 14.0 + (_laserController.value * 180.0);
                          return Positioned(
                            top: topOffset,
                            left: 16,
                            right: 16,
                            child: Container(
                              height: 2.5,
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [
                                    Colors.transparent,
                                    AppTokens.cyanBright,
                                    Colors.transparent,
                                  ],
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: AppTokens.cyan.withValues(alpha: 0.8),
                                    blurRadius: 10,
                                    spreadRadius: 1,
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Quick Deal ID / QR Payload Input
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _manualCodeController,
                      style: AppTokens.monoStyle(
                        color: c.textPrimary,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                      decoration: InputDecoration(
                        hintText: 'Hoặc nhập mã giao dịch / liên kết QR...',
                        isDense: true,
                        filled: true,
                        fillColor: c.surfaceSubtle,
                      ),
                      onSubmitted: (_) => _submitManualCode(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  SizedBox(
                    height: 46,
                    child: ElevatedButton(
                      onPressed: _submitManualCode,
                      style: AppTokens.primaryButtonStyle(
                        c,
                        minHeight: 46,
                      ),
                      child: const Text(
                        'Mở',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                    ),
                  ),
                ],
              ),

              if (_statusNote != null) ...[
                const SizedBox(height: 8),
                Text(
                  _statusNote!,
                  style: AppTokens.monoStyle(color: c.cyanText, fontSize: 11),
                ),
              ],
              const SizedBox(height: 12),

              // Flash & Album Actions
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        setState(() => _flashEnabled = !_flashEnabled);
                      },
                      icon: Icon(
                        _flashEnabled ? Icons.flash_on_rounded : Icons.flash_off_rounded,
                        size: 18,
                        color: AppTokens.amber,
                      ),
                      label: Text(
                        _flashEnabled ? 'Tắt Flash' : 'Bật Flash',
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 12,
                        ),
                      ),
                      style: AppTokens.outlinedButtonStyle(
                        c,
                        backgroundColor: c.surfaceSubtle,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _pickFromAlbum,
                      icon: const Icon(
                        Icons.photo_library_outlined,
                        size: 18,
                        color: AppTokens.cyan,
                      ),
                      label: const Text(
                        'Chọn từ Album',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 12,
                        ),
                      ),
                      style: AppTokens.outlinedButtonStyle(
                        c,
                        backgroundColor: c.surfaceSubtle,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ViewfinderCornersPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppTokens.cyanBright
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    const padX = 56.0;
    const padY = 24.0;
    const len = 18.0;

    // Top-left
    canvas.drawPath(
      Path()
        ..moveTo(padX, padY + len)
        ..lineTo(padX, padY)
        ..lineTo(padX + len, padY),
      paint,
    );
    // Top-right
    canvas.drawPath(
      Path()
        ..moveTo(size.width - padX - len, padY)
        ..lineTo(size.width - padX, padY)
        ..lineTo(size.width - padX, padY + len),
      paint,
    );
    // Bottom-left
    canvas.drawPath(
      Path()
        ..moveTo(padX, size.height - padY - len)
        ..lineTo(padX, size.height - padY)
        ..lineTo(padX + len, size.height - padY),
      paint,
    );
    // Bottom-right
    canvas.drawPath(
      Path()
        ..moveTo(size.width - padX - len, size.height - padY)
        ..lineTo(size.width - padX, size.height - padY)
        ..lineTo(size.width - padX, size.height - padY - len),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
