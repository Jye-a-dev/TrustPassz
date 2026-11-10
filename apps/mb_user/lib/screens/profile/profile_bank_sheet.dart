import 'package:flutter/material.dart';
import '../../theme/app_tokens.dart';

class ProfileMethodTile extends StatelessWidget {
  final IconData icon;
  final Color iconBg;
  final Color iconColor;
  final String title;
  final String subtitle;
  final Widget trailing;

  const ProfileMethodTile({
    super.key,
    required this.icon,
    required this.iconBg,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.tp;

    return Row(
      children: [
        Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
            color: iconBg,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: c.border),
          ),
          child: Icon(icon, color: iconColor, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  color: c.textPrimary,
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                subtitle,
                style: TextStyle(color: c.textMuted, fontSize: 11),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        trailing,
      ],
    );
  }
}

Future<({String bankName, String accountNo})?> showVietQrBankEditSheet(
  BuildContext context, {
  required String currentBankName,
  required String currentAccountNo,
}) {
  final bankController = TextEditingController(text: currentBankName);
  final accController = TextEditingController(text: currentAccountNo);
  final c = context.tp;

  return showModalBottomSheet<({String bankName, String accountNo})>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
      child: Container(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        decoration: BoxDecoration(
          color: c.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          border: Border.all(color: c.border),
        ),
        child: SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Cấu Hình STK Nhận Tiền VietQR',
                style: TextStyle(
                  color: c.textPrimary,
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: bankController,
                decoration: const InputDecoration(
                  labelText: 'Ngân hàng thụ hưởng',
                  hintText: 'Ví dụ: MB Bank / Vietcombank',
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: accController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Số tài khoản ngân hàng',
                  hintText: 'Nhập số tài khoản nhận giải ngân...',
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  final bank = bankController.text.trim();
                  final acc = accController.text.trim();
                  if (bank.isEmpty || acc.isEmpty) return;
                  Navigator.of(ctx).pop((bankName: bank, accountNo: acc));
                },
                style: AppTokens.primaryButtonStyle(c),
                child: const Text(
                  'Lưu Tài Khoản VietQR',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}
