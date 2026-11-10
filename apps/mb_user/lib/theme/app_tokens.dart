import 'package:flutter/material.dart';

/// Semantic and surface color palette supporting both Light (default) and Dark modes.
@immutable
class AppColorPalette extends ThemeExtension<AppColorPalette> {
  final Brightness brightness;
  final Color canvas;
  final Color surface;
  final Color surfaceSubtle;
  final Color border;
  final Color borderStrong;
  final Color textPrimary;
  final Color textSecondary;
  final Color textMuted;
  final Color emerald;
  final Color emeraldSoft;
  final Color emeraldBorder;
  final Color emeraldText;
  final Color cyan;
  final Color cyanSoft;
  final Color cyanBorder;
  final Color cyanText;
  final Color amber;
  final Color amberSoft;
  final Color amberBorder;
  final Color amberText;
  final Color rose;
  final Color roseSoft;
  final Color roseBorder;
  final Color roseText;
  final Color violet;
  final Color violetSoft;
  final Color violetBorder;

  const AppColorPalette({
    required this.brightness,
    required this.canvas,
    required this.surface,
    required this.surfaceSubtle,
    required this.border,
    required this.borderStrong,
    required this.textPrimary,
    required this.textSecondary,
    required this.textMuted,
    required this.emerald,
    required this.emeraldSoft,
    required this.emeraldBorder,
    required this.emeraldText,
    required this.cyan,
    required this.cyanSoft,
    required this.cyanBorder,
    required this.cyanText,
    required this.amber,
    required this.amberSoft,
    required this.amberBorder,
    required this.amberText,
    required this.rose,
    required this.roseSoft,
    required this.roseBorder,
    required this.roseText,
    required this.violet,
    required this.violetSoft,
    required this.violetBorder,
  });

  bool get isDark => brightness == Brightness.dark;

  static const AppColorPalette light = AppColorPalette(
    brightness: Brightness.light,
    canvas: Color(0xFFFAFAFB),
    surface: Color(0xFFFFFFFF),
    surfaceSubtle: Color(0xFFF1F5F9),
    border: Color(0xFFE2E8F0),
    borderStrong: Color(0xFFCBD5E1),
    textPrimary: Color(0xFF0F172A),
    textSecondary: Color(0xFF334155),
    textMuted: Color(0xFF64748B),
    emerald: Color(0xFF10B981),
    emeraldSoft: Color(0xFFECFDF5),
    emeraldBorder: Color(0xFF6EE7B7),
    emeraldText: Color(0xFF047857),
    cyan: Color(0xFF06B6D4),
    cyanSoft: Color(0xFFECFEFF),
    cyanBorder: Color(0xFF67E8F9),
    cyanText: Color(0xFF0E7490),
    amber: Color(0xFFF59E0B),
    amberSoft: Color(0xFFFFFBEB),
    amberBorder: Color(0xFFFCD34D),
    amberText: Color(0xFFB45309),
    rose: Color(0xFFF43F5E),
    roseSoft: Color(0xFFFFF1F2),
    roseBorder: Color(0xFFFDA4AF),
    roseText: Color(0xFFBE123C),
    violet: Color(0xFF8B5CF6),
    violetSoft: Color(0xFFF5F3FF),
    violetBorder: Color(0xFFC4B5FD),
  );

