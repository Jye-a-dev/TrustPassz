import 'package:flutter/material.dart';
import '../models/deal_model.dart';
import '../services/auth_service.dart';
import '../services/deal_service.dart';
import '../theme/app_tokens.dart';
import '../utils/formatters.dart';
import 'deal_create/deal_create_sections.dart';

/// Screen 05: Create New Escrow Deal with 6 asset categories, quick amount chips,
/// 4 inspection duration pills (>= 44px), and client-side encrypted Vault payload.
class DealCreateScreen extends StatefulWidget {
  final ValueChanged<DealModel> onDealCreated;
  final VoidCallback? onBack;

  const DealCreateScreen({
    super.key,
    required this.onDealCreated,
    this.onBack,
  });

  @override
  State<DealCreateScreen> createState() => _DealCreateScreenState();
}

class _DealCreateScreenState extends State<DealCreateScreen> {
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _amountController =
      TextEditingController(text: '3600000');
  final TextEditingController _secretController = TextEditingController();
  final TextEditingController _descController = TextEditingController();

  String _selectedAssetType = 'SOURCE_CODE';
  int _selectedHours = 24;
  bool _isSubmitting = false;
  String? _errorMessage;

  static const List<int> _quickAmounts = [100000, 500000, 1000000, 5000000];

  @override
  void dispose() {
    _titleController.dispose();
    _amountController.dispose();
    _secretController.dispose();
    _descController.dispose();
    super.dispose();
  }

  String _mappedBackendAssetType() => _selectedAssetType == 'DESIGN_ASSET_UI'
      ? 'DESIGN_ASSET'
      : _selectedAssetType;

  void _applyAiMagicTemplate() {
    setState(() {
      _errorMessage = null;
      switch (_selectedAssetType) {
        case 'LICENSE_KEY':
          _titleController.text = 'License JetBrains All Products 1 Năm';
          _amountController.text = '1500000';
          _descController.text =
              'Bàn giao mã kích hoạt chính chủ kèm hóa đơn xác thực.';
          break;
        case 'DESIGN_ASSET':
          _titleController.text = 'Tài Liệu Kiến Trúc Microservices 2026';
          _amountController.text = '450000';
          _descController.text = 'PDF gốc không DRM kèm sơ đồ hệ thống.';
          break;
        case 'ACCOUNT_CREDENTIAL':
          _titleController.text = 'Gói API Cloud & Enterprise Token';
          _amountController.text = '2200000';
          _descController.text = 'Bàn giao credential có hạn mức sử dụng cam kết.';
          break;
        default:
          _titleController.text = 'Source Code AI Multi-Agent SaaS';
          _amountController.text = '3600000';
          _descController.text =
              'Bàn giao qua GitHub Private kèm cấu hình Docker đầy đủ.';
          break;
      }
    });
  }

  void _addQuickAmount(int delta) {
    final current = int.tryParse(
          _amountController.text.replaceAll(RegExp(r'[^0-9]'), ''),
        ) ??
        0;
    setState(() => _amountController.text = (current + delta).toString());
  }

