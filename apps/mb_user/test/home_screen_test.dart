import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mb_user/models/deal_model.dart';
import 'package:mb_user/services/deal_cache_service.dart';
import 'package:mb_user/widgets/home/balance_escrow_card.dart';
import 'package:mb_user/widgets/home/quick_actions_bar.dart';
import 'package:mb_user/widgets/home/transaction_item.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  final mockDeal = DealModel(
    id: 'deal-test-8a3f12',
    sellerId: 'user-seller-1',
    buyerId: 'user-buyer-1',
    title: 'Hợp đồng chuyển nhượng mã nguồn Rust Escrow',
    description: 'Chuyển giao quyền sở hữu và két số',
    amount: 15000000,
    currency: 'VND',
    state: DealState.deposited,
    inspectionDuration: 86400,
    createdAt: DateTime.now().toIso8601String(),
    updatedAt: DateTime.now().toIso8601String(),
  );

  test('DealCacheService calculates balance correctly', () {
    final deals = [
      mockDeal,
      const DealModel(
        id: 'deal-2',
        sellerId: 'seller',
        title: 'Deal Settled',
        amount: 5000000,
        currency: 'VND',
        state: DealState.settled,
        inspectionDuration: 3600,
      ),
    ];

    final summary = EscrowBalanceSummary.fromDeals(deals);
    expect(summary.lockedBalance, 15000000);
    expect(summary.availableBalance, 5000000);
    expect(summary.totalBalance, 20000000);
    expect(summary.activeDealsCount, 1);
  });

  testWidgets('BalanceEscrowCard renders figures and action buttons',
      (tester) async {
    const summary = EscrowBalanceSummary(
      lockedBalance: 15000000,
      availableBalance: 5000000,
      disputedBalance: 0,
      activeDealsCount: 2,
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: BalanceEscrowCard(
            balanceSummary: summary,
            onDepositTap: () {},
            onWithdrawTap: () {},
          ),
        ),
      ),
    );

    expect(find.text('TỔNG GIÁ TRỊ KÝ QUỸ'), findsOneWidget);
    expect(find.text('20.000.000 ₫'), findsOneWidget);
    expect(find.text('15.000.000 ₫'), findsOneWidget);
    expect(find.text('5.000.000 ₫'), findsOneWidget);
    expect(find.text('Nạp Ký Quỹ'), findsOneWidget);
    expect(find.text('Rút Tiền'), findsOneWidget);
  });

  testWidgets('QuickActionsBar displays 3 ergonomic action buttons',
      (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: QuickActionsBar(
            onCreateDeal: () {},
            onScanQr: () {},
            onOpenVault: () {},
          ),
        ),
      ),
    );

    expect(find.text('Tạo Giao Dịch Mới'), findsOneWidget);
    expect(find.text('Quét VietQR'), findsOneWidget);
    expect(find.text('Mở Két Số'), findsOneWidget);
  });

  testWidgets(
      'TransactionItem displays deal ID, status badge and tabular price',
      (tester) async {
    DealModel? selected;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: TransactionItem(
            deal: mockDeal,
            onSelect: (d) => selected = d,
          ),
        ),
      ),
    );

    expect(find.text('Hợp đồng chuyển nhượng mã nguồn Rust Escrow'),
        findsOneWidget);
    expect(find.text('15.000.000 ₫'), findsOneWidget);
    expect(find.text('Đã Khóa Tiền'), findsOneWidget);

    await tester.tap(find.byType(TransactionItem));
    expect(selected?.id, 'deal-test-8a3f12');
  });
}
