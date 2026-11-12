import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../services/auth_service.dart';
import '../services/deal_service.dart';
import '../theme/app_tokens.dart';
import '../widgets/modals/dispute_success_dialog.dart';
import '../widgets/modals/dispute_warning_dialog.dart';
import 'dispute/dispute_widgets.dart';

/// Screen 09: AI Arbitrator Dispute Filing V2 with SLA < 15p badge,
/// 4 reason chips, Image + Video picker, and 3-column thumbnail grid.
class DisputeScreen extends StatefulWidget {
  final String? initialDealId;
  final VoidCallback onBack;
  final VoidCallback? onTrackOrders;

  const DisputeScreen({
    super.key,
    this.initialDealId,
    required this.onBack,
    this.onTrackOrders,
  });

  @override
  State<DisputeScreen> createState() => _DisputeScreenState();
}

class _DisputeScreenState extends State<DisputeScreen> {
  late final TextEditingController _dealIdController;
  final TextEditingController _reasonController = TextEditingController();
  final ImagePicker _picker = ImagePicker();

  final List<AttachedDisputeMedia> _selectedMedia = [];
  String _selectedCategory = DisputeCauseChips.categories.first;
  bool _isSubmitting = false;
  String? _statusFeedback;

  @override
  void initState() {
    super.initState();
    _dealIdController = TextEditingController(text: widget.initialDealId ?? '');
  }

