import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mb_user/models/deal_model.dart';
import 'package:mb_user/screens/checkout_vietqr_screen.dart';
import 'package:mb_user/screens/deal_create_screen.dart';
import 'package:mb_user/screens/deal_room/deal_audit_timeline.dart';
import 'package:mb_user/screens/digital_vault_screen.dart';
import 'package:mb_user/screens/dispute_screen.dart';
import 'package:mb_user/screens/explore_deals_screen.dart';
import 'package:mb_user/screens/greeting_screen.dart';
import 'package:mb_user/screens/main_app_shell.dart';
import 'package:mb_user/screens/orders_history_screen.dart';
import 'package:mb_user/screens/profile_settings_screen.dart';
import 'package:mb_user/theme/app_tokens.dart';
import 'package:mb_user/theme/theme_provider.dart';
import 'package:mb_user/widgets/bargain_slider.dart';
import 'package:mb_user/widgets/modals/bargain_confirm_dialog.dart';
import 'package:mb_user/widgets/modals/dispute_success_dialog.dart';
import 'package:mb_user/widgets/modals/dispute_warning_dialog.dart';
import 'package:mb_user/widgets/modals/qr_scan_sheet.dart';
import 'package:mb_user/widgets/modals/transfer_success_sheet.dart';
import 'package:mb_user/widgets/modals/vault_unlock_sheet.dart';
import 'package:shared_preferences/shared_preferences.dart';

