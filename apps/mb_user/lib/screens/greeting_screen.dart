import 'package:flutter/material.dart';

class PillarItem {
  final String title;
  final String subtitle;
  final String desc;
  final String icon;
  final String badge;
  final Color accentColor;

  const PillarItem({
    required this.title,
    required this.subtitle,
    required this.desc,
    required this.icon,
    required this.badge,
    required this.accentColor,
  });
}

class GreetingScreen extends StatefulWidget {
  final VoidCallback onContinue;

  const GreetingScreen({super.key, required this.onContinue});

  @override
  State<GreetingScreen> createState() => _GreetingScreenState();
}

class _GreetingScreenState extends State<GreetingScreen> {
  int _activeStep = 0;

  static const List<PillarItem> pillars = [
    PillarItem(
      title: 'VietQR-to-Escrow',
      subtitle: 'Napas 247 Khóa Tiền Tự Động',
      desc:
          'Thanh toán App-to-App qua chuẩn VietQR động. Tiền được đóng băng an toàn trong hợp đồng thông minh hoặc tài khoản ký quỹ.',
      icon: '⚡',
      badge: 'Napas 247 Instant',
      accentColor: Color(0xFF10B981),
    ),
    PillarItem(
      title: 'Digital Vault AES-256-GCM',
      subtitle: 'Két Số Mã Hóa Đầu Cuối',
      desc:
          'Bàn giao License Key, source code hoặc dữ liệu số bảo mật tuyệt đối. Người mua chỉ giải mã sau khi escrow xác nhận đã khóa tiền.',
      icon: '🔐',
      badge: 'Zero-Knowledge Vault',
      accentColor: Color(0xFF06B6D4),
    ),
    PillarItem(
      title: 'AI Arbitrator',
      subtitle: 'Trọng Tài AI Phân Giải Tranh Chấp',
      desc:
          'Phân tích video/ảnh lỗi client-side với trích xuất keyframes tự động. Đưa ra phán quyết hoàn tiền hoặc thanh toán chỉ trong vài giây.',
      icon: '🤖',
      badge: 'Vision AI Pipeline',
      accentColor: Color(0xFFA855F7),
    ),
  ];

  void _handleNext() {
    if (_activeStep < pillars.length - 1) {
      setState(() {
        _activeStep++;
      });
    } else {
      widget.onContinue();
    }
  }

  @override
  Widget build(BuildContext context) {
    final item = pillars[_activeStep];

    return Scaffold(
      backgroundColor: const Color(0xFF080C14),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Brand Header
              Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF22D3EE), Color(0xFF34D399)],
                      ),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    alignment: Alignment.center,
                    child: const Text(
                      'TP',
                      style: TextStyle(
                        color: Color(0xFF020617),
                        fontWeight: FontWeight.w900,
                        fontSize: 16,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'TrustPassz',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                          letterSpacing: 0.5,
                        ),
                      ),
                      Text(
                        'Bảo Vệ Giao Dịch Tài Sản Số',
                        style: TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 11,
                          fontFamily: 'monospace',
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const Spacer(),

              // Pillar Card
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                      color: item.accentColor.withValues(alpha: 0.4)),
                  boxShadow: [
                    BoxShadow(
                      color: item.accentColor.withValues(alpha: 0.1),
                      blurRadius: 30,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFF080C14),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFF1E293B)),
                          ),
                          child: Text(
                            item.icon,
                            style: const TextStyle(fontSize: 28),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: item.accentColor.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(999),
                            border: Border.all(
                              color: item.accentColor.withValues(alpha: 0.3),
                            ),
                          ),
                          child: Text(
                            item.badge,
                            style: TextStyle(
                              color: item.accentColor,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'monospace',
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),
                    Text(
                      item.title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.subtitle,
                      style: TextStyle(
                        color: item.accentColor,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      item.desc,
                      style: const TextStyle(
                        color: Color(0xFFCBD5E1),
                        fontSize: 13,
                        height: 1.5,
                      ),
                    ),
                  ],
                ),
              ),

              // Dot Indicators
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  pillars.length,
                  (index) => AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: _activeStep == index ? 28 : 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: _activeStep == index
                          ? const Color(0xFF22D3EE)
                          : const Color(0xFF334155),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ),
              ),
              const Spacer(),

              // Action Button
              ElevatedButton(
                onPressed: _handleNext,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF06B6D4),
                  foregroundColor: const Color(0xFF020617),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  elevation: 6,
                ),
                child: Text(
                  _activeStep == pillars.length - 1
                      ? 'Bắt Đầu Ngay'
                      : 'Tiếp Tục →',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
