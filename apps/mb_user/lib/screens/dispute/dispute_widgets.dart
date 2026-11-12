import 'dart:io' show File;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../theme/app_tokens.dart';

class AttachedDisputeMedia {
  final XFile file;
  final bool isVideo;

  const AttachedDisputeMedia({required this.file, required this.isVideo});
}

class DisputeSanctionsBanner extends StatelessWidget {
  const DisputeSanctionsBanner({super.key});

  @override
  Widget build(BuildContext context) {
    final c = context.tp;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: c.roseSoft,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: c.roseBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.info_outline, size: 17, color: c.roseText),
              const SizedBox(width: 6),
              Text(
                'Quy Định Chế Tài Gian Lận',
                style: TextStyle(
                  color: c.roseText,
                  fontWeight: FontWeight.bold,
                  fontSize: 12.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            '1. Khiếu nại sai sự thật bị trừ ngay 20 điểm uy tín eKYC.\n'
            '2. Khóa vĩnh viễn tài khoản nếu cung cấp ảnh hoặc video giả mạo.\n'
            '3. Hoàn tiền 100% nếu Trọng tài AI Vision xác thực sản phẩm lỗi.',
            style: TextStyle(
              color: c.roseText,
              fontSize: 11.5,
              height: 1.45,
            ),
          ),
        ],
      ),
    );
  }
}

class DisputeCauseChips extends StatelessWidget {
  final String selectedCategory;
  final ValueChanged<String> onSelect;

  const DisputeCauseChips({
    super.key,
    required this.selectedCategory,
    required this.onSelect,
  });

  static const List<String> categories = [
    'Sai lệch mô tả',
    'Không hoạt động',
    'Thiếu mã nguồn/Key',
    'Phát hiện mã độc',
  ];

  @override
  Widget build(BuildContext context) {
    final c = context.tp;

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: categories.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 8,
        crossAxisSpacing: 8,
        childAspectRatio: 3.4,
      ),
      itemBuilder: (context, index) {
        final cat = categories[index];
        final selected = selectedCategory == cat;
        return OutlinedButton(
          onPressed: () => onSelect(cat),
          style: OutlinedButton.styleFrom(
            minimumSize: const Size(44, 44),
            backgroundColor: selected ? c.roseSoft : c.surface,
            foregroundColor: selected ? c.roseText : c.textSecondary,
            side: BorderSide(
              color: selected ? AppTokens.rose : c.borderStrong,
              width: selected ? 1.5 : 1.0,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: Text(
            cat,
            style: TextStyle(
              fontSize: 11.5,
              fontWeight: selected ? FontWeight.bold : FontWeight.w500,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        );
      },
    );
  }
}

class EvidenceThumbnailCard extends StatelessWidget {
  final AttachedDisputeMedia media;
  final VoidCallback onRemove;

  const EvidenceThumbnailCard({
    super.key,
    required this.media,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.tp;

    return Stack(
      clipBehavior: Clip.none,
      children: [
        Container(
          width: double.infinity,
          height: double.infinity,
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: c.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: c.borderStrong),
          ),
          child: Column(
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: !media.isVideo && !kIsWeb
                      ? Image.file(
                          File(media.file.path),
                          width: double.infinity,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Icon(
                            Icons.image_outlined,
                            color: c.cyanText,
                            size: 28,
                          ),
                        )
                      : Container(
                          color: c.surfaceSubtle,
                          alignment: Alignment.center,
                          child: Icon(
                            media.isVideo
                                ? Icons.videocam_rounded
                                : Icons.image_outlined,
                            color: media.isVideo ? c.amberText : c.cyanText,
                            size: 28,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                media.file.name,
                style: AppTokens.monoStyle(
                  color: c.textMuted,
                  fontSize: 9.5,
                  fontWeight: FontWeight.w500,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        Positioned(
          top: -8,
          right: -8,
          child: SizedBox(
            width: 44,
            height: 44,
            child: InkWell(
              onTap: onRemove,
              borderRadius: BorderRadius.circular(999),
              child: Align(
                alignment: Alignment.topRight,
                child: Container(
                  width: 24,
                  height: 24,
                  margin: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: AppTokens.rose,
                    shape: BoxShape.circle,
                    border: Border.all(color: c.surface, width: 1.5),
                  ),
                  child: const Icon(Icons.close, size: 13, color: Colors.white),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}


class DisputeAppBar extends StatelessWidget implements PreferredSizeWidget {
  final VoidCallback onBack;

  const DisputeAppBar({super.key, required this.onBack});

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    final c = context.tp;

    return AppBar(
      backgroundColor: c.canvas,
      leadingWidth: 60,
      leading: Padding(
        padding: const EdgeInsets.only(left: 12),
        child: Center(
          child: SizedBox(
            width: 44,
            height: 44,
            child: OutlinedButton(
              onPressed: onBack,
              style: OutlinedButton.styleFrom(
                padding: EdgeInsets.zero,
                minimumSize: const Size(44, 44),
                backgroundColor: c.surface,
                side: BorderSide(color: c.border),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Icon(
                Icons.arrow_back_rounded,
                size: 18,
                color: c.textPrimary,
              ),
            ),
          ),
        ),
      ),
      title: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Lập Hồ Sơ Khiếu Nại',
            style: TextStyle(
              color: c.roseText,
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            'Đơn gửi Trọng Tài AI Vision',
            style: AppTokens.monoStyle(
              color: c.textMuted,
              fontSize: 10.5,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
      actions: [
        Padding(
          padding: const EdgeInsets.only(right: 16),
          child: Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: c.roseSoft,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: c.roseBorder),
              ),
              child: Text(
                'SLA < 15p',
                style: AppTokens.monoStyle(color: c.roseText, fontSize: 10.5),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
