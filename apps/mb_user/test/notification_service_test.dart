import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mb_user/screens/deal_room/deal_vault_ready_card.dart';
import 'package:mb_user/services/notification_service.dart';
import 'package:mb_user/widgets/in_app_notification_hud.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    NotificationService.instance.consumePendingNavigation();
  });

  group('1. EscrowNotificationPayload 3-Scenario Routing & Parsing', () {
    test('Scenario 1 (NEW_DEAL / OFFER_UPDATED) resolves to /deal-room', () {
      final newDeal = EscrowNotificationPayload.fromMap(<String, Object?>{
        'type': 'NEW_DEAL',
        'dealId': 'deal-101',
        'price': '1500000',
        'currency': 'VND',
      });
      expect(newDeal.type, EscrowEventType.newDeal);
      expect(newDeal.resolvedRoute, '/deal-room');
      expect(newDeal.shouldHighlightVaultStep, isFalse);
      expect(newDeal.formattedFigure, '1.500.000 ₫');

      final offerUpdated = EscrowNotificationPayload.fromMap(<String, Object?>{
        'type': 'OFFER_UPDATED',
        'dealId': 'deal-101',
        'price': '2450000',
      });
      expect(offerUpdated.type, EscrowEventType.offerUpdated);
      expect(offerUpdated.resolvedRoute, '/deal-room');
      expect(offerUpdated.shouldHighlightVaultStep, isFalse);
    });

    test('Scenario 2 (DEPOSIT_SUCCESS) resolves to /deal-room with vault highlight', () {
      final payload = EscrowNotificationPayload.fromMap(<String, Object?>{
        'type': 'DEPOSIT_SUCCESS',
        'dealId': 'deal-202',
        'amount': '5000000',
        'status': 'DEPOSITED',
      });
      expect(payload.type, EscrowEventType.depositSuccess);
      expect(payload.resolvedRoute, '/deal-room');
      expect(payload.shouldHighlightVaultStep, isTrue);
      expect(payload.formattedFigure, '5.000.000 ₫');
    });

    test('Scenario 3 (VAULT_UNLOCKED) resolves to /vault with metadata', () {
      final payload = EscrowNotificationPayload.fromMap(<String, Object?>{
        'type': 'VAULT_UNLOCKED',
        'dealId': 'deal-303',
        'vaultId': 'vlt_8921bca9104',
        'inspectionDeadline': '2026-11-12T16:30:00.000Z',
      });
      expect(payload.type, EscrowEventType.vaultUnlocked);
      expect(payload.resolvedRoute, '/vault');
      expect(payload.vaultId, 'vlt_8921bca9104');

      final roundTrip =
          EscrowNotificationPayload.tryFromJsonString(payload.toJsonString());
      expect(roundTrip?.dealId, 'deal-303');
      expect(roundTrip?.resolvedRoute, '/vault');
      expect(roundTrip?.vaultId, 'vlt_8921bca9104');
    });
  });

  group('2. NotificationService Channel & Cold-Start Deferral Queue', () {
    test('Configures trustpassz_escrow_alerts channel with Emerald LED #10B981', () {
      expect(NotificationService.channelId, 'trustpassz_escrow_alerts');
      expect(NotificationService.channelName, 'TrustPassz Escrow Alerts');
      expect(
        NotificationService.escrowChannel.ledColor,
        const Color(0xFF10B981),
      );
      expect(NotificationService.escrowChannel.enableLights, isTrue);
      expect(NotificationService.escrowChannel.enableVibration, isTrue);
      expect(NotificationService.escrowChannel.playSound, isTrue);
    });

    test('Queues and consumes pending Cold Start payload safely once', () {
      final payload = EscrowNotificationPayload.fromMap(<String, Object?>{
        'type': 'VAULT_UNLOCKED',
        'dealId': 'deal-cold-start',
        'vaultId': 'vlt_01',
      });

      NotificationService.instance.queueOrDispatchNavigation(payload);
      expect(
        NotificationService.instance.pendingNavigationPayload?.dealId,
        'deal-cold-start',
      );

      final consumed = NotificationService.instance.consumePendingNavigation();
      expect(consumed?.dealId, 'deal-cold-start');
      expect(NotificationService.instance.pendingNavigationPayload, isNull);
    });
  });

  group('3. Cyber-Dark InAppNotificationHud & DealVaultReadyCard Widgets', () {
    testWidgets('InAppNotificationHud renders scenario copy, figure, and handles tap/dismiss',
        (tester) async {
      bool tapped = false;
      bool dismissed = false;

      final payload = EscrowNotificationPayload.fromMap(<String, Object?>{
        'type': 'DEPOSIT_SUCCESS',
        'dealId': 'deal-hud-1',
        'amount': '5000000',
        'title': 'Xác nhận cọc tiền thành công',
        'body': 'Khoản ký quỹ đã khóa an toàn.',
      });

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Stack(
              children: [
                InAppNotificationHud(
                  payload: payload,
                  onTap: () => tapped = true,
                  onDismiss: () => dismissed = true,
                ),
              ],
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('ĐÃ KHÓA CỌC'), findsOneWidget);
      expect(find.text('5.000.000 ₫'), findsOneWidget);
      expect(find.text('Xác nhận cọc tiền thành công'), findsOneWidget);

      await tester.tap(find.text('Xác nhận cọc tiền thành công'));
      await tester.pump();
      expect(tapped, isTrue);

      await tester.tap(find.byIcon(Icons.close_rounded));
      await tester.pumpAndSettle();
      expect(dismissed, isTrue);
    });

    testWidgets('DealVaultReadyCard shows highlight badge on DEPOSIT_SUCCESS route',
        (tester) async {
      bool opened = false;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: DealVaultReadyCard(
              highlighted: true,
              onOpenVault: () => opened = true,
            ),
          ),
        ),
      );

      expect(find.text('SẴN SÀNG MỞ KÉT'), findsOneWidget);
      await tester.tap(find.text('Mở Két Số Digital Vault'));
      expect(opened, isTrue);
    });
  });
}
