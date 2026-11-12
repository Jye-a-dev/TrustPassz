import 'dart:async';
import 'dart:io' show Platform;

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/notification_payload.dart';
import 'api_client.dart';

export '../models/notification_payload.dart';

/// Top-level background/terminated FCM message handler registered before runApp().
/// Must remain isolated from UI widgets and hold `@pragma('vm:entry-point')` for AOT release builds.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    if (Firebase.apps.isEmpty) {
      await Firebase.initializeApp();
    }
    final payload = EscrowNotificationPayload.fromRemoteMessage(message);
    debugPrint(
      '[FCM Background] type=${payload.type.wireName} dealId=${payload.dealId} route=${payload.resolvedRoute}',
    );
  } catch (e) {
    debugPrint('[FCM Background] Error processing background push: $e');
  }
}

/// Manages Firebase Cloud Messaging, APNs, Android high-importance channel,
/// 3-state app lifecycle routing, and authenticated token lifecycle sync/revoke.
class NotificationService {
  NotificationService._internal();
  static final NotificationService instance = NotificationService._internal();

  static const String fcmTokenKey = 'trustpassz_fcm_device_token';
  static const String fcmSyncedKey = 'fcm_token_synced';
  static const String channelId = 'trustpassz_escrow_alerts';
  static const String channelName = 'TrustPassz Escrow Alerts';
  static const String channelDescription =
      'Cảnh báo biến động ký quỹ, thanh toán VietQR và mở két Digital Vault';

  static const AndroidNotificationChannel escrowChannel =
      AndroidNotificationChannel(
    channelId,
    channelName,
    description: channelDescription,
    importance: Importance.max,
    playSound: true,
    enableVibration: true,
    enableLights: true,
    ledColor: Color(0xFF10B981),
  );

  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();
  final StreamController<EscrowNotificationPayload> _foregroundController =
      StreamController<EscrowNotificationPayload>.broadcast();
  final StreamController<EscrowNotificationPayload> _navigationController =
      StreamController<EscrowNotificationPayload>.broadcast();

  StreamSubscription<RemoteMessage>? _onMessageSub;
  StreamSubscription<RemoteMessage>? _onOpenedAppSub;
  StreamSubscription<String>? _onTokenRefreshSub;

  EscrowNotificationPayload? _pendingNavigationPayload;
  bool _initialized = false;
  bool _firebaseAvailable = false;

  FirebaseMessaging get _fcm => FirebaseMessaging.instance;

  /// Stream of payloads arriving while app is active in Foreground (for In-App HUD Toast).
  Stream<EscrowNotificationPayload> get foregroundNotifications =>
      _foregroundController.stream;

  /// Stream of deep-link payloads triggered by tapping a background/local notification.
  Stream<EscrowNotificationPayload> get navigationRequests =>
      _navigationController.stream;

  /// Pending deep-link payload captured during Cold Start before Auth/Navigator readiness.
  EscrowNotificationPayload? get pendingNavigationPayload =>
      _pendingNavigationPayload;

  /// Initializes local notification channel, permissions, cold-start launch checks, and FCM listeners.
  Future<void> initialize() async {
    if (_initialized) return;
    _initialized = true;

    await _initializeLocalNotifications();
    _firebaseAvailable = Firebase.apps.isNotEmpty;
    if (!_firebaseAvailable) {
      debugPrint(
        '[NotificationService] Firebase not initialized; running in safe offline/test mode.',
      );
      return;
    }

    try {
      await _requestPermissions(_fcm);

      await _fcm.setForegroundNotificationPresentationOptions(
        alert: false,
        badge: true,
        sound: false,
      );

      final initialMessage = await _fcm.getInitialMessage();
      if (initialMessage != null) {
        final payload =
            EscrowNotificationPayload.fromRemoteMessage(initialMessage);
        if (payload.hasValidDealId) {
          _pendingNavigationPayload = payload;
        }
      }

      _onMessageSub =
          FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
      _onOpenedAppSub =
          FirebaseMessaging.onMessageOpenedApp.listen(_handleBackgroundTap);
      _onTokenRefreshSub = _fcm.onTokenRefresh.listen(_handleTokenRefresh);
    } catch (e) {
      debugPrint('[NotificationService] Messaging setup warning: $e');
    }
  }

