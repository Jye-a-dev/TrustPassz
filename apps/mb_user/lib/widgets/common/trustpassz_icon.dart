import 'package:flutter/material.dart';

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
        color: const Color(0xFF0B0F17),
        borderRadius: borderRadius,
        border: Border.all(
          color: glow ? const Color(0xFF10B981) : const Color(0xFF06B6D4),
          width: size * 0.05,
        ),
        boxShadow: [
          BoxShadow(
            color: glow
                ? const Color(0xFF10B981).withValues(alpha: 0.4)
                : const Color(0xFF06B6D4).withValues(alpha: 0.3),
            blurRadius: glow ? 8 : 4,
            spreadRadius: glow ? 1 : 0,
          ),
        ],
      ),
      alignment: Alignment.center,
      child: Text(
        'TP',
        style: TextStyle(
          color: const Color(0xFFF8FAFC),
          fontWeight: FontWeight.w900,
          fontSize: fontSize,
          fontFamily: 'monospace',
          letterSpacing: -0.5,
        ),
      ),
    );
  }
}