  Future<void> _submitDeal() async {
    final title = _titleController.text.trim();
    final amountVal = double.tryParse(
          _amountController.text.replaceAll(RegExp(r'[^0-9]'), ''),
        ) ??
        0.0;

    if (title.isEmpty) {
      setState(() => _errorMessage = 'Vui lòng nhập tiêu đề hợp đồng ký quỹ.');
      return;
    }
    if (amountVal <= 0) {
      setState(() => _errorMessage = 'Số tiền ký quỹ phải lớn hơn 0 ₫.');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      final user = await AuthService.instance.getStoredUser();
      if (user == null || user.id.isEmpty) {
        throw Exception('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
      }

      final created = await DealService.instance.createDeal(
        sellerId: user.id,
        title: title,
        description: _descController.text.trim(),
        amount: amountVal,
        inspectionDurationSeconds: _selectedHours * 3600,
        assetType: _mappedBackendAssetType(),
        secretPayload: _secretController.text,
      );

      if (!mounted) return;
      _titleController.clear();
      _secretController.clear();
      _descController.clear();
      widget.onDealCreated(created);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.tp;
    final parsedAmount = double.tryParse(
          _amountController.text.replaceAll(RegExp(r'[^0-9]'), ''),
        ) ??
        0;

    return Scaffold(
      backgroundColor: c.canvas,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  if (widget.onBack != null) ...[
                    SizedBox(
                      width: 44,
                      height: 44,
                      child: OutlinedButton(
                        onPressed: widget.onBack,
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
                    const SizedBox(width: 10),
                  ],
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Tạo Giao Dịch Ký Quỹ Mới',
                          style: TextStyle(
                            color: c.textPrimary,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          'Khóa tiền an toàn qua Napas 24/7',
                          style: AppTokens.monoStyle(
                            color: c.textMuted,
                            fontSize: 10.5,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                  OutlinedButton.icon(
                    onPressed: _applyAiMagicTemplate,
                    icon: Icon(
                      Icons.auto_awesome_rounded,
                      size: 15,
                      color: c.cyanText,
                    ),
                    label: Text(
                      'AI Magic',
                      style: AppTokens.monoStyle(color: c.cyanText, fontSize: 11),
                    ),
                    style: AppTokens.outlinedButtonStyle(
                      c,
                      backgroundColor: c.cyanSoft,
                      borderColor: c.cyanBorder,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              if (_errorMessage != null) ...[
                Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: c.roseSoft,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: c.roseBorder),
                  ),
                  child: Text(
                    _errorMessage!,
                    style: TextStyle(color: c.roseText, fontSize: 12),
                  ),
                ),
              ],
              Text(
                'Loại tài sản số bàn giao',
                style: TextStyle(
                  color: c.textSecondary,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              AssetCategoryGrid(
                selectedId: _selectedAssetType,
                onSelect: (id) => setState(() => _selectedAssetType = id),
              ),
              const SizedBox(height: 14),
              Text(
                'Tiêu đề hợp đồng',
                style: TextStyle(
                  color: c.textSecondary,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: _titleController,
                style: TextStyle(color: c.textPrimary, fontSize: 13),
                decoration: const InputDecoration(
                  hintText: 'Ví dụ: Source Code AI Multi-Agent SaaS...',
                ),
              ),
              const SizedBox(height: 14),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Số tiền ký quỹ (VND)',
                    style: TextStyle(
                      color: c.textSecondary,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    'Phí ký quỹ: 0%',
                    style: AppTokens.monoStyle(color: c.emeraldText, fontSize: 11),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              TextField(
                controller: _amountController,
                keyboardType: TextInputType.number,
                onChanged: (_) => setState(() {}),
                style: AppTokens.monoStyle(
                  color: c.textPrimary,
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                ),
                decoration: InputDecoration(
                  hintText: 'Nhập số tiền VND...',
                  suffixText: parsedAmount > 0
                      ? TrustPasszFormatters.formatVnd(parsedAmount)
                      : null,
                  suffixStyle: AppTokens.monoStyle(
                    color: c.emeraldText,
                    fontSize: 11,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _quickAmounts.map((amt) {
                  final label =
                      '+${TrustPasszFormatters.formatNumber(amt ~/ 1000)}k';
                  return OutlinedButton(
                    onPressed: () => _addQuickAmount(amt),
                    style: AppTokens.outlinedButtonStyle(
                      c,
                      backgroundColor: c.surfaceSubtle,
                      minHeight: 44,
                    ),
                    child: Text(
                      label,
                      style: AppTokens.monoStyle(
                        color: c.textSecondary,
                        fontSize: 11.5,
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 14),
              Text(
                'Thời hạn đồng kiểm (Inspection Window)',
                style: TextStyle(
                  color: c.textSecondary,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              InspectionDurationRow(
                selectedHours: _selectedHours,
                onSelect: (h) => setState(() => _selectedHours = h),
              ),
              const SizedBox(height: 14),
              EncryptedVaultPayloadBox(controller: _secretController),
              const SizedBox(height: 18),
              ElevatedButton.icon(
                onPressed: _isSubmitting ? null : _submitDeal,
                icon: _isSubmitting
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Color(0xFF020617),
                        ),
                      )
                    : const Icon(Icons.arrow_forward_rounded, size: 18),
                label: Text(
                  _isSubmitting
                      ? 'Đang khởi tạo hợp đồng...'
                      : 'Tiếp Tục Tạo Giao Dịch Ký Quỹ',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13.5,
                  ),
                ),
                style: AppTokens.primaryButtonStyle(c),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
