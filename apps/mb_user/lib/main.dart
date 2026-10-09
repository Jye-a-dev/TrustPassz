import 'package:flutter/material.dart';
import 'models/deal_model.dart';
import 'services/auth_service.dart';
import 'screens/greeting_screen.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'screens/deal_room_screen.dart';
import 'screens/dispute_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const TrustPasszApp());
}

class TrustPasszApp extends StatelessWidget {
  const TrustPasszApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TrustPassz',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF080C14),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF06B6D4),
          secondary: Color(0xFF10B981),
          surface: Color(0xFF0F172A),
          error: Color(0xFFF43F5E),
        ),
        useMaterial3: true,
      ),
      home: const AppRootNavigator(),
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

  DealModel? _activeDeal;
  bool _isDisputeOpen = false;
  String? _disputeTargetDealId;

  @override
  void initState() {
    super.initState();
    _checkInitialAuth();
  }

  Future<void> _checkInitialAuth() async {
    final token = await AuthService.instance.getStoredToken();
    setState(() {
      _isAuthenticated = token != null && token.isNotEmpty;
      _hasSeenGreeting = _isAuthenticated;
      _isCheckingAuth = false;
    });
  }

  void _onGreetingComplete() {
    setState(() {
      _hasSeenGreeting = true;
    });
  }

  void _onLoginSuccess() {
    setState(() {
      _isAuthenticated = true;
      _hasSeenGreeting = true;
    });
  }

  void _onLogout() async {
    await AuthService.instance.logout();
    setState(() {
      _isAuthenticated = false;
      _activeDeal = null;
      _isDisputeOpen = false;
      _disputeTargetDealId = null;
    });
  }

  void _onSelectDeal(DealModel deal) {
    setState(() {
      _activeDeal = deal;
      _isDisputeOpen = false;
    });
  }

  void _onBackFromDealRoom() {
    setState(() {
      _activeDeal = null;
    });
  }

  void _onOpenDispute([String? dealId]) {
    setState(() {
      _disputeTargetDealId = dealId;
      _isDisputeOpen = true;
    });
  }

  void _onBackFromDispute() {
    setState(() {
      _isDisputeOpen = false;
      _disputeTargetDealId = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isCheckingAuth) {
      return const Scaffold(
        backgroundColor: Color(0xFF080C14),
        body: Center(
          child: CircularProgressIndicator(color: Color(0xFF22D3EE)),
        ),
      );
    }

    if (!_hasSeenGreeting) {
      return GreetingScreen(onContinue: _onGreetingComplete);
    }

    if (!_isAuthenticated) {
      return LoginScreen(onSuccess: _onLoginSuccess);
    }

    if (_isDisputeOpen) {
      return DisputeScreen(
        initialDealId: _disputeTargetDealId,
        onBack: _onBackFromDispute,
      );
    }

    if (_activeDeal != null) {
      return DealRoomScreen(
        dealId: _activeDeal!.id,
        onBack: _onBackFromDealRoom,
        onOpenDispute: (id) => _onOpenDispute(id),
      );
    }

    return HomeScreen(
      onSelectDeal: _onSelectDeal,
      onOpenDisputeFlow: () => _onOpenDispute(),
      onLogout: _onLogout,
    );
  }
}