  @override
  void dispose() {
    _dealIdController.dispose();
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final picked = await _picker.pickImage(
        source: source,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );
      if (picked != null && mounted) {
        setState(() {
          _selectedMedia
              .add(AttachedDisputeMedia(file: picked, isVideo: false));
          _statusFeedback = 'Đã đính kèm ảnh: ${picked.name}';
        });
      }
    } catch (e) {
      _showMediaError('Lỗi chọn ảnh: $e');
    }
  }

  Future<void> _pickVideo(ImageSource source) async {
    try {
      final picked = await _picker.pickVideo(
        source: source,
        maxDuration: const Duration(minutes: 2),
      );
      if (picked != null && mounted) {
        setState(() {
          _selectedMedia.add(AttachedDisputeMedia(file: picked, isVideo: true));
          _statusFeedback = 'Đã đính kèm video: ${picked.name}';
        });
      }
    } catch (e) {
      _showMediaError('Lỗi chọn video: $e');
    }
  }

  void _showMediaError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppTokens.rose,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _confirmAndSubmit() {
    final dealId = _dealIdController.text.trim();
    final reason = _reasonController.text.trim();

    if (dealId.isEmpty) {
      _showMediaError('Vui lòng nhập Mã giao dịch (Deal ID) cần khiếu nại.');
      return;
    }
    if (reason.isEmpty) {
      _showMediaError('Vui lòng mô tả chi tiết lý do khiếu nại.');
      return;
    }
    if (_selectedMedia.isEmpty) {
      _showMediaError('Vui lòng đính kèm ít nhất 1 ảnh hoặc video bằng chứng.');
      return;
    }

    DisputeWarningDialog.show(
      context,
      onContinue: () => _executeSubmit(dealId, reason),
    );
  }

  Future<void> _executeSubmit(String dealId, String reason) async {
    setState(() {
      _isSubmitting = true;
      _statusFeedback = 'Đang kích hoạt AI Arbitrator Pipeline...';
    });

    try {
      final user = await AuthService.instance.getStoredUser();
      final initiatorId = user?.id ?? '';
      final fullReason = '[$_selectedCategory] $reason';

      await DealService.instance.submitDispute(
        dealId: dealId,
        initiatorId: initiatorId,
        reason: fullReason,
        filePaths: _selectedMedia.map((m) => m.file.path).toList(),
      );

      if (!mounted) return;
      final prefix =
          dealId.substring(0, dealId.length.clamp(0, 4)).toUpperCase();
      final code = '#DIS-${DateTime.now().year}-$prefix';
      await DisputeSuccessDialog.show(
        context,
        disputeCode: code,
        onTrackOrders: () {
          if (widget.onTrackOrders != null) {
            widget.onTrackOrders!();
          } else {
            widget.onBack();
          }
        },
        onGoHome: widget.onBack,
      );
    } catch (e) {
      if (!mounted) return;
      _showMediaError('Lỗi gửi khiếu nại: $e');
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.tp;

    return Scaffold(
      backgroundColor: c.canvas,
      appBar: DisputeAppBar(onBack: widget.onBack),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const DisputeSanctionsBanner(),
              const SizedBox(height: 16),
              Text(
                'MÃ GIAO DỊCH (DEAL ID)',
                style: AppTokens.monoStyle(color: c.textMuted, fontSize: 10.5),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: _dealIdController,
                style: AppTokens.monoStyle(color: c.textPrimary, fontSize: 13),
                decoration: const InputDecoration(hintText: 'Nhập Deal ID...'),
              ),
              const SizedBox(height: 16),
              Text(
                'Nhóm nguyên nhân tranh chấp',
                style: TextStyle(
                  color: c.textSecondary,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              DisputeCauseChips(
                selectedCategory: _selectedCategory,
                onSelect: (cat) => setState(() => _selectedCategory = cat),
              ),
              const SizedBox(height: 16),
              Text(
                'Bằng chứng đa phương tiện (Ảnh / Video)',
                style: TextStyle(
                  color: c.textSecondary,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _pickImage(ImageSource.camera),
                      icon: Icon(
                        Icons.camera_alt_outlined,
                        size: 16,
                        color: c.cyanText,
                      ),
                      label: const Text(
                        'Chụp Ảnh',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      style: AppTokens.outlinedButtonStyle(c),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _pickImage(ImageSource.gallery),
                      icon: Icon(
                        Icons.photo_library_outlined,
                        size: 16,
                        color: c.cyanText,
                      ),
                      label: const Text(
                        'Chọn Ảnh',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      style: AppTokens.outlinedButtonStyle(c),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _pickVideo(ImageSource.gallery),
                      icon: Icon(
                        Icons.videocam_outlined,
                        size: 16,
                        color: c.amberText,
                      ),
                      label: const Text(
                        'Video',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      style: AppTokens.outlinedButtonStyle(c),
                    ),
                  ),
                ],
              ),
              if (_selectedMedia.isNotEmpty) ...[
                const SizedBox(height: 12),
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _selectedMedia.length,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    mainAxisSpacing: 8,
                    crossAxisSpacing: 8,
                    childAspectRatio: 0.95,
                  ),
                  itemBuilder: (context, index) => EvidenceThumbnailCard(
                    media: _selectedMedia[index],
                    onRemove: () =>
                        setState(() => _selectedMedia.removeAt(index)),
                  ),
                ),
              ],
              const SizedBox(height: 16),
              Text(
                'Mô tả chi tiết lỗi / sai lệch',
                style: TextStyle(
                  color: c.textSecondary,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: _reasonController,
                maxLines: 4,
                maxLength: 500,
                onChanged: (_) => setState(() {}),
                style: TextStyle(color: c.textPrimary, fontSize: 13),
                decoration: const InputDecoration(
                  hintText:
                      'Mô tả chi tiết lỗi sản phẩm, không kích hoạt được hoặc sai so với thỏa thuận...',
                  counterText: '',
                ),
              ),
              const SizedBox(height: 4),
              Align(
                alignment: Alignment.centerRight,
                child: Text(
                  '${_reasonController.text.length} / 500 ký tự',
                  style: AppTokens.monoStyle(
                    color: c.textMuted,
                    fontSize: 10.5,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              if (_statusFeedback != null) ...[
                const SizedBox(height: 8),
                Text(
                  _statusFeedback!,
                  style: AppTokens.monoStyle(color: c.cyanText, fontSize: 11),
                ),
              ],
              const SizedBox(height: 18),
              ElevatedButton.icon(
                onPressed: _isSubmitting ? null : _confirmAndSubmit,
                icon: _isSubmitting
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.gavel_rounded, size: 18),
                label: Text(
                  _isSubmitting
                      ? 'Đang gửi hồ sơ AI...'
                      : 'Gửi Hồ Sơ Tới Trọng Tài AI Vision',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13.5,
                  ),
                ),
                style: AppTokens.primaryButtonStyle(
                  c,
                  backgroundColor: AppTokens.rose,
                  foregroundColor: Colors.white,
                  borderColor: c.roseBorder,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
