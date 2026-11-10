import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Global ThemeProvider managing Light (default) and Dark theme modes.
class ThemeProvider extends ChangeNotifier {
  ThemeProvider._internal();
  static final ThemeProvider instance = ThemeProvider._internal();

  /// Creates an isolated provider instance for widget tests.
  ThemeProvider.forTest([ThemeMode initial = ThemeMode.light])
      : _themeMode = initial;

  static const String _storageKey = 'trustpassz_theme_mode';

  ThemeMode _themeMode = ThemeMode.light;

  ThemeMode get themeMode => _themeMode;
  bool get isDarkMode => _themeMode == ThemeMode.dark;

  /// Loads persisted theme mode from SharedPreferences, defaulting to Light Mode.
  Future<void> loadSavedTheme() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString(_storageKey);
      if (saved == 'dark') {
        _themeMode = ThemeMode.dark;
      } else {
        _themeMode = ThemeMode.light;
      }
      notifyListeners();
    } catch (_) {
      // Keep default ThemeMode.light if storage is unavailable
    }
  }

  /// Sets and persists the active [ThemeMode].
  Future<void> setThemeMode(ThemeMode mode) async {
    if (_themeMode == mode) return;
    _themeMode = mode;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(
        _storageKey,
        mode == ThemeMode.dark ? 'dark' : 'light',
      );
    } catch (_) {
      // Ignore storage write errors in test environments
    }
  }

  /// Toggles between Light Mode and Dark Mode.
  Future<void> toggleTheme() async {
    final next =
        _themeMode == ThemeMode.light ? ThemeMode.dark : ThemeMode.light;
    await setThemeMode(next);
  }
}
