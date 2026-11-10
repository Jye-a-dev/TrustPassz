import 'package:flutter/material.dart';
import '../../theme/app_tokens.dart';

class VietQrMatrixCard extends StatelessWidget {
  final String? qrImageUrl;
  final String seed;

  const VietQrMatrixCard({
    super.key,
    this.qrImageUrl,
    required this.seed,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.tp;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: c.borderStrong, width: 1.0),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Text(
                    'napas',
                    style: TextStyle(
                      color: Color(0xFF1E3A8A),
                      fontWeight: FontWeight.w900,
                      fontSize: 13,
                    ),
                  ),
                  Text(
                    '247',
                    style: TextStyle(
                      color: Color(0xFFF97316),
                      fontWeight: FontWeight.w900,
                      fontSize: 13,
                    ),
                  ),
                  SizedBox(width: 6),
                  Text('|', style: TextStyle(color: Color(0xFFCBD5E1))),
                  SizedBox(width: 6),
                  Text(
                    'VietQR',
                    style: TextStyle(
                      color: Color(0xFF0F172A),
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFD1FAE5),
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: const Color(0xFF6EE7B7)),
                ),
                child: Text(
                  'Tự Động Khớp',
                  style: AppTokens.monoStyle(
                    color: const Color(0xFF047857),
                    fontSize: 10,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
            ),
            child: qrImageUrl != null && qrImageUrl!.isNotEmpty
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(
                      qrImageUrl!,
                      width: 192,
                      height: 192,
                      fit: BoxFit.contain,
                      errorBuilder: (_, __, ___) => _buildFallbackPainter(),
                    ),
                  )
                : _buildFallbackPainter(),
          ),
          const SizedBox(height: 10),
          const Text(
            'Mở ứng dụng Ngân hàng bất kỳ để quét mã thanh toán 24/7',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Color(0xFF475569),
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFallbackPainter() {
    return SizedBox(
      width: 192,
      height: 192,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CustomPaint(
            size: const Size(192, 192),
            painter: _QrMatrixPainter(seed: seed),
          ),
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: const Color(0xFF080C14),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppTokens.emerald, width: 2),
            ),
            alignment: Alignment.center,
            child: const Text(
              'TP',
              style: TextStyle(
                color: AppTokens.emerald,
                fontWeight: FontWeight.w900,
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _QrMatrixPainter extends CustomPainter {
  final String seed;

  const _QrMatrixPainter({required this.seed});

  @override
  void paint(Canvas canvas, Size size) {
    final dark = Paint()..color = const Color(0xFF0F172A);
    final white = Paint()..color = Colors.white;
    canvas.drawRect(Offset.zero & size, white);

    const grid = 21;
    final cell = size.width / grid;
    final hash =
        seed.codeUnits.fold<int>(17, (acc, v) => (acc * 31 + v) & 0x7fffffff);

    void drawFinder(int gx, int gy) {
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(gx * cell, gy * cell, 7 * cell, 7 * cell),
          const Radius.circular(4),
        ),
        dark,
      );
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH((gx + 1) * cell, (gy + 1) * cell, 5 * cell, 5 * cell),
          const Radius.circular(2),
        ),
        white,
      );
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH((gx + 2) * cell, (gy + 2) * cell, 3 * cell, 3 * cell),
          const Radius.circular(1.5),
        ),
        dark,
      );
    }

    drawFinder(0, 0);
    drawFinder(grid - 7, 0);
    drawFinder(0, grid - 7);

    for (int y = 0; y < grid; y++) {
      for (int x = 0; x < grid; x++) {
        final inFinder = (x < 8 && y < 8) ||
            (x >= grid - 8 && y < 8) ||
            (x < 8 && y >= grid - 8);
        final inCenter = x >= 8 && x <= 12 && y >= 8 && y <= 12;
        if (inFinder || inCenter) continue;

        final bit =
            ((hash ^ (x * 73856093) ^ (y * 19349663)) >> ((x + y) % 8)) & 1;
        if (bit == 1) {
          canvas.drawRect(
            Rect.fromLTWH(
              x * cell + 0.4,
              y * cell + 0.4,
              cell - 0.8,
              cell - 0.8,
            ),
            dark,
          );
        }
      }
    }
  }

  @override
  bool shouldRepaint(covariant _QrMatrixPainter oldDelegate) =>
      oldDelegate.seed != seed;
}
