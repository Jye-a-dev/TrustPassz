import 'dart:async';
import 'package:flutter/material.dart';
import '../models/notification_payload.dart';
import '../theme/app_tokens.dart';

/// Heads-Up Toast HUD displayed in Foreground when an FCM escrow event arrives.
class InAppNotificationHud extends StatefulWidget {
  final EscrowNotificationPayload payload;
  final VoidCallback onTap;
  final VoidCallback onDismiss;
  final Duration autoHideDuration;

  const InAppNotificationHud({
    super.key,
    required this.payload,
    required this.onTap,
    required this.onDismiss,
    this.autoHideDuration = const Duration(seconds: 5),
  });

  @override
  State<InAppNotificationHud> createState() => _InAppNotificationHudState();
}

class _InAppNotificationHudState extends State<InAppNotificationHud>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<Offset> _slideAnimation;
  late final Animation<double> _fadeAnimation;
  Timer? _autoDismissTimer;
  bool _isDismissing = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 280),
      reverseDuration: const Duration(milliseconds: 200),
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, -1.15),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutCubic,
      reverseCurve: Curves.easeInCubic,
    ));
    _fadeAnimation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOut,
    );

    _controller.forward();
    _scheduleAutoHide();
  }

  @override
  void didUpdateWidget(covariant InAppNotificationHud oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.payload.dealId != widget.payload.dealId ||
        oldWidget.payload.type != widget.payload.type ||
        oldWidget.payload.displayBody != widget.payload.displayBody) {
      _isDismissing = false;
      _controller.forward(from: 0);
      _scheduleAutoHide();
    }
  }

  void _scheduleAutoHide() {
    _autoDismissTimer?.cancel();
    _autoDismissTimer = Timer(widget.autoHideDuration, _dismissAnimated);
  }

  Future<void> _dismissAnimated() async {
    if (_isDismissing || !mounted) return;
    _isDismissing = true;
    _autoDismissTimer?.cancel();
    await _controller.reverse();
    if (mounted) {
      widget.onDismiss();
    }
  }

  @override
  void dispose() {
    _autoDismissTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  _HudTheme _resolveTheme(AppColorPalette c, EscrowEventType type) {
    switch (type) {
      case EscrowEventType.depositSuccess:
        return _HudTheme(
          accent: AppTokens.emerald,
          accentText: c.emeraldText,
          accentBg: c.emeraldSoft,
          badgeLabel: 'ĐÃ KHÓA CỌC',
          icon: Icons.verified_user_rounded,
        );
      case EscrowEventType.vaultUnlocked:
        return _HudTheme(
          accent: AppTokens.violet,
          accentText: AppTokens.violet,
          accentBg: c.violetSoft,
          badgeLabel: 'VAULT ĐÃ MỞ',
          icon: Icons.lock_open_rounded,
        );
      case EscrowEventType.newDeal:
      case EscrowEventType.offerUpdated:
      case EscrowEventType.unknown:
        return _HudTheme(
          accent: AppTokens.cyan,
          accentText: c.cyanText,
          accentBg: c.cyanSoft,
          badgeLabel: 'ESCROW LIVE',
          icon: Icons.notifications_active_rounded,
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.tp;
    final theme = _resolveTheme(c, widget.payload.type);
    final figure = widget.payload.formattedFigure;

    return SafeArea(
      bottom: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
        child: SlideTransition(
          position: _slideAnimation,
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: GestureDetector(
              onVerticalDragEnd: (details) {
                if ((details.primaryVelocity ?? 0) < -120) {
                  _dismissAnimated();
                }
              },
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () {
                    _autoDismissTimer?.cancel();
                    widget.onTap();
                  },
                  borderRadius: BorderRadius.circular(18),
                  child: Container(
                    constraints: const BoxConstraints(maxWidth: 640),
                    padding: const EdgeInsets.fromLTRB(14, 12, 8, 12),
                    decoration: BoxDecoration(
                      color: c.surface,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(
                        color: theme.accent.withValues(alpha: 0.7),
                        width: 1.2,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: c.isDark ? 0.5 : 0.14),
                          blurRadius: 16,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: theme.accentBg,
                            borderRadius: BorderRadius.circular(11),
                            border: Border.all(
                              color: theme.accent.withValues(alpha: 0.5),
                            ),
                          ),
                          child: Icon(theme.icon, color: theme.accentText, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 6,
                                      vertical: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: theme.accentBg,
                                      borderRadius: BorderRadius.circular(5),
                                    ),
                                    child: Text(
                                      theme.badgeLabel,
                                      style: TextStyle(
                                        color: theme.accentText,
                                        fontSize: 9,
                                        fontWeight: FontWeight.w800,
                                        letterSpacing: 0.6,
                                      ),
                                    ),
                                  ),
                                  if (figure != null) ...[
                                    const SizedBox(width: 8),
                                    Flexible(
                                      child: Text(
                                        figure,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: AppTokens.monoStyle(
                                          color: c.textPrimary,
                                          fontSize: 11,
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                widget.payload.displayTitle,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  color: c.textPrimary,
                                  fontSize: 13.5,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                widget.payload.displayBody,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  color: c.textSecondary,
                                  fontSize: 12,
                                  height: 1.35,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 4),
                        SizedBox(
                          width: 44,
                          height: 44,
                          child: IconButton(
                            onPressed: _dismissAnimated,
                            tooltip: 'Đóng thông báo',
                            icon: Icon(
                              Icons.close_rounded,
                              color: c.textMuted,
                              size: 18,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _HudTheme {
  final Color accent;
  final Color accentText;
  final Color accentBg;
  final String badgeLabel;
  final IconData icon;

  const _HudTheme({
    required this.accent,
    required this.accentText,
    required this.accentBg,
    required this.badgeLabel,
    required this.icon,
  });
}
