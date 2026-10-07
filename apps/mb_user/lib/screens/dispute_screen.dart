import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../services/deal_service.dart';
import '../services/auth_service.dart';

class DisputeScreen extends StatefulWidget {
  final String? initialDealId;
  final VoidCallback onBack;

  const DisputeScreen({
    super.key,
    this.initialDealId,
    required this.onBack,
  });

  @override
  State<DisputeScreen> createState() => _DisputeScreenState();
}

class _DisputeScreenState extends State<DisputeScreen> {
  late final TextEditingController _dealIdController;
  final TextEditingController _reasonController = TextEditingController();
  final ImagePicker _picker = ImagePicker();

  final List<XFile> _selectedFiles = [];
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

      if (picked != null) {
        setState(() {
          _selectedFiles.add(picked);
          _statusFeedback = 'Đã chọn ảnh bằng chứng: ${picked.name}';
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi truy cập máy ảnh: $e'),
          backgroundColor: const Color(0xFFF43F5E),
        ),
      );
    }
  }

  Future<void> _handleSubmit() async {
    final dealId = _dealIdController.text.trim();
    final reason = _reasonController.text.trim();

    if (dealId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng nhập Deal ID cần khiếu nại')),
      );
      return;
    }

    if (reason.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng nhập lý do khiếu nại chi tiết')),
      );
      return;
    }

    if (_selectedFiles.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng đính kèm ít nhất 1 ảnh bằng chứng')),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
      _statusFeedback = 'Đang kích hoạt AI Arbitrator Pipeline...';
    });

    try {
      final user = await AuthService.instance.getStoredUser();
      final initiatorId = user?.id ?? 'user_client_initiator';

      await DealService.instance.submitDispute(
        dealId: dealId,
        initiatorId: initiatorId,
        reason: reason,
        filePaths: _selectedFiles.map((f) => f.path).toList(),
      );

      if (!mounted) return;
      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          backgroundColor: const Color(0xFF0F172A),
          title: const Row(
            children: [
              Icon(Icons.check_circle, color: Color(0xFF10B981)),
              SizedBox(width: 8),
              Text(
                'Khiếu Nại Đã Gửi!',
                style: TextStyle(color: Colors.white, fontSize: 16),
              ),
            ],
          ),
          content: const Text(
            'Hồ sơ tranh chấp đã được gửi tới AI Arbitrator. Hệ thống thị giác máy tính đang phân tích chứng cứ và sẽ phản hồi trong vài phút.',
            style: TextStyle(color: Color(0xFFCBD5E1), fontSize: 13),
          ),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                widget.onBack();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
              ),
              child: const Text('Hoàn tất'),
            ),
          ],
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi gửi khiếu nại: $e'),
          backgroundColor: const Color(0xFFF43F5E),
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF080C14),
      appBar: AppBar(
        backgroundColor: const Color(0xFF080C14),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: widget.onBack,
        ),
        title: const Text(
          'Khiếu Nại Trọng Tài AI',
          style: TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Notice Card
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF4C0519).withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFF43F5E).withValues(alpha: 0.4)),
                ),
                child: const Row(
                  children: [
                    Text('⚖️', style: TextStyle(fontSize: 22)),
                    SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'AI Arbitrator Phân Xử Minh Bạch',
                            style: TextStyle(
                              color: Color(0xFFFDA4AF),
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'Mô hình Vision AI đối chiếu thông tin sản phẩm và bằng chứng vi phạm của bạn để ra phán quyết tự động.',
                            style: TextStyle(color: Color(0xFFFECDD3), fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Deal ID Input
              const Text(
                'MÃ DEAL (GIAO DỊCH)',
                style: TextStyle(
                  color: Color(0xFF94A3B8),
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'monospace',
                ),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: _dealIdController,
                style: const TextStyle(color: Colors.white, fontFamily: 'monospace'),
                decoration: InputDecoration(
                  filled: true,
                  fillColor: const Color(0xFF0F172A),
                  hintText: 'Nhập Deal ID...',
                  hintStyle: const TextStyle(color: Color(0xFF475569)),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFF1E293B)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFF1E293B)),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Reason Description Input
              const Text(
                'LÝ DO KHIẾU NẠI CHI TIẾT',
                style: TextStyle(
                  color: Color(0xFF94A3B8),
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'monospace',
                ),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: _reasonController,
                maxLines: 4,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  filled: true,
                  fillColor: const Color(0xFF0F172A),
                  hintText:
                      'Mô tả chi tiết lỗi sản phẩm, không mở được tài khoản, tài sản sai so với thỏa thuận...',
                  hintStyle: const TextStyle(color: Color(0xFF475569)),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFF1E293B)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFF1E293B)),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Evidence Capture Buttons
              const Text(
                'BẰNG CHỨNG HÌNH ẢNH / VIDEO',
                style: TextStyle(
                  color: Color(0xFF94A3B8),
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'monospace',
                ),
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _pickImage(ImageSource.camera),
                      icon: const Icon(Icons.camera_alt, size: 16),
                      label: const Text('Chụp Ảnh'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF22D3EE),
                        side: const BorderSide(color: Color(0xFF0891B2)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _pickImage(ImageSource.gallery),
                      icon: const Icon(Icons.photo_library, size: 16),
                      label: const Text('Chọn Thư Viện'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF22D3EE),
                        side: const BorderSide(color: Color(0xFF0891B2)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                ],
              ),

              // Attached Files List
              if (_selectedFiles.isNotEmpty) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF1E293B)),
                  ),
                  child: Column(
                    children: _selectedFiles.map((file) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(
                          children: [
                            const Icon(Icons.image, size: 16, color: Color(0xFF10B981)),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                file.name,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontFamily: 'monospace',
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.close, size: 16, color: Color(0xFFF43F5E)),
                              onPressed: () {
                                setState(() {
                                  _selectedFiles.remove(file);
                                });
                              },
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],

              if (_statusFeedback != null) ...[
                const SizedBox(height: 12),
                Text(
                  _statusFeedback!,
                  style: const TextStyle(color: Color(0xFF38BDF8), fontSize: 11),
                ),
              ],
              const SizedBox(height: 24),

              // Submit Button
              ElevatedButton(
                onPressed: _isSubmitting ? null : _handleSubmit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFF43F5E),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  elevation: 6,
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text(
                        '⚖️ Kích Hoạt AI Arbitrator Giải Quyết',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
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