  static const AppColorPalette dark = AppColorPalette(
    brightness: Brightness.dark,
    canvas: Color(0xFF080C14),
    surface: Color(0xFF0F172A),
    surfaceSubtle: Color(0xFF020617),
    border: Color(0xFF1E293B),
    borderStrong: Color(0xFF334155),
    textPrimary: Color(0xFFF8FAFC),
    textSecondary: Color(0xFFCBD5E1),
    textMuted: Color(0xFF94A3B8),
    emerald: Color(0xFF10B981),
    emeraldSoft: Color(0xFF064E3B),
    emeraldBorder: Color(0xFF059669),
    emeraldText: Color(0xFF34D399),
    cyan: Color(0xFF06B6D4),
    cyanSoft: Color(0xFF083344),
    cyanBorder: Color(0xFF0891B2),
    cyanText: Color(0xFF22D3EE),
    amber: Color(0xFFF59E0B),
    amberSoft: Color(0xFF451A03),
    amberBorder: Color(0xFFD97706),
    amberText: Color(0xFFFBBF24),
    rose: Color(0xFFF43F5E),
    roseSoft: Color(0xFF4C0519),
    roseBorder: Color(0xFFE11D48),
    roseText: Color(0xFFFDA4AF),
    violet: Color(0xFF8B5CF6),
    violetSoft: Color(0xFF2E1065),
    violetBorder: Color(0xFF7C3AED),
  );

  @override
  AppColorPalette copyWith({Brightness? brightness}) {
    if (brightness == Brightness.dark) return dark;
    if (brightness == Brightness.light) return light;
    return this;
  }

  @override
  AppColorPalette lerp(ThemeExtension<AppColorPalette>? other, double t) {
    if (other is! AppColorPalette) return this;
    return t < 0.5 ? this : other;
  }
}

/// TrustPassz Design Tokens v2.0 (Light Mode Default + Dual-Theme Support).
class AppTokens {
  const AppTokens._();

  // Light Palette
  static const Color lightCanvas = Color(0xFFFAFAFB);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightBorder = Color(0xFFE2E8F0);
  static const Color lightBorderStrong = Color(0xFFCBD5E1);

  // Dark Palette
  static const Color darkCanvas = Color(0xFF080C14);
  static const Color darkSurface = Color(0xFF0F172A);
  static const Color darkBorder = Color(0xFF1E293B);

  // Semantic Colors
  static const Color emerald = Color(0xFF10B981);
  static const Color emeraldDark = Color(0xFF059669);
  static const Color cyan = Color(0xFF06B6D4);
  static const Color cyanBright = Color(0xFF22D3EE);
  static const Color amber = Color(0xFFF59E0B);
  static const Color rose = Color(0xFFF43F5E);
  static const Color violet = Color(0xFF8B5CF6);
  static const Color googleBlue = Color(0xFF2563EB);
  static const Color textDark = Color(0xFF0F172A);
  static const Color textMuted = Color(0xFF64748B);

  // Ergonomic Touch Target & Radius Tokens
  static const double minTouchTarget = 44.0;
  static const double primaryButtonHeight = 48.0;
  static const double borderWidth = 1.0;
  static const double cardRadius = 20.0;
  static const double buttonRadius = 12.0;

  static AppColorPalette colorsOf(BuildContext context) {
    final ext = Theme.of(context).extension<AppColorPalette>();
    if (ext != null) return ext;
    return Theme.of(context).brightness == Brightness.dark
        ? AppColorPalette.dark
        : AppColorPalette.light;
  }

  /// Monospace tabular figures style for VND balances, TxHashes, and countdowns.
  static TextStyle monoStyle({
    required Color color,
    double fontSize = 13,
    FontWeight fontWeight = FontWeight.w700,
    double? letterSpacing,
  }) {
    return TextStyle(
      color: color,
      fontSize: fontSize,
      fontWeight: fontWeight,
      fontFamily: 'monospace',
      letterSpacing: letterSpacing,
      fontFeatures: const [FontFeature.tabularFigures()],
    );
  }

  /// Standard bordered card decoration.
  static BoxDecoration cardDecoration(
    AppColorPalette c, {
    double radius = cardRadius,
    Color? backgroundColor,
    Color? borderColor,
    double borderWidth = AppTokens.borderWidth,
  }) {
    return BoxDecoration(
      color: backgroundColor ?? c.surface,
      borderRadius: BorderRadius.circular(radius),
      border: Border.all(
        color: borderColor ?? c.border,
        width: borderWidth,
      ),
      boxShadow: c.isDark
          ? const [
              BoxShadow(
                color: Color(0x28000000),
                blurRadius: 12,
                offset: Offset(0, 4),
              ),
            ]
          : const [
              BoxShadow(
                color: Color(0x0A0F172A),
                blurRadius: 10,
                offset: Offset(0, 3),
              ),
            ],
    );
  }

