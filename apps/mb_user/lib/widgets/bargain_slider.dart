import 'dart:async';
import 'package:flutter/material.dart';
import '../theme/app_tokens.dart';
import '../utils/formatters.dart';

/// Bargain Slider Widget V2 for TrustPassz Mobile.
/// Supports Light/Dark tokens, quick discount chips (-5%, -10%, -15%),
/// 10k VND rounding, and 300ms broadcast debounce.
class BargainSlider extends StatefulWidget {
  final String dealId;
  final double basePrice;
  final double? floorPrice;
  final double? initialOffer;
  final String currentUserId;
  final bool isBuyer;
  final bool disabled;
  final ValueChanged<double>? onOfferSubmit;
  final ValueChanged<double>? onPriceBroadcast;

  const BargainSlider({
    super.key,
    required this.dealId,
    required this.basePrice,
    this.floorPrice,
    this.initialOffer,
    required this.currentUserId,
    this.isBuyer = true,
    this.disabled = false,
    this.onOfferSubmit,
    this.onPriceBroadcast,
  });

  @override
  State<BargainSlider> createState() => _BargainSliderState();
}

class _BargainSliderState extends State<BargainSlider> {
  late double _minPrice;
  late double _maxPrice;
  late double _currentPrice;
  Timer? _debounceTimer;

  @override
  void initState() {
    super.initState();
    _initPriceBoundaries();
  }

  @override
  void didUpdateWidget(covariant BargainSlider oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.basePrice != widget.basePrice ||
        oldWidget.floorPrice != widget.floorPrice) {
      _initPriceBoundaries();
    }
  }

  void _initPriceBoundaries() {
    final floor = widget.floorPrice ?? (widget.basePrice * 0.7).roundToDouble();
    _minPrice = floor < 0 ? 0 : floor;
    _maxPrice = widget.basePrice < _minPrice ? _minPrice : widget.basePrice;

    final initial = widget.initialOffer;
    if (initial != null && initial >= _minPrice && initial <= _maxPrice) {
      _currentPrice = initial;
    } else {
      _currentPrice = ((_minPrice + _maxPrice) / 2).roundToDouble();
    }
  }

  void _onSliderChanged(double value) {
    if (widget.disabled) return;
    final steppedValue =
        ((value / 10000).round() * 10000.0).clamp(_minPrice, _maxPrice);
    setState(() {
      _currentPrice = steppedValue;
    });

    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 300), () {
      widget.onPriceBroadcast?.call(_currentPrice);
    });
  }

  void _applyDiscountChip(double rate) {
    if (widget.disabled) return;
    final rawTarget = widget.basePrice * (1 - rate);
    final stepped =
        ((rawTarget / 10000).round() * 10000.0).clamp(_minPrice, _maxPrice);
    setState(() {
      _currentPrice = stepped;
    });
    widget.onPriceBroadcast?.call(_currentPrice);
  }

  int get _discountPercent {
    if (widget.basePrice <= 0) return 0;
    return (((widget.basePrice - _currentPrice) / widget.basePrice) * 100)
        .round();
  }

  double get _discountAmount =>
      (widget.basePrice - _currentPrice).clamp(0.0, widget.basePrice);

  @override
  void dispose() {
    _debounceTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.tp;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: AppTokens.cardDecoration(c, radius: 22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.isBuyer
                          ? 'Thanh Thương Lượng Giá'
                          : 'Đề Xuất Giá Từ Người Mua',
                      style: TextStyle(
                        color: c.textPrimary,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Kéo thanh ngang hoặc chọn nhanh mức giảm giá',
                      style: TextStyle(color: c.textMuted, fontSize: 11),
                    ),
                  ],
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: _discountPercent > 0 ? c.cyanSoft : c.surfaceSubtle,
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(
                    color: _discountPercent > 0 ? c.cyanBorder : c.border,
                  ),
                ),
                child: Text(
                  _discountPercent > 0
                      ? 'Giảm $_discountPercent% (-${TrustPasszFormatters.formatNumber(_discountAmount ~/ 1000)}k)'
                      : 'Giá gốc (0%)',
                  style: AppTokens.monoStyle(
                    color: _discountPercent > 0 ? c.cyanText : c.textMuted,
                    fontSize: 10.5,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Price Display Container
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: c.surfaceSubtle,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: c.border),
            ),
            child: Column(
              children: [
                Text(
                  'ĐỀ XUẤT GIÁ THANH TOÁN MỚI',
                  style: AppTokens.monoStyle(
                    color: c.textMuted,
                    fontSize: 10,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  TrustPasszFormatters.formatVnd(_currentPrice),
                  style: AppTokens.monoStyle(
                    color: c.cyanText,
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Slider
          SliderTheme(
            data: SliderTheme.of(context).copyWith(
              trackHeight: 6,
              activeTrackColor: AppTokens.cyan,
              inactiveTrackColor: c.surfaceSubtle,
              thumbColor: AppTokens.cyan,
              overlayColor: AppTokens.cyan.withValues(alpha: 0.18),
              thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 14),
              trackShape: const RoundedRectSliderTrackShape(),
            ),
            child: Slider(
              value: _currentPrice.clamp(_minPrice, _maxPrice),
              min: _minPrice,
              max: _maxPrice,
              divisions: (_maxPrice > _minPrice)
                  ? ((_maxPrice - _minPrice) / 10000).round().clamp(1, 1000)
                  : 1,
              onChanged: widget.disabled ? null : _onSliderChanged,
            ),
          ),

          // Boundary Labels
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 6),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Sàn: ${TrustPasszFormatters.formatVnd(_minPrice)}',
                  style: AppTokens.monoStyle(
                    color: c.textMuted,
                    fontSize: 10.5,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  'Gốc: ${TrustPasszFormatters.formatVnd(_maxPrice)}',
                  style: AppTokens.monoStyle(
                    color: c.textMuted,
                    fontSize: 10.5,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // 3 Quick Discount Chips (-5%, -10%, -15%) with >= 44px touch target
          Row(
            children: [
              _discountChip(c, 0.05, '-5%'),
              const SizedBox(width: 8),
              _discountChip(c, 0.10, '-10%'),
              const SizedBox(width: 8),
              _discountChip(c, 0.15, '-15%'),
            ],
          ),

          if (widget.onOfferSubmit != null) ...[
            const SizedBox(height: 14),
            ElevatedButton.icon(
              onPressed: widget.disabled
                  ? null
                  : () => widget.onOfferSubmit!(_currentPrice),
              icon: const Icon(Icons.check_circle_outline, size: 18),
              label: Text(
                'Gửi Đề Xuất Giá (${TrustPasszFormatters.formatVnd(_currentPrice)})',
                style: const TextStyle(
                    fontWeight: FontWeight.bold, fontSize: 13.5),
              ),
              style: AppTokens.primaryButtonStyle(c),
            ),
          ],
        ],
      ),
    );
  }

  Widget _discountChip(AppColorPalette c, double rate, String label) {
    final targetPct = (rate * 100).round();
    final isSelected = (_discountPercent - targetPct).abs() <= 1;

    return Expanded(
      child: OutlinedButton(
        onPressed: widget.disabled ? null : () => _applyDiscountChip(rate),
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(44, 44),
          backgroundColor: isSelected ? c.cyanSoft : c.surfaceSubtle,
          foregroundColor: isSelected ? c.cyanText : c.textSecondary,
          side: BorderSide(
            color: isSelected ? AppTokens.cyan : c.borderStrong,
            width: 1.0,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: Text(
          label,
          style: AppTokens.monoStyle(
            color: isSelected ? c.cyanText : c.textSecondary,
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
