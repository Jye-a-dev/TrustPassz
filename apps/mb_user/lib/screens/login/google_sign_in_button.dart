import 'package:flutter/material.dart';
import '../../theme/app_tokens.dart';

/// Crisp 4-color Google OAuth CTA button compliant with V2 design tokens
/// (`BorderSide(color: Color(0xFFE2E8F0), width: 1.0)` in Light mode, >= 48px height).
class GoogleSignInButton extends StatelessWidget {
  final bool isLoading;
  final bool isDisabled;
  final VoidCallback onPressed;

  const GoogleSignInButton({
    super.key,
    required this.isLoading,
    required this.isDisabled,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.tp;
    final borderColor = c.isDark ? c.border : const Color(0xFFE2E8F0);

    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppTokens.buttonRadius),
        boxShadow: c.isDark
            ? const [
                BoxShadow(
                  color: Color(0x22000000),
                  blurRadius: 6,
                  offset: Offset(0, 2),
                ),
              ]
            : const [
                BoxShadow(
                  color: Color(0x0D0F172A),
                  blurRadius: 6,
                  offset: Offset(0, 2),
                ),
              ],
      ),
      child: OutlinedButton(
        onPressed: isDisabled ? null : onPressed,
        style: OutlinedButton.styleFrom(
          backgroundColor: c.surface,
          foregroundColor: c.textPrimary,
          minimumSize: const Size(double.infinity, 48),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          side: BorderSide(color: borderColor, width: 1.0),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppTokens.buttonRadius),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isLoading)
              SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: c.textPrimary,
                ),
              )
            else
              const SizedBox(
                width: 20,
                height: 20,
                child: CustomPaint(painter: _GoogleLogoPainter()),
              ),
            const SizedBox(width: 12),
            Text(
              'Tiếp tục với Google',
              style: TextStyle(
                color: c.textPrimary,
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GoogleLogoPainter extends CustomPainter {
  const _GoogleLogoPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final outerRadius = size.width / 2;
    final strokeWidth = size.width * 0.21;
    final arcRect = Rect.fromCircle(
      center: center,
      radius: outerRadius - strokeWidth / 2,
    );

    canvas.save();
    canvas.clipPath(
      Path()..addOval(Rect.fromCircle(center: center, radius: outerRadius)),
    );

    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.butt;

    paint.color = const Color(0xFFEA4335);
    canvas.drawArc(arcRect, 3.68, 1.82, false, paint);

    paint.color = const Color(0xFFFBBC05);
    canvas.drawArc(arcRect, 2.56, 1.14, false, paint);

    paint.color = const Color(0xFF34A853);
    canvas.drawArc(arcRect, 0.74, 1.84, false, paint);

    paint.color = const Color(0xFF4285F4);
    canvas.drawArc(arcRect, -0.08, 0.84, false, paint);

    final barPaint = Paint()..color = const Color(0xFF4285F4);
    canvas.drawRect(
      Rect.fromLTRB(
        center.dx,
        center.dy - strokeWidth * 0.45,
        size.width,
        center.dy + strokeWidth * 0.55,
      ),
      barPaint,
    );

    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
