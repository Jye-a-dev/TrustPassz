import 'dart:async';
import 'package:flutter/services.dart';

/// Secure Clipboard Service with automatic 30-second memory sanitization.
/// Guarantees that sensitive banking data (account numbers, escrow memos)
/// does not persist indefinitely in the device clipboard.
class SecureClipboardService {
  SecureClipboardService._internal();

  static final SecureClipboardService instance = SecureClipboardService._internal();

  Timer? _clearTimer;
  String? _lastCopiedText;

  /// Duration before sensitive data is purged from the device clipboard.
  static const Duration clearDuration = Duration(seconds: 30);

  /// Copies sensitive text to the system clipboard and schedules a 30s auto-clear.
  Future<bool> copy(String text) async {
    try {
      await Clipboard.setData(ClipboardData(text: text));
      _lastCopiedText = text;

      // Reset any active timer to prevent premature clearing of newly copied content
      _clearTimer?.cancel();
      _clearTimer = Timer(clearDuration, () async {
        await clearIfMatching();
      });

      return true;
    } catch (_) {
      return false;
    }
  }

  /// Clears clipboard only if the content still matches the sensitive text originally written.
  Future<void> clearIfMatching() async {
    try {
      if (_lastCopiedText == null) return;

      final currentData = await Clipboard.getData(Clipboard.kTextPlain);
      if (currentData?.text == _lastCopiedText) {
        await Clipboard.setData(const ClipboardData(text: ''));
      }
    } catch (_) {
      // Fallback: force blanking if reading clipboard fails due to OS security restriction
      await Clipboard.setData(const ClipboardData(text: ''));
    } finally {
      _lastCopiedText = null;
      _clearTimer?.cancel();
      _clearTimer = null;
    }
  }

  /// Immediately purges the clipboard and cancels any pending countdown.
  Future<void> forceClear() async {
    _clearTimer?.cancel();
    _clearTimer = null;
    _lastCopiedText = null;
    try {
      await Clipboard.setData(const ClipboardData(text: ''));
    } catch (_) {}
  }

  /// Disposes active timers when application tears down.
  void dispose() {
    _clearTimer?.cancel();
    _clearTimer = null;
  }
}

