/// Shared formatting utilities for VND currency, deal/transaction IDs, and timers.
class TrustPasszFormatters {
  const TrustPasszFormatters._();

  /// Formats a numeric VND amount with dot thousand separators and `₫` suffix.
  static String formatVnd(double amount) {
    final isNegative = amount < 0;
    final intVal = amount.abs().round();
    final digits = intVal.toString();
    final buffer = StringBuffer();
    for (int i = 0; i < digits.length; i++) {
      if (i > 0 && (digits.length - i) % 3 == 0) {
        buffer.write('.');
      }
      buffer.write(digits[i]);
    }
    final prefix = isNegative ? '-' : '';
    return '$prefix${buffer.toString()} ₫';
  }

  /// Formats an integer count without currency suffix (e.g. "3.600.000").
  static String formatNumber(num value) {
    final isNegative = value < 0;
    final digits = value.abs().round().toString();
    final buffer = StringBuffer();
    for (int i = 0; i < digits.length; i++) {
      if (i > 0 && (digits.length - i) % 3 == 0) {
        buffer.write('.');
      }
      buffer.write(digits[i]);
    }
    return '${isNegative ? '-' : ''}${buffer.toString()}';
  }

  /// Shortens a UUID or hash into `#TPZ-XXXX` or `#abcd...ef12`.
  static String formatDealCode(String id) {
    final cleaned = id.trim();
    if (cleaned.isEmpty) return '#TPZ-0000';
    if (cleaned.length <= 8) return '#${cleaned.toUpperCase()}';
    return '#TPZ-${cleaned.substring(0, 5).toUpperCase()}';
  }

  /// Shortens an on-chain TxHash like `0x82a9...ef41`.
  static String shortTxHash(String? hash) {
    if (hash == null || hash.trim().isEmpty) return '0x0000...0000';
    final trimmed = hash.trim();
    if (trimmed.length <= 12) return trimmed;
    return '${trimmed.substring(0, 6)}...${trimmed.substring(trimmed.length - 4)}';
  }

  /// Formats a [Duration] into `HH:MM:SS`.
  static String formatHms(Duration duration) {
    final safe = duration.isNegative ? Duration.zero : duration;
    String two(int n) => n.toString().padLeft(2, '0');
    return '${two(safe.inHours)}:${two(safe.inMinutes.remainder(60))}:${two(safe.inSeconds.remainder(60))}';
  }

  /// Formats total seconds into `MM:SS`.
  static String formatMmSs(int totalSeconds) {
    final safe = totalSeconds < 0 ? 0 : totalSeconds;
    final m = (safe ~/ 60).toString().padLeft(2, '0');
    final s = (safe % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  /// Formats an ISO 8601 timestamp into a concise Vietnamese relative or date string.
  static String formatTimestamp(String? isoString) {
    if (isoString == null || isoString.isEmpty) return 'Vừa xong';
    try {
      final dt = DateTime.parse(isoString).toLocal();
      final now = DateTime.now();
      final diff = now.difference(dt);

      if (diff.inMinutes < 1) return 'Vừa xong';
      if (diff.inMinutes < 60) return '${diff.inMinutes} phút trước';
      if (diff.inHours < 24) return '${diff.inHours} giờ trước';
      String two(int n) => n.toString().padLeft(2, '0');
      return '${two(dt.day)}/${two(dt.month)}/${dt.year}';
    } catch (_) {
      return 'Gần đây';
    }
  }
}
