import 'package:flutter/material.dart';
import '../../theme/app_tokens.dart';

class TrustPasszIcon extends StatelessWidget {
  final double size;
  final bool glow;

  const TrustPasszIcon({
    super.key,
    this.size = 28.0,
    this.glow = false,
  });

  @override
  Widget build(BuildContext context) {
    final borderRadius = BorderRadius.circular(size * 0.28);
    final fontSize = size * 0.38;

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppTokens.cyan, AppTokens.emerald],
          begin: Alignment.bottomLeft,
          end: Alignment.topRight,
        ),
        borderRadius: borderRadius,
        border: Border.all(
          color: glow ? AppTokens.emeraldDark : AppTokens.cyan,
          width: 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: (glow ? AppTokens.emerald : AppTokens.cyan)
                .withValues(alpha: 0.22),
            blurRadius: glow ? 10 : 4,
          ),
        ],
      ),
      alignment: Alignment.center,
      child: Text(
        'TP',
        style: TextStyle(
          color: const Color(0xFF020617),
          fontWeight: FontWeight.w900,
          fontSize: fontSize,
          fontFamily: 'monospace',
          letterSpacing: -0.5,
        ),
      ),
    );
  }
}
