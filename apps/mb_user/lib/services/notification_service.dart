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

  /// Stream of payloads arriving while app is active in Foreground (for In-App HUD Toast).
  Stream<EscrowNotificationPayload> get foregroundNotifications =>
      _foregroundController.stream;

  /// Stream of deep-link payloads triggered by tapping a background/local notification.
  Stream<EscrowNotificationPayload> get navigationRequests =>
      _navigationController.stream;

  /// Pending deep-link payload captured during Cold Start before Auth/Navigator readiness.
  EscrowNotificationPayload? get pendingNavigationPayload =>
      _pendingNavigationPayload;

  /// Initializes local notifications, notification channels, permissions, and FCM listeners.
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
      final messaging = FirebaseMessaging.instance;
      await _requestPermissions(messaging);

      await messaging.setForegroundNotificationPresentationOptions(
        alert: false,
        badge: true,
        sound: false,
      );

      final initialMessage = await messaging.getInitialMessage();
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
      _onTokenRefreshSub = messaging.onTokenRefresh.listen(_handleTokenRefresh);
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

  Future<void> _handleForegroundMessage(RemoteMessage message) async {
    final payload = EscrowNotificationPayload.fromRemoteMessage(message);
    if (!payload.hasValidDealId) return;

    await _triggerAlertFeedback();
    _foregroundController.add(payload);
    await _showHeadsUpLocalNotification(payload);
  }

  Future<void> _triggerAlertFeedback() async {
    try {
      await HapticFeedback.mediumImpact();
      await SystemSound.play(SystemSoundType.alert);
    } catch (_) {
      // Ignore on unsupported simulators or headless tests
    }
  }

  Future<void> _showHeadsUpLocalNotification(
    EscrowNotificationPayload payload,
  ) async {
    if (kIsWeb) return;
    try {
      const androidDetails = AndroidNotificationDetails(
        channelId,
        channelName,
        channelDescription: channelDescription,
        importance: Importance.max,
        priority: Priority.high,
        icon: 'ic_notification',
        color: Color(0xFF10B981),
        playSound: true,
        enableVibration: true,
        enableLights: true,
        ledColor: Color(0xFF10B981),
        ledOnMs: 600,
        ledOffMs: 400,
      );
      const iosDetails = DarwinNotificationDetails(
        presentAlert: true,
        presentBanner: true,
        presentList: true,
        presentBadge: true,
        presentSound: true,
      );
      const details =
          NotificationDetails(android: androidDetails, iOS: iosDetails);

      final notificationId =
          payload.dealId.hashCode ^ payload.type.index ^ 0x5450;
      await _localNotifications.show(
        id: notificationId,
        title: payload.displayTitle,
        body: payload.displayBody,
        notificationDetails: details,
        payload: payload.toJsonString(),
      );
    } catch (e) {
      debugPrint('[NotificationService] Heads-up notification error: $e');
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
    final messaging = FirebaseMessaging.instance;
    if (!kIsWeb && Platform.isIOS) {
      String? apns = await messaging.getAPNSToken();
      if (apns == null) {
        await Future<void>.delayed(const Duration(milliseconds: 500));
        apns = await messaging.getAPNSToken();
      }
      if (apns == null) {
        debugPrint(
            '[NotificationService] APNs token unavailable on simulator.');
        return null;
      }
    }
    return messaging.getToken();
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
      return true;
    } catch (e) {
      debugPrint('[NotificationService] Failed to sync FCM token: $e');
      return false;
    }
  }

  /// Revokes the FCM token via DELETE /api/v1/notifications/device-token (with active Bearer JWT)
  /// and deletes the token from FirebaseMessaging instance before clearing local storage.
  Future<bool> revokeDeviceTokenOnLogout({String? userId}) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      String? currentToken = prefs.getString(fcmTokenKey);

      if ((currentToken == null || currentToken.isEmpty) &&
          Firebase.apps.isNotEmpty) {
        try {
          currentToken = await FirebaseMessaging.instance.getToken();
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

      if (Firebase.apps.isNotEmpty) {
        try {
          await FirebaseMessaging.instance.deleteToken();
        } catch (e) {
          debugPrint('[NotificationService] Firebase deleteToken warning: $e');
        }
      }

      await prefs.remove(fcmTokenKey);
      return true;
    } catch (e) {
      debugPrint('[NotificationService] Failed to revoke FCM token: $e');
      return false;
    }
  }

  Future<void> dispose() async {
    await _onMessageSub?.cancel();
    await _onOpenedAppSub?.cancel();
    await _onTokenRefreshSub?.cancel();
    await _foregroundController.close();
    await _navigationController.close();
  }
}