  Future<void> _initializeLocalNotifications() async {
    if (kIsWeb) return;
    try {
      const androidSettings = AndroidInitializationSettings('ic_notification');
      const darwinSettings = DarwinInitializationSettings(
        requestAlertPermission: false,
        requestBadgePermission: false,
        requestSoundPermission: false,
      );
      const initSettings = InitializationSettings(
        android: androidSettings,
        iOS: darwinSettings,
      );

      await _localNotifications.initialize(
        settings: initSettings,
        onDidReceiveNotificationResponse: (NotificationResponse response) {
          final parsed =
              EscrowNotificationPayload.tryFromJsonString(response.payload);
          if (parsed != null && parsed.hasValidDealId) {
            queueOrDispatchNavigation(parsed);
          }
        },
      );

      final androidPlugin =
          _localNotifications.resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>();
      await androidPlugin?.createNotificationChannel(escrowChannel);

      final launchDetails =
          await _localNotifications.getNotificationAppLaunchDetails();
      if (launchDetails?.didNotificationLaunchApp == true) {
        final parsed = EscrowNotificationPayload.tryFromJsonString(
          launchDetails?.notificationResponse?.payload,
        );
        if (parsed != null && parsed.hasValidDealId) {
          _pendingNavigationPayload = parsed;
        }
      }
    } catch (e) {
      debugPrint('[NotificationService] Local notification init skipped: $e');
    }
  }

  Future<void> _requestPermissions(FirebaseMessaging messaging) async {
    try {
      await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      if (!kIsWeb && Platform.isAndroid) {
        final androidPlugin =
            _localNotifications.resolvePlatformSpecificImplementation<
                AndroidFlutterLocalNotificationsPlugin>();
        await androidPlugin?.requestNotificationsPermission();
      } else if (!kIsWeb && Platform.isIOS) {
        final iosPlugin =
            _localNotifications.resolvePlatformSpecificImplementation<
                IOSFlutterLocalNotificationsPlugin>();
        await iosPlugin?.requestPermissions(
          alert: true,
          badge: true,
          sound: true,
        );
      }
    } catch (e) {
      debugPrint('[NotificationService] Permission request warning: $e');
    }
  }

  /// Foreground: only emit to InAppNotificationHud (no duplicate OS/local heads-up banner).
  Future<void> _handleForegroundMessage(RemoteMessage message) async {
    final payload = EscrowNotificationPayload.fromRemoteMessage(message);
    if (!payload.hasValidDealId) return;

    await _triggerAlertFeedback();
    _foregroundController.add(payload);
  }

  Future<void> _triggerAlertFeedback() async {
    try {
      await HapticFeedback.mediumImpact();
      await SystemSound.play(SystemSoundType.alert);
    } catch (_) {
      // Ignore on unsupported simulators or headless tests
    }
  }

  void _handleBackgroundTap(RemoteMessage message) {
    final payload = EscrowNotificationPayload.fromRemoteMessage(message);
    if (payload.hasValidDealId) {
      queueOrDispatchNavigation(payload);
    }
  }

  Future<void> _handleTokenRefresh(String newToken) async {
    if (newToken.trim().isEmpty) return;
    final prefs = await SharedPreferences.getInstance();
    final jwt = prefs.getString(ApiClient.tokenKey);
    if (jwt == null || jwt.isEmpty) return;
    await registerDeviceToken(token: newToken.trim());
  }

  /// Queues a navigation payload and broadcasts it on [navigationRequests].
  void queueOrDispatchNavigation(EscrowNotificationPayload payload) {
    _pendingNavigationPayload = payload;
    _navigationController.add(payload);
  }

  /// Broadcasts a foreground payload in widget tests to verify root HUD rendering.
  @visibleForTesting
  void debugEmitForegroundPayload(EscrowNotificationPayload payload) {
    _foregroundController.add(payload);
  }

