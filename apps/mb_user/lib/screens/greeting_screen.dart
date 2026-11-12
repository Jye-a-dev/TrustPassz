import 'package:flutter/material.dart';
import '../theme/app_tokens.dart';
import '../theme/theme_provider.dart';
import 'greeting/greeting_pillar_card.dart';

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
      title: 'Ký Quỹ Napas 24/7',
      subtitle: 'VietQR-to-Escrow Tự Động',
      desc:
          'Quét mã VietQR từ mọi ứng dụng ngân hàng. Tiền được đóng băng an toàn trong hợp đồng ký quỹ thông minh cho đến khi bạn kiểm tra và hài lòng với tài sản.',
      iconData: Icons.qr_code_2_rounded,
      stepBadge: 'Bước 1 / 3',
      metricLeftLabel: 'Đối soát:',
      metricLeftValue: '< 1s',
      metricRightLabel: 'Khóa quỹ:',
      metricRightValue: '100% Bảo đảm',
    ),
    PillarItem(
      title: 'Két Số Digital Vault',
      subtitle: 'Giải Mã AES-256 & Đếm Ngược',
      desc:
          'Mã nguồn, license key, tài liệu bí mật được mã hóa end-to-end. Bạn có đồng hồ kiểm thử độc lập trước khi bấm xác nhận giải ngân.',
      iconData: Icons.lock_outline_rounded,
      stepBadge: 'Bước 2 / 3',
      metricLeftLabel: 'Chuẩn mã hóa:',
      metricLeftValue: 'AES-256-GCM',
      metricRightLabel: 'Tự hủy token:',
      metricRightValue: '30s',
    ),
    PillarItem(
      title: 'Trọng Tài AI Vision',
      subtitle: 'Phân Xử Tranh Chấp < 15 Phút',
      desc:
          'Nếu tài sản lỗi hoặc sai cam kết, chụp ảnh hoặc tải video kiểm thử. Trọng tài đa phương thức đối soát tự động và hoàn tiền minh bạch.',
      iconData: Icons.balance_rounded,
      stepBadge: 'Bước 3 / 3',
      metricLeftLabel: 'SLA thẩm định:',
      metricLeftValue: '< 15 phút',
      metricRightLabel: 'Tỷ lệ chuẩn:',
      metricRightValue: '99.8%',
    ),
  ];

  void _handleNext() {
    if (_activeStep < pillars.length - 1) {
      setState(() => _activeStep++);
    } else {
      widget.onContinue();
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.tp;
    final item = pillars[_activeStep];

    return Scaffold(
      backgroundColor: c.canvas,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [AppTokens.cyan, AppTokens.emerald],
                          ),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: c.emeraldBorder),
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
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'TrustPassz',
                            style: TextStyle(
                              color: c.textPrimary,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          Text(
                            'Cyber-Escrow Platform v2.0',
                            style: AppTokens.monoStyle(
                              color: c.textMuted,
                              fontSize: 10,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: c.emeraldSoft,
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(color: c.emeraldBorder),
                        ),
                        child: Text(
                          'Napas 24/7',
                          style: AppTokens.monoStyle(
                            color: c.emeraldText,
                            fontSize: 10.5,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      SizedBox(
                        width: 44,
                        height: 44,
                        child: OutlinedButton(
                          onPressed: () => ThemeProvider.instance.toggleTheme(),
                          style: OutlinedButton.styleFrom(
                            padding: EdgeInsets.zero,
                            minimumSize: const Size(44, 44),
                            backgroundColor: c.surface,
                            side: BorderSide(color: c.border),
                            shape: const CircleBorder(),
                          ),
                          child: Icon(
                            c.isDark
                                ? Icons.light_mode_outlined
                                : Icons.dark_mode_outlined,
                            size: 18,
                            color: c.textSecondary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const Spacer(),
              GreetingPillarCard(item: item, stepIndex: _activeStep),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(pillars.length, (index) {
                  final active = _activeStep == index;
                  return InkWell(
                    onTap: () => setState(() => _activeStep = index),
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      height: 44,
                      padding: const EdgeInsets.symmetric(horizontal: 6),
                      alignment: Alignment.center,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        width: active ? 32 : 8,
                        height: 8,
                        decoration: BoxDecoration(
                          gradient: active
                              ? const LinearGradient(
                                  colors: [AppTokens.cyan, AppTokens.emerald],
                                )
                              : null,
                          color: active ? null : c.borderStrong,
                          borderRadius: BorderRadius.circular(999),
                        ),
                      ),
                    ),
                  );
                }),
              ),
              const Spacer(),
              ElevatedButton.icon(
                onPressed: _handleNext,
                icon: const Icon(Icons.arrow_forward_rounded, size: 18),
                label: Text(
                  _activeStep == pillars.length - 1
                      ? 'Bắt Đầu Ngay'
                      : 'Tiếp Tục',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                style: AppTokens.primaryButtonStyle(c),
              ),
              const SizedBox(height: 10),
              OutlinedButton(
                onPressed: widget.onContinue,
                style: AppTokens.outlinedButtonStyle(c),
                child: Text(
                  'Bỏ qua và Đăng nhập ngay',
                  style: TextStyle(
                    color: c.textSecondary,
                    fontWeight: FontWeight.w600,
                    fontSize: 12.5,
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
