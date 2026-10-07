import 'dart:async';
import 'package:flutter/material.dart';

/// Bargain Slider Widget for TrustPassz Mobile.
/// Implements horizontal-only gesture tracking to ensure smooth sliding without
/// hijacking or blocking the parent vertical scroll view.
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

    // Round to nearest 10,000 VND step
    final steppedValue = (value / 10000).round() * 10000.0;
    setState(() {
      _currentPrice = steppedValue;
    });

    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 300), () {
      widget.onPriceBroadcast?.call(_currentPrice);
    });
  }

  int get _discountPercent {
    if (widget.basePrice <= 0) return 0;
    return (((widget.basePrice - _currentPrice) / widget.basePrice) * 100)
        .round();
  }

  String _formatVnd(double amount) {
    final intVal = amount.toInt();
    final chars = intVal.toString().split('').reversed.toList();
    final buffer = StringBuffer();
    for (int i = 0; i < chars.length; i++) {
      if (i > 0 && i % 3 == 0) {
        buffer.write('.');
      }
      buffer.write(chars[i]);
    }
    return '${buffer.toString().split('').reversed.join()} ₫';
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A), // Slate 900
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF1E293B)), // Slate 800
        boxShadow: const [
          BoxShadow(
            color: Colors.black45,
            blurRadius: 16,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Row(
            children: [
              const Icon(Icons.trending_down,
                  color: Color(0xFF22D3EE), size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.isBuyer
                          ? 'Thanh Thương Lượng Giá'
                          : 'Đề Xuất Giá Từ Người Mua',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const Text(
                      'Kéo thanh ngang để đề xuất mức giá bạn mong muốn',
                      style: TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Price & Discount Display
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFF020617), // Slate 950
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFF1E293B)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'MỨC GIÁ ĐANG ĐỀ XUẤT',
                      style: TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _formatVnd(_currentPrice),
                      style: const TextStyle(
                        color: Color(0xFF22D3EE),
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ],
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: _discountPercent > 0
                        ? const Color(0xFF064E3B).withValues(alpha: 0.6)
                        : const Color(0xFF1E293B),
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(
                      color: _discountPercent > 0
                          ? const Color(0xFF10B981)
                          : const Color(0xFF334155),
                    ),
                  ),
                  child: Text(
                    _discountPercent > 0
                        ? '-$_discountPercent%'
                        : 'Giá gốc (0%)',
                    style: TextStyle(
                      color: _discountPercent > 0
                          ? const Color(0xFF34D399)
                          : const Color(0xFF94A3B8),
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'monospace',
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Horizontal Slider with non-blocking gesture arena configuration
          SliderTheme(
            data: SliderTheme.of(context).copyWith(
              trackHeight: 6,
              activeTrackColor: const Color(0xFF06B6D4),
              inactiveTrackColor: const Color(0xFF020617),
              thumbColor: const Color(0xFF22D3EE),
              overlayColor: const Color(0xFF06B6D4).withValues(alpha: 0.2),
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
                  'Giá thấp nhất: ${_formatVnd(_minPrice)}',
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 11,
                    fontFamily: 'monospace',
                  ),
                ),
                Text(
                  'Giá ban đầu: ${_formatVnd(_maxPrice)}',
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 11,
                    fontFamily: 'monospace',
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Confirm Button
          if (widget.onOfferSubmit != null)
            ElevatedButton(
              onPressed: widget.disabled
                  ? null
                  : () => widget.onOfferSubmit!(_currentPrice),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF06B6D4),
                foregroundColor: const Color(0xFF020617),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
                elevation: 4,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.check_circle_outline, size: 18),
                  const SizedBox(width: 8),
                  Text(
                    'Xác nhận đề xuất ${_formatVnd(_currentPrice)}',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
