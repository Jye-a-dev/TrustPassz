import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';

import 'screens/checkout_vietqr_screen.dart';
import 'screens/deal_room_screen.dart';
import 'screens/digital_vault_screen.dart';
import 'screens/dispute_screen.dart';
import 'screens/greeting_screen.dart';
import 'screens/login_screen.dart';
import 'screens/main_app_shell.dart';
import 'services/auth_service.dart';
import 'services/notification_service.dart';
import 'theme/app_tokens.dart';
import 'theme/theme_provider.dart';
import 'widgets/in_app_notification_hud.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  } catch (e) {
    debugPrint('[Bootstrap] Firebase initialization skipped: $e');
  }

  await ThemeProvider.instance.loadSavedTheme();
  await NotificationService.instance.initialize();
  runApp(const TrustPasszApp());
}

class TrustPasszApp extends StatelessWidget {
  static final GlobalKey<NavigatorState> navigatorKey =
      GlobalKey<NavigatorState>();

  const TrustPasszApp({super.key});

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: ThemeProvider.instance,
      builder: (context, _) {
        return MaterialApp(
          navigatorKey: navigatorKey,
          title: 'TrustPassz',
          debugShowCheckedModeBanner: false,
          theme: AppTokens.lightTheme,
          darkTheme: AppTokens.darkTheme,
          themeMode: ThemeProvider.instance.themeMode,
          onGenerateRoute: (settings) {
            final args = settings.arguments;
            if (settings.name == '/deal-room' &&
                args is EscrowNotificationPayload) {
              return MaterialPageRoute<void>(
                settings: settings,
                builder: (ctx) => DealRoomScreen(
                  dealId: args.dealId,
                  initialFocusVault: args.shouldHighlightVaultStep,
                  onBack: () => Navigator.of(ctx).pop(),
                  onOpenDispute: (id) {
                    Navigator.of(ctx).pushReplacement(
                      MaterialPageRoute<void>(
                        builder: (dCtx) => DisputeScreen(
                          initialDealId: id,
                          onBack: () => Navigator.of(dCtx).pop(),
                        ),
                      ),
                    );
                  },
                ),
              );
            }
            if (settings.name == '/vault' &&
                args is EscrowNotificationPayload) {
              return MaterialPageRoute<void>(
                settings: settings,
                builder: (ctx) => DigitalVaultScreen(
                  dealId: args.dealId,
                  vaultId: args.vaultId,
                  inspectionDeadline: args.inspectionDeadline,
                  onBack: () => Navigator.of(ctx).pop(),
                  onOpenDispute: (id) {
                    Navigator.of(ctx).pushReplacement(
                      MaterialPageRoute<void>(
                        builder: (dCtx) => DisputeScreen(
                          initialDealId: id,
                          onBack: () => Navigator.of(dCtx).pop(),
                        ),
                      ),
                    );
                  },
                ),
              );
            }
            if (settings.name == '/checkout-vietqr' && args is String) {
              return MaterialPageRoute<void>(
                settings: settings,
                builder: (ctx) => CheckoutVietQrScreen(
                  dealId: args,
                  onBack: () => Navigator.of(ctx).pop(),
                ),
              );
            }
            if (settings.name == '/dispute') {
              final dealId = args is String ? args : null;
              return MaterialPageRoute<void>(
                settings: settings,
                builder: (ctx) => DisputeScreen(
                  initialDealId: dealId,
                  onBack: () => Navigator.of(ctx).pop(),
                ),
              );
            }
            return null;
          },
          home: const AppRootNavigator(),
        );
      },
    );
  }
}

class AppRootNavigator extends StatefulWidget {
  const AppRootNavigator({super.key});

  @override
  State<AppRootNavigator> createState() => _AppRootNavigatorState();
}

class _AppRootNavigatorState extends State<AppRootNavigator> {
  bool _isCheckingAuth = true;
  bool _isAuthenticated = false;
  bool _hasSeenGreeting = false;

  EscrowNotificationPayload? _foregroundHudPayload;
  StreamSubscription<EscrowNotificationPayload>? _foregroundSub;
  StreamSubscription<EscrowNotificationPayload>? _navigationSub;

  @override
  void initState() {
    super.initState();
    _bindNotificationListeners();
    _checkInitialAuth();
  }

  void _bindNotificationListeners() {
    _foregroundSub =
        NotificationService.instance.foregroundNotifications.listen(
      (payload) {
        if (!mounted || !_isAuthenticated) return;
        setState(() {
          _foregroundHudPayload = payload;
        });
      },
    );

    _navigationSub = NotificationService.instance.navigationRequests.listen(
      (payload) {
        _dispatchDeepLinkAfterFrame(payload);
      },
    );
  }

  Future<void> _checkInitialAuth() async {
    final token = await AuthService.instance.getStoredToken();
    final user = await AuthService.instance.getStoredUser();
    final authed = token != null && token.isNotEmpty;

    if (!mounted) return;
    setState(() {
      _isAuthenticated = authed;
      _hasSeenGreeting = authed;
      _isCheckingAuth = false;
    });

    if (authed) {
      unawaited(
        NotificationService.instance.syncDeviceTokenOnLogin(userId: user?.id),
      );
      _flushPendingColdStartNavigation();
    }
  }

  void _flushPendingColdStartNavigation() {
    final pending = NotificationService.instance.consumePendingNavigation();
    if (pending != null) {
      _dispatchDeepLinkAfterFrame(pending);
    }
  }

  void _dispatchDeepLinkAfterFrame(EscrowNotificationPayload payload) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || !_isAuthenticated || !payload.hasValidDealId) return;
      NotificationService.instance.consumePendingNavigation();
      _navigateFromPayload(payload);
    });
  }

  void _navigateFromPayload(EscrowNotificationPayload payload) {
    setState(() {
      _foregroundHudPayload = null;
    });

    final nav = TrustPasszApp.navigatorKey.currentState ?? Navigator.of(context);
    if (payload.resolvedRoute == '/vault') {
      nav.pushNamed('/vault', arguments: payload);
    } else {
      nav.pushNamed('/deal-room', arguments: payload);
    }
  }

  void _onGreetingComplete() {
    setState(() => _hasSeenGreeting = true);
  }

  void _onLoginSuccess() {
    setState(() {
      _isAuthenticated = true;
      _hasSeenGreeting = true;
    });
    _flushPendingColdStartNavigation();
  }

  Future<void> _onLogout() async {
    await AuthService.instance.logout();
    if (!mounted) return;
    setState(() {
      _isAuthenticated = false;
      _foregroundHudPayload = null;
    });
  }

  @override
  void dispose() {
    _foregroundSub?.cancel();
    _navigationSub?.cancel();
    super.dispose();
  }

  Widget _buildActiveScreen() {
    final c = context.tp;

    if (_isCheckingAuth) {
      return Scaffold(
        backgroundColor: c.canvas,
        body: const Center(
          child: CircularProgressIndicator(color: AppTokens.emerald),
        ),
      );
    }

    if (!_hasSeenGreeting) {
      return GreetingScreen(onContinue: _onGreetingComplete);
    }

    if (!_isAuthenticated) {
      return LoginScreen(onSuccess: _onLoginSuccess);
    }

    return MainAppShell(onLogout: _onLogout);
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        _buildActiveScreen(),
        if (_foregroundHudPayload != null)
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: InAppNotificationHud(
              payload: _foregroundHudPayload!,
              onTap: () => _navigateFromPayload(_foregroundHudPayload!),
              onDismiss: () {
                if (mounted) {
                  setState(() => _foregroundHudPayload = null);
                }
              },
            ),
          ),
      ],
    );
  }
}
