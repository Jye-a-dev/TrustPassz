import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_client.dart';

enum EscrowEventType {
  newDeal,
  offerUpdated,
  depositSuccess,
  vaultUnlocked,
  unknown,
}

class EscrowNotificationPayload {
  final EscrowEventType type;
  final String dealId;
  final String? dealTitle;
  final String? price;
  final String? amount;
  final String? txHash;
  final String? status;
  final String? vaultId;
  final String? inspectionDeadline;
  final String route;
  final String action;

  const EscrowNotificationPayload({
    required this.type,
    required this.dealId,
    this.dealTitle,
    this.price,
    this.amount,
    this.txHash,
    this.status,
    this.vaultId,
    this.inspectionDeadline,
    required this.route,
    required this.action,
  });

  factory EscrowNotificationPayload.fromMap(Map<String, dynamic> map) {
    EscrowEventType resolveType(String? raw) {
      switch (raw) {
        case 'NEW_DEAL':
          return EscrowEventType.newDeal;
        case 'OFFER_UPDATED':
          return EscrowEventType.offerUpdated;
        case 'DEPOSIT_SUCCESS':
          return EscrowEventType.depositSuccess;
        case 'VAULT_UNLOCKED':
          return EscrowEventType.vaultUnlocked;
        default:
          return EscrowEventType.unknown;
      }
    }

    return EscrowNotificationPayload(
      type: resolveType(map['type'] as String?),
      dealId: (map['dealId'] ?? '') as String,
      dealTitle: map['dealTitle'] as String?,
      price: map['price'] as String?,
      amount: map['amount'] as String?,
      txHash: map['txHash'] as String?,
      status: map['status'] as String?,
      vaultId: map['vaultId'] as String?,
      inspectionDeadline: map['inspectionDeadline'] as String?,
      route: (map['route'] ?? '/deal-room') as String,
      action: (map['action'] ?? 'VIEW_DEAL') as String,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'type': type.name,
      'dealId': dealId,
      'dealTitle': dealTitle,
      'price': price,
      'amount': amount,
      'txHash': txHash,
      'status': status,
      'vaultId': vaultId,
      'inspectionDeadline': inspectionDeadline,
      'route': route,
      'action': action,
    };
  }
}

class NotificationService {
  NotificationService._internal();
  static final NotificationService instance = NotificationService._internal();

  static const String fcmTokenKey = 'trustpassz_fcm_device_token';

  Future<bool> registerDeviceToken({
    required String token,
    required String userId,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(fcmTokenKey, token);

      final platformStr = kIsWeb ? 'web' : (Platform.isIOS ? 'ios' : 'android');
      await ApiClient.instance.post(
        '/api/v1/notifications/device-token',
        body: {
          'token': token,
          'userId': userId,
          'platform': platformStr,
          'deviceModel': kIsWeb ? 'Browser' : Platform.operatingSystemVersion,
          'appVersion': '1.0.0',
        },
      );
      return true;
    } catch (e) {
      debugPrint('[NotificationService] Failed to sync FCM token: $e');
      return false;
    }
  }

  Future<bool> unregisterDeviceToken({
    required String userId,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final currentToken = prefs.getString(fcmTokenKey);
      if (currentToken == null || currentToken.isEmpty) return true;

      await ApiClient.instance.post(
        '/api/v1/notifications/device-token',
        body: {
          'userId': userId,
          'token': currentToken,
          'action': 'unregister',
        },
      );
      await prefs.remove(fcmTokenKey);
      return true;
    } catch (e) {
      debugPrint('[NotificationService] Failed to revoke FCM token: $e');
      return false;
    }
  }
}
