import 'package:flutter/material.dart';
import '../models/deal_model.dart';
import '../theme/app_tokens.dart';
import 'checkout_vietqr_screen.dart';
import 'deal_create_screen.dart';
import 'deal_room_screen.dart';
import 'digital_vault_screen.dart';
import 'dispute_screen.dart';
import 'explore_deals_screen.dart';
import 'home_screen.dart';
import 'orders_history_screen.dart';
import 'profile_settings_screen.dart';

/// Main 5-Tab Application Shell V2:
/// 1. Trang Chủ (HomeScreen)
/// 2. Khám Phá (ExploreDealsScreen)
/// 3. Tạo Giao Dịch (DealCreateScreen)
/// 4. Đơn Hàng (OrdersHistoryScreen)
/// 5. Cá Nhân (ProfileSettingsScreen)
class MainAppShell extends StatefulWidget {
  final VoidCallback onLogout;
  final int initialTabIndex;

  const MainAppShell({
    super.key,
    required this.onLogout,
    this.initialTabIndex = 0,
  });

  @override
  State<MainAppShell> createState() => _MainAppShellState();
}

class _MainAppShellState extends State<MainAppShell> {
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialTabIndex.clamp(0, 4);
  }

  void _switchTab(int index) {
    if (index < 0 || index > 4) return;
    setState(() => _currentIndex = index);
  }

  void _openDealRoom(DealModel deal, {bool focusVault = false}) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (ctx) => DealRoomScreen(
          dealId: deal.id,
          initialFocusVault: focusVault,
          onBack: () => Navigator.of(ctx).pop(),
          onOpenDispute: (dealId) => _openDispute(dealId),
        ),
      ),
    );
  }

  void _openCheckout(DealModel deal) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (ctx) => CheckoutVietQrScreen(
          dealId: deal.id,
          initialDeal: deal,
          onBack: () => Navigator.of(ctx).pop(),
          onOpenVault: () {
            Navigator.of(ctx).pushReplacement(
              MaterialPageRoute<void>(
                builder: (vCtx) => DigitalVaultScreen(
                  dealId: deal.id,
                  inspectionDeadline: deal.inspectionDeadline,
                  onBack: () => Navigator.of(vCtx).pop(),
                  onOpenDispute: _openDispute,
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  void _openVault(DealModel deal) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (ctx) => DigitalVaultScreen(
          dealId: deal.id,
          inspectionDeadline: deal.inspectionDeadline,
          onBack: () => Navigator.of(ctx).pop(),
          onOpenDispute: _openDispute,
        ),
      ),
    );
  }

  void _openDispute(String dealId) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (ctx) => DisputeScreen(
          initialDealId: dealId,
          onBack: () => Navigator.of(ctx).pop(),
          onTrackOrders: () {
            Navigator.of(ctx).pop();
            _switchTab(3);
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = context.tp;

    final pages = <Widget>[
      HomeScreen(
        onSelectDeal: (deal) => _openDealRoom(deal),
        onOpenDisputeFlow: _openDispute,
        onLogout: widget.onLogout,
        onCreateDealTap: () => _switchTab(2),
        onViewAllOrdersTap: () => _switchTab(3),
        onProfileTap: () => _switchTab(4),
      ),
      ExploreDealsScreen(
        onSelectDeal: (deal) => _openDealRoom(deal),
      ),
      DealCreateScreen(
        onDealCreated: (createdDeal) {
          _switchTab(0);
          _openDealRoom(createdDeal);
        },
      ),
      OrdersHistoryScreen(
        onSelectDeal: (deal) => _openDealRoom(deal),
        onOpenCheckout: _openCheckout,
        onOpenVault: _openVault,
        onOpenDispute: _openDispute,
      ),
      ProfileSettingsScreen(
        onLogout: widget.onLogout,
      ),
    ];

    return Scaffold(
      backgroundColor: c.canvas,
      body: IndexedStack(
        index: _currentIndex,
        children: pages,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: c.surface,
          border: Border(top: BorderSide(color: c.border, width: 1.0)),
        ),
        child: NavigationBarTheme(
          data: NavigationBarThemeData(
            backgroundColor: c.surface,
            indicatorColor: c.emeraldSoft,
            surfaceTintColor: Colors.transparent,
            labelTextStyle: WidgetStateProperty.resolveWith((states) {
              final selected = states.contains(WidgetState.selected);
              return TextStyle(
                color: selected ? c.emeraldText : c.textMuted,
                fontSize: 10.5,
                fontWeight: selected ? FontWeight.bold : FontWeight.w500,
              );
            }),
            iconTheme: WidgetStateProperty.resolveWith((states) {
              final selected = states.contains(WidgetState.selected);
              return IconThemeData(
                color: selected ? c.emeraldText : c.textMuted,
                size: 22,
              );
            }),
          ),
          child: NavigationBar(
            height: 68,
            selectedIndex: _currentIndex,
            onDestinationSelected: _switchTab,
            labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
            destinations: const [
              NavigationDestination(
                icon: Icon(Icons.home_outlined),
                selectedIcon: Icon(Icons.home_rounded),
                label: 'Trang Chủ',
              ),
              NavigationDestination(
                icon: Icon(Icons.explore_outlined),
                selectedIcon: Icon(Icons.explore_rounded),
                label: 'Khám Phá',
              ),
              NavigationDestination(
                icon: Icon(Icons.add_circle_outline_rounded),
                selectedIcon: Icon(Icons.add_circle_rounded),
                label: 'Tạo Giao Dịch',
              ),
              NavigationDestination(
                icon: Icon(Icons.receipt_long_outlined),
                selectedIcon: Icon(Icons.receipt_long_rounded),
                label: 'Đơn Hàng',
              ),
              NavigationDestination(
                icon: Icon(Icons.person_outline_rounded),
                selectedIcon: Icon(Icons.person_rounded),
                label: 'Cá Nhân',
              ),
            ],
          ),
        ),
      ),
    );
  }
}