  /// Primary Emerald CTA button style with mandatory 1.0px border and >= 48px height.
  static ButtonStyle primaryButtonStyle(
    AppColorPalette c, {
    Color? backgroundColor,
    Color? foregroundColor,
    Color? borderColor,
    double minHeight = primaryButtonHeight,
  }) {
    final bg = backgroundColor ?? emerald;
    final fg = foregroundColor ?? const Color(0xFF020617);
    final bc = borderColor ?? (c.isDark ? const Color(0xFF34D399) : emeraldDark);
    return ElevatedButton.styleFrom(
      backgroundColor: bg,
      foregroundColor: fg,
      minimumSize: Size(minTouchTarget, minHeight),
      elevation: 0,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(buttonRadius),
        side: BorderSide(color: bc, width: borderWidth),
      ),
    );
  }

  /// Outlined secondary button style with mandatory 1.0px border and >= 44px height.
  static ButtonStyle outlinedButtonStyle(
    AppColorPalette c, {
    Color? foregroundColor,
    Color? borderColor,
    Color? backgroundColor,
    double minHeight = minTouchTarget,
  }) {
    return OutlinedButton.styleFrom(
      backgroundColor: backgroundColor ?? c.surface,
      foregroundColor: foregroundColor ?? c.textPrimary,
      minimumSize: Size(minTouchTarget, minHeight),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      side: BorderSide(
        color: borderColor ?? c.borderStrong,
        width: borderWidth,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(buttonRadius),
      ),
    );
  }

  static ThemeData get lightTheme => _buildTheme(AppColorPalette.light);
  static ThemeData get darkTheme => _buildTheme(AppColorPalette.dark);

  static ThemeData _buildTheme(AppColorPalette c) {
    final isDark = c.isDark;
    return ThemeData(
      useMaterial3: true,
      brightness: c.brightness,
      scaffoldBackgroundColor: c.canvas,
      colorScheme: ColorScheme(
        brightness: c.brightness,
        primary: emerald,
        onPrimary: const Color(0xFF020617),
        secondary: cyan,
        onSecondary: const Color(0xFF020617),
        error: rose,
        onError: Colors.white,
        surface: c.surface,
        onSurface: c.textPrimary,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: c.canvas,
        foregroundColor: c.textPrimary,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      cardTheme: CardThemeData(
        color: c.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(cardRadius),
          side: BorderSide(color: c.border, width: borderWidth),
        ),
      ),
      dividerColor: c.border,
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          minimumSize: const Size(minTouchTarget, primaryButtonHeight),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(buttonRadius),
            side: BorderSide(
              color: isDark ? const Color(0xFF34D399) : emeraldDark,
              width: borderWidth,
            ),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(minTouchTarget, minTouchTarget),
          side: BorderSide(color: c.borderStrong, width: borderWidth),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(buttonRadius),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          minimumSize: const Size(minTouchTarget, minTouchTarget),
          side: BorderSide(color: c.border, width: borderWidth),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(buttonRadius),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: c.surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        hintStyle: TextStyle(color: c.textMuted, fontSize: 13),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(buttonRadius),
          borderSide: BorderSide(color: c.borderStrong, width: borderWidth),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(buttonRadius),
          borderSide: BorderSide(color: c.borderStrong, width: borderWidth),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(buttonRadius),
          borderSide: const BorderSide(color: cyan, width: 1.5),
        ),
      ),
      extensions: <ThemeExtension<dynamic>>[c],
    );
  }
}

extension TrustPasszThemeContext on BuildContext {
  AppColorPalette get tp => AppTokens.colorsOf(this);
}