  /// Consumes and clears the pending Cold Start / deferred navigation payload once UI is ready.
  EscrowNotificationPayload? consumePendingNavigation() {
    final pending = _pendingNavigationPayload;
    _pendingNavigationPayload = null;
    return pending;
  }

  /// Fetches the current device FCM token and registers it with the backend using Bearer JWT.
  Future<bool> syncDeviceTokenOnLogin({String? userId}) async {
    if (!_firebaseAvailable && Firebase.apps.isEmpty) return false;
    try {
      final token = await _resolveFcmTokenWithApnsWait();
      if (token == null || token.trim().isEmpty) return false;
      return await registerDeviceToken(token: token.trim(), userId: userId);
    } catch (e) {
      debugPrint('[NotificationService] Token sync failed: $e');
      return false;
    }
  }

  Future<String?> _resolveFcmTokenWithApnsWait() async {
    if (!kIsWeb && Platform.isIOS) {
      String? apns = await _fcm.getAPNSToken();
      if (apns == null) {
        await Future<void>.delayed(const Duration(milliseconds: 500));
        apns = await _fcm.getAPNSToken();
      }
      if (apns == null) {
        debugPrint(
            '[NotificationService] APNs token unavailable on simulator.');
        return null;
      }
    }
    return _fcm.getToken();
  }

  /// Persists the FCM device token locally and registers it via POST /api/v1/notifications/device-token.
  Future<bool> registerDeviceToken({
    required String token,
    String? userId,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(fcmTokenKey, token);

      final platformStr = (!kIsWeb && Platform.isIOS) ? 'ios' : 'android';
      final body = <String, Object?>{
        'token': token,
        'platform': platformStr,
        'appVersion': '1.0.0',
        'deviceModel': kIsWeb
            ? 'WebBrowser'
            : '${Platform.operatingSystem} ${Platform.operatingSystemVersion}',
        if (userId != null && userId.isNotEmpty) 'userId': userId,
      };
      await ApiClient.instance
          .post('/api/v1/notifications/device-token', body: body);
      await prefs.setBool(fcmSyncedKey, true);
      return true;
    } catch (e) {
      debugPrint('[NotificationService] Failed to sync FCM token: $e');
      return false;
    }
  }

  /// Revokes the FCM token via DELETE /api/v1/notifications/device-token (with active Bearer JWT)
  /// and guarantees local Firebase token & sync flag wipe inside `finally` even on 401/offline errors.
  Future<bool> revokeDeviceTokenOnLogout({String? userId}) async {
    bool serverRevoked = false;

    try {
      final prefs = await SharedPreferences.getInstance();
      String? currentToken = prefs.getString(fcmTokenKey);

      if ((currentToken == null || currentToken.isEmpty) &&
          Firebase.apps.isNotEmpty) {
        try {
          currentToken = await _fcm.getToken();
        } catch (_) {
          currentToken = null;
        }
      }

      if (currentToken != null && currentToken.isNotEmpty) {
        await ApiClient.instance.delete(
          '/api/v1/notifications/device-token',
          body: <String, Object?>{
            'token': currentToken,
            if (userId != null && userId.isNotEmpty) 'userId': userId,
          },
        );
      }
      serverRevoked = true;
    } catch (e) {
      debugPrint('[NotificationService] Failed to revoke remote FCM token: $e');
      serverRevoked = false;
    } finally {
      if (Firebase.apps.isNotEmpty) {
        try {
          await _fcm.deleteToken();
        } catch (e) {
          debugPrint('[NotificationService] Firebase deleteToken warning: $e');
        }
      }
      try {
        final prefs = await SharedPreferences.getInstance();
        await prefs.remove(fcmTokenKey);
        await prefs.remove(fcmSyncedKey);
      } catch (e) {
        debugPrint('[NotificationService] Local FCM cache cleanup error: $e');
      }
    }

    return serverRevoked;
  }

  Future<void> dispose() async {
    await _onMessageSub?.cancel();
    await _onOpenedAppSub?.cancel();
    await _onTokenRefreshSub?.cancel();
    await _foregroundController.close();
    await _navigationController.close();
  }
}