Widget _wrapWithTheme(Widget child) {
  return MaterialApp(
    theme: AppTokens.lightTheme,
    darkTheme: AppTokens.darkTheme,
    themeMode: ThemeMode.light,
    home: child,
  );
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    await ThemeProvider.instance.setThemeMode(ThemeMode.light);
  });

  group('Phase 1: Light Theme Default & ThemeProvider', () {
    test('ThemeProvider defaults to Light Mode and toggles to Dark', () async {
      final provider = ThemeProvider.forTest();
      expect(provider.themeMode, ThemeMode.light);
      expect(provider.isDarkMode, isFalse);

      await provider.toggleTheme();
      expect(provider.themeMode, ThemeMode.dark);
      expect(provider.isDarkMode, isTrue);
    });

    test('AppTokens uses #FAFAFB Light canvas and #080C14 Dark canvas', () {
      expect(AppTokens.lightTheme.scaffoldBackgroundColor, const Color(0xFFFAFAFB));
      expect(AppTokens.darkTheme.scaffoldBackgroundColor, const Color(0xFF080C14));
    });
  });

  group('Phase 2: MainAppShell 5 Tabs & Zero Sticky Dispute Button', () {
    testWidgets('MainAppShell renders 5 tabs and omits sticky dispute button',
        (tester) async {
      await tester.pumpWidget(_wrapWithTheme(MainAppShell(onLogout: () {})));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Trang Chủ'), findsOneWidget);
      expect(find.text('Khám Phá'), findsOneWidget);
      expect(find.text('Tạo Giao Dịch'), findsOneWidget);
      expect(find.text('Đơn Hàng'), findsOneWidget);
      expect(find.text('Cá Nhân'), findsOneWidget);
      expect(
        find.text('Khiếu Nại Trọng Tài AI (Dispute Center)'),
        findsNothing,
      );
    });
  });

  group('Phase 3: V2 Screens Coverage', () {
    testWidgets('GreetingScreen renders Light Mode carousel step 1/3',
        (tester) async {
      await tester.pumpWidget(
        _wrapWithTheme(GreetingScreen(onContinue: () {})),
      );
      expect(find.text('Bước 1 / 3'), findsOneWidget);
      expect(find.text('Ký Quỹ Napas 24/7'), findsOneWidget);
      await tester.tap(find.text('Tiếp Tục'));
      await tester.pump();
      expect(find.text('Bước 2 / 3'), findsOneWidget);
    });

    testWidgets('DealCreateScreen renders 6 asset grid and 4 duration pills',
        (tester) async {
      await tester.pumpWidget(
        _wrapWithTheme(DealCreateScreen(onDealCreated: (_) {})),
      );
      expect(find.text('Mã Nguồn Git'), findsOneWidget);
      expect(find.text('License Key'), findsOneWidget);
      expect(find.text('6 Giờ'), findsOneWidget);
      expect(find.text('12 Giờ'), findsOneWidget);
      expect(find.text('24 Giờ'), findsOneWidget);
      expect(find.text('48 Giờ'), findsOneWidget);
    });

    testWidgets('DealAuditTimeline renders 4 horizontal steps & BargainSlider quick chips',
        (tester) async {
      const deal = DealModel(
        id: 'deal-v2-timeline',
        sellerId: 'seller-1',
        title: 'AI Multi-Agent SaaS',
        amount: 4000000,
        currency: 'VND',
        state: DealState.pending,
        inspectionDuration: 86400,
      );

      await tester.pumpWidget(
        _wrapWithTheme(
          Scaffold(
            body: SingleChildScrollView(
              child: Column(
                children: [
                  const DealAuditTimeline(deal: deal),
                  BargainSlider(
                    dealId: deal.id,
                    basePrice: deal.amount,
                    currentUserId: 'buyer-1',
                  ),
                ],
              ),
            ),
          ),
        ),
      );

      expect(find.text('Khởi tạo'), findsOneWidget);
      expect(find.text('Ký quỹ'), findsOneWidget);
      expect(find.text('Đồng kiểm'), findsOneWidget);
      expect(find.text('Giải ngân'), findsOneWidget);
      expect(find.text('-5%'), findsOneWidget);
      expect(find.text('-10%'), findsOneWidget);
      expect(find.text('-15%'), findsOneWidget);
    });

    testWidgets('ExploreDealsScreen, OrdersHistoryScreen, ProfileSettingsScreen render',
        (tester) async {
      await tester.pumpWidget(
        _wrapWithTheme(ExploreDealsScreen(onSelectDeal: (_) {})),
      );
      expect(
        find.text('Tìm mã nguồn, license, tài liệu...'),
        findsOneWidget,
      );

      await tester.pumpWidget(
        _wrapWithTheme(
          OrdersHistoryScreen(
            onSelectDeal: (_) {},
            onOpenCheckout: (_) {},
            onOpenVault: (_) {},
            onOpenDispute: (_) {},
          ),
        ),
      );
      expect(find.text('Giao Dịch Mua (0)'), findsOneWidget);
      expect(find.text('Giao Dịch Bán (0)'), findsOneWidget);

      await tester.pumpWidget(
        _wrapWithTheme(ProfileSettingsScreen(onLogout: () {})),
      );
      await tester.pump();
      expect(find.text('Trust Score: 99.8%'), findsOneWidget);
      expect(find.text('Tài Khoản Rút Tiền VietQR'), findsOneWidget);
    });

    testWidgets('CheckoutVietQrScreen, DigitalVaultScreen, DisputeScreen render',
        (tester) async {
      const pendingDeal = DealModel(
        id: 'deal-checkout-1',
        sellerId: 'seller-1',
        title: 'SaaS Codebase',
        amount: 3600000,
        currency: 'VND',
        state: DealState.pending,
        inspectionDuration: 86400,
      );

      await tester.pumpWidget(
        _wrapWithTheme(
          CheckoutVietQrScreen(
            dealId: pendingDeal.id,
            initialDeal: pendingDeal,
          ),
        ),
      );
      await tester.pump();
      expect(find.text('Tôi Đã Chuyển Khoản Thành Công'), findsOneWidget);

      await tester.pumpWidget(
        _wrapWithTheme(
          DigitalVaultScreen(
            dealId: 'deal-vault-1',
            onBack: () {},
            onOpenDispute: (_) {},
          ),
        ),
      );
      await tester.pump();
      expect(find.text('Két Số Digital Vault'), findsOneWidget);

      await tester.pumpWidget(
        _wrapWithTheme(DisputeScreen(onBack: () {})),
      );
      expect(find.text('SLA < 15p'), findsOneWidget);
      expect(find.text('Sai lệch mô tả'), findsOneWidget);
      expect(find.text('Phát hiện mã độc'), findsOneWidget);
    });
  });

  group('Phase 4: V2 Modals Coverage', () {
    testWidgets('V2 Modals render cleanly with borders', (tester) async {
      await tester.pumpWidget(
        _wrapWithTheme(
          Scaffold(
            body: Column(
              children: [
                BargainConfirmDialog(
                  originalPrice: 4000000,
                  proposedPrice: 3600000,
                  onConfirm: () {},
                ),
              ],
            ),
          ),
        ),
      );
      expect(find.text('Xác Nhận Đề Xuất Giá'), findsOneWidget);

      await tester.pumpWidget(
        _wrapWithTheme(
          Scaffold(
            body: SingleChildScrollView(
              child: TransferSuccessSheet(
                dealId: 'deal-123456',
                amount: 3600000,
                txHash: '0x82a9d821ef4190c',
                onOpenVault: () {},
              ),
            ),
          ),
        ),
      );
      expect(find.text('Tiền Đã Khóa Vào Két Ký Quỹ!'), findsOneWidget);

      await tester.pumpWidget(
        _wrapWithTheme(
          Scaffold(
            body: DisputeWarningDialog(onContinue: () {}),
          ),
        ),
      );
      expect(find.text('Cảnh Báo Trước Khi Mở Tranh Chấp'), findsOneWidget);

      await tester.pumpWidget(
        _wrapWithTheme(
          Scaffold(
            body: SingleChildScrollView(
              child: VaultUnlockSheet(onAuthenticated: () {}),
            ),
          ),
        ),
      );
      expect(find.text('Xác Thực Mở Khóa Két Số'), findsOneWidget);

      await tester.pumpWidget(
        _wrapWithTheme(
          Scaffold(
            body: DisputeSuccessDialog(
              disputeCode: '#DIS-2026-9901',
              onTrackOrders: () {},
              onGoHome: () {},
            ),
          ),
        ),
      );
      expect(find.text('Đã Tiếp Nhận Khiếu Nại!'), findsOneWidget);

      await tester.pumpWidget(
        _wrapWithTheme(
          const Scaffold(
            body: SingleChildScrollView(child: QrScanSheet()),
          ),
        ),
      );
      expect(find.text('Quét Mã VietQR / Giao Dịch'), findsOneWidget);
    });
  });
}
