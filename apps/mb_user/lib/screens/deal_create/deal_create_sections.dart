import 'package:flutter/material.dart';
import '../../theme/app_tokens.dart';

class AssetCategoryGrid extends StatelessWidget {
  final String selectedId;
  final ValueChanged<String> onSelect;

  const AssetCategoryGrid({
    super.key,
    required this.selectedId,
    required this.onSelect,
  });

  static const List<({String id, String label, IconData icon})> items = [
    (id: 'SOURCE_CODE', label: 'Mã Nguồn Git', icon: Icons.code_rounded),
    (id: 'LICENSE_KEY', label: 'License Key', icon: Icons.vpn_key_outlined),
    (id: 'DESIGN_ASSET', label: 'Ebook / PDF', icon: Icons.menu_book_outlined),
    (id: 'ACCOUNT_CREDENTIAL', label: 'Cloud / API', icon: Icons.cloud_outlined),
    (id: 'DESIGN_ASSET_UI', label: 'UI / Figma', icon: Icons.layers_outlined),
    (id: 'OTHER', label: 'Khác', icon: Icons.add_circle_outline_rounded),
  ];

  @override
  Widget build(BuildContext context) {
    final c = context.tp;

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: items.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        mainAxisSpacing: 8,
        crossAxisSpacing: 8,
        childAspectRatio: 1.55,
      ),
      itemBuilder: (context, index) {
        final item = items[index];
        final selected = selectedId == item.id;
        return OutlinedButton(
          onPressed: () => onSelect(item.id),
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
            backgroundColor: selected ? c.emeraldSoft : c.surface,
            foregroundColor: selected ? c.emeraldText : c.textSecondary,
            side: BorderSide(
              color: selected ? AppTokens.emerald : c.border,
              width: selected ? 1.5 : 1.0,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(item.icon, size: 19),
              const SizedBox(height: 4),
              Text(
                item.label,
                style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: selected ? FontWeight.bold : FontWeight.w500,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        );
      },
    );
  }
}

class InspectionDurationRow extends StatelessWidget {
  final int selectedHours;
  final ValueChanged<int> onSelect;

  const InspectionDurationRow({
    super.key,
    required this.selectedHours,
    required this.onSelect,
  });

  static const List<int> options = [6, 12, 24, 48];

  @override
  Widget build(BuildContext context) {
    final c = context.tp;

    return Row(
      children: options.map((hours) {
        final selected = selectedHours == hours;
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(right: hours == options.last ? 0 : 6),
            child: OutlinedButton(
              onPressed: () => onSelect(hours),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(44, 44),
                padding: EdgeInsets.zero,
                backgroundColor: selected ? c.cyanSoft : c.surface,
                foregroundColor: selected ? c.cyanText : c.textSecondary,
                side: BorderSide(
                  color: selected ? AppTokens.cyan : c.border,
                  width: selected ? 1.5 : 1.0,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text(
                '$hours Giờ',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: selected ? FontWeight.bold : FontWeight.w600,
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class EncryptedVaultPayloadBox extends StatelessWidget {
  final TextEditingController controller;

  const EncryptedVaultPayloadBox({super.key, required this.controller});

  @override
  Widget build(BuildContext context) {
    final c = context.tp;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: AppTokens.cardDecoration(
        c,
        radius: 18,
        backgroundColor: c.surfaceSubtle,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(Icons.lock_outline_rounded, size: 16, color: c.cyanText),
                  const SizedBox(width: 6),
                  Text(
                    'Nội dung bàn giao két số',
                    style: TextStyle(
                      color: c.textPrimary,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: c.cyanSoft,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: c.cyanBorder),
                ),
                child: Text(
                  'AES-256-GCM',
                  style: AppTokens.monoStyle(color: c.cyanText, fontSize: 9.5),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          TextField(
            controller: controller,
            maxLines: 2,
            style: AppTokens.monoStyle(
              color: c.textPrimary,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
            decoration: const InputDecoration(
              hintText:
                  'Link GitHub Private Token / License Key / Tài liệu mật...',
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Dữ liệu được mã hóa trực tiếp tại thiết bị trước khi tải lên két số ký quỹ.',
            style: TextStyle(color: c.textMuted, fontSize: 10.5),
          ),
        ],
      ),
    );
  }
}
