import 'dart:convert';
import 'package:firebase_messaging/firebase_messaging.dart';

/// Strongly-typed Escrow Push Notification trigger scenarios.
enum EscrowEventType {
  newDeal,
  offerUpdated,
  depositSuccess,
  vaultUnlocked,
  unknown;

  String get wireName {
    switch (this) {
      case EscrowEventType.newDeal:
        return 'NEW_DEAL';
      case EscrowEventType.offerUpdated:
        return 'OFFER_UPDATED';
      case EscrowEventType.depositSuccess:
        return 'DEPOSIT_SUCCESS';
      case EscrowEventType.vaultUnlocked:
        return 'VAULT_UNLOCKED';
      case EscrowEventType.unknown:
        return 'UNKNOWN';
    }
  }

  static EscrowEventType fromWire(String? raw) {
    switch (raw?.trim().toUpperCase()) {
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
}

/// Strongly-typed notification payload parsed from FCM RemoteMessage or local payload JSON.
class EscrowNotificationPayload {
  final EscrowEventType type;
  final String dealId;
  final String? title;
  final String? body;
  final String? dealTitle;
  final String? price;
  final String? amount;
  final String? currency;
  final String? txHash;
  final String? status;
  final String? vaultId;
  final String? inspectionDeadline;
  final String? proposedBy;
  final String route;
  final String action;

  const EscrowNotificationPayload({
    required this.type,
    required this.dealId,
    this.title,
    this.body,
    this.dealTitle,
    this.price,
    this.amount,
    this.currency,
    this.txHash,
    this.status,
    this.vaultId,
    this.inspectionDeadline,
    this.proposedBy,
    required this.route,
    required this.action,
  });

  /// Canonical target route normalized across the 3 escrow scenarios.
  String get resolvedRoute {
    if (type == EscrowEventType.vaultUnlocked) {
      return '/vault';
    }
    if (type == EscrowEventType.newDeal ||
        type == EscrowEventType.offerUpdated ||
        type == EscrowEventType.depositSuccess) {
      return '/deal-room';
    }
    if (route == '/vault' || route == '/deal-room') {
      return route;
    }
    return '/deal-room';
  }

  bool get shouldHighlightVaultStep =>
      type == EscrowEventType.depositSuccess ||
      action.toUpperCase() == 'INSPECT_ESCROW';

  bool get hasValidDealId => dealId.trim().isNotEmpty;

  String get displayTitle {
    if (title != null && title!.trim().isNotEmpty) {
      return title!.trim();
    }
    switch (type) {
      case EscrowEventType.newDeal:
        return 'Giao dịch ký quỹ mới đang chờ xác nhận';
      case EscrowEventType.offerUpdated:
        return 'Đề xuất giá mới từ đối tác';
      case EscrowEventType.depositSuccess:
        return 'Xác nhận cọc tiền thành công';
      case EscrowEventType.vaultUnlocked:
        return 'Két số đã mở - Bắt đầu đồng kiểm';
      case EscrowEventType.unknown:
        return 'Cập nhật giao dịch TrustPassz';
    }
  }

  String get displayBody {
    if (body != null && body!.trim().isNotEmpty) {
      return body!.trim();
    }
    final label = (dealTitle != null && dealTitle!.trim().isNotEmpty)
        ? '"${dealTitle!.trim()}"'
        : 'Deal ${dealId.length > 8 ? dealId.substring(0, 8) : dealId}';
    switch (type) {
      case EscrowEventType.newDeal:
        return 'Bạn có giao dịch ký quỹ mới $label.';
      case EscrowEventType.offerUpdated:
        return 'Mức giá thương lượng cho $label vừa được cập nhật.';
      case EscrowEventType.depositSuccess:
        return 'Tiền cọc cho $label đã khóa an toàn. Sẵn sàng mở két số.';
      case EscrowEventType.vaultUnlocked:
        return 'Digital Vault cho $label đã giải mã. Cửa sổ đồng kiểm đang chạy.';
      case EscrowEventType.unknown:
        return 'Chạm để mở chi tiết giao dịch $label.';
    }
  }

  String? get formattedFigure {
    final raw = amount ?? price;
    if (raw == null || raw.trim().isEmpty) return null;
    final parsed = double.tryParse(raw.trim());
    if (parsed == null) return raw.trim();
    final intVal = parsed.round();
    final digits = intVal.toString();
    final buf = StringBuffer();
    for (int i = 0; i < digits.length; i++) {
      if (i > 0 && (digits.length - i) % 3 == 0) {
        buf.write('.');
      }
      buf.write(digits[i]);
    }
    final unit = (currency ?? 'VND').toUpperCase() == 'VND'
        ? '₫'
        : (currency ?? 'VND');
    return '${buf.toString()} $unit';
  }

  factory EscrowNotificationPayload.fromRemoteMessage(RemoteMessage message) {
    final data = <String, Object?>{};
    message.data.forEach((key, value) {
      data[key] = value;
    });

    if (message.notification?.title != null &&
        message.notification!.title!.isNotEmpty) {
      data.putIfAbsent('title', () => message.notification!.title);
    }
    if (message.notification?.body != null &&
        message.notification!.body!.isNotEmpty) {
      data.putIfAbsent('body', () => message.notification!.body);
    }

    return EscrowNotificationPayload.fromMap(data);
  }

  factory EscrowNotificationPayload.fromMap(Map<String, Object?> map) {
    String? readStr(String key) {
      final val = map[key];
      if (val == null) return null;
      final s = val.toString().trim();
      return s.isEmpty ? null : s;
    }

    final eventType = EscrowEventType.fromWire(readStr('type'));
    final defaultRoute =
        eventType == EscrowEventType.vaultUnlocked ? '/vault' : '/deal-room';
    final defaultAction = switch (eventType) {
      EscrowEventType.depositSuccess => 'INSPECT_ESCROW',
      EscrowEventType.vaultUnlocked => 'START_INSPECTION',
      _ => 'VIEW_DEAL',
    };

    return EscrowNotificationPayload(
      type: eventType,
      dealId: readStr('dealId') ?? '',
      title: readStr('title'),
      body: readStr('body'),
      dealTitle: readStr('dealTitle'),
      price: readStr('price'),
      amount: readStr('amount'),
      currency: readStr('currency'),
      txHash: readStr('txHash'),
      status: readStr('status'),
      vaultId: readStr('vaultId'),
      inspectionDeadline: readStr('inspectionDeadline'),
      proposedBy: readStr('proposedBy'),
      route: readStr('route') ?? defaultRoute,
      action: readStr('action') ?? defaultAction,
    );
  }

  static EscrowNotificationPayload? tryFromJsonString(String? rawJson) {
    if (rawJson == null || rawJson.trim().isEmpty) return null;
    try {
      final decoded = jsonDecode(rawJson);
      if (decoded is Map<String, Object?>) {
        return EscrowNotificationPayload.fromMap(decoded);
      }
      if (decoded is Map) {
        final typed = <String, Object?>{};
        decoded.forEach((k, v) {
          typed[k.toString()] = v;
        });
        return EscrowNotificationPayload.fromMap(typed);
      }
    } catch (_) {
      return null;
    }
    return null;
  }

  Map<String, Object?> toMap() {
    return <String, Object?>{
      'type': type.wireName,
      'dealId': dealId,
      if (title != null) 'title': title,
      if (body != null) 'body': body,
      if (dealTitle != null) 'dealTitle': dealTitle,
      if (price != null) 'price': price,
      if (amount != null) 'amount': amount,
      if (currency != null) 'currency': currency,
      if (txHash != null) 'txHash': txHash,
      if (status != null) 'status': status,
      if (vaultId != null) 'vaultId': vaultId,
      if (inspectionDeadline != null) 'inspectionDeadline': inspectionDeadline,
      if (proposedBy != null) 'proposedBy': proposedBy,
      'route': resolvedRoute,
      'action': action,
    };
  }

  String toJsonString() => jsonEncode(toMap());
}
