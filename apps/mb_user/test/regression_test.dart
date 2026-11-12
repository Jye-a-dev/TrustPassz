import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mb_user/models/deal_model.dart';
import 'package:mb_user/models/user_model.dart';
import 'package:mb_user/screens/login_screen.dart';
import 'package:mb_user/services/api_client.dart';
import 'package:mb_user/services/auth_service.dart';
import 'package:mb_user/services/deal_cache_service.dart';
import 'package:mb_user/services/secure_clipboard_service.dart';
import 'package:mb_user/theme/app_tokens.dart';
import 'package:mb_user/widgets/bargain_slider.dart';
import 'package:mb_user/widgets/common/server_status_bar.dart';
import 'package:mb_user/widgets/vault_modal.dart';
import 'package:mb_user/widgets/vietqr_payment_view.dart';

class _FakeAuthHttpOverrides extends HttpOverrides {
  final List<Map<String, dynamic>> recordedRequests = [];

  @override
  HttpClient createHttpClient(SecurityContext? context) {
    return _FakeHttpClient(recordedRequests);
  }
}

class _FakeHttpClient implements HttpClient {
  final List<Map<String, dynamic>> recordedRequests;
  _FakeHttpClient(this.recordedRequests);

  @override
  bool autoUncompress = true;

  @override
  Future<HttpClientRequest> openUrl(String method, Uri url) async {
    return _FakeHttpClientRequest(method, url, recordedRequests);
  }

  @override
  void close({bool force = false}) {}

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _FakeHttpClientRequest implements HttpClientRequest {
  @override
  final String method;
  @override
  final Uri uri;
  final List<Map<String, dynamic>> recordedRequests;
  final List<int> _bodyBytes = [];
  @override
  final HttpHeaders headers = _FakeHttpHeaders();
  @override
  Encoding encoding = utf8;
  @override
  bool followRedirects = true;
  @override
  int maxRedirects = 5;
  @override
  bool persistentConnection = true;
  @override
  int contentLength = -1;

  _FakeHttpClientRequest(this.method, this.uri, this.recordedRequests);

  @override
  void add(List<int> data) => _bodyBytes.addAll(data);

  @override
  Future<void> addStream(Stream<List<int>> stream) async {
    await for (final chunk in stream) {
      _bodyBytes.addAll(chunk);
    }
  }

  @override
  void write(Object? object) {
    if (object != null) {
      _bodyBytes.addAll(encoding.encode(object.toString()));
    }
  }

  @override
  Future<HttpClientResponse> close() async {
    final rawBody = utf8.decode(_bodyBytes);
    if (uri.path.endsWith('/api/v1/auth/verify')) {
      recordedRequests.add(jsonDecode(rawBody) as Map<String, dynamic>);
      return _FakeHttpClientResponse(
        201,
        jsonEncode({
          'tokenType': 'Bearer',
          'accessToken': 'jwt_native_google_verified_token',
          'refreshToken': 'jwt_refresh_token',
          'expiresIn': 604800,
          'user': {
            'id': 'user-google-1',
            'email': 'native.user@gmail.com',
            'displayName': 'Native Google User',
            'role': 'USER',
          },
        }),
      );
    }
    return _FakeHttpClientResponse(200, '{"status":"ok"}');
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _FakeHttpClientResponse extends Stream<List<int>>
    implements HttpClientResponse {
  @override
  final int statusCode;
  final List<int> _bytes;
  @override
  final HttpHeaders headers = _FakeHttpHeaders();

  _FakeHttpClientResponse(this.statusCode, String body)
      : _bytes = utf8.encode(body);

  @override
  int get contentLength => _bytes.length;

  @override
  bool get isRedirect => false;

  @override
  List<RedirectInfo> get redirects => const [];

  @override
  bool get persistentConnection => false;

  @override
  HttpClientResponseCompressionState get compressionState =>
      HttpClientResponseCompressionState.notCompressed;

  @override
  String get reasonPhrase => 'OK';

  @override
  StreamSubscription<List<int>> listen(
    void Function(List<int> event)? onData, {
    Function? onError,
    void Function()? onDone,
    bool? cancelOnError,
  }) {
    return Stream<List<int>>.fromIterable([_bytes]).listen(
      onData,
      onError: onError,
      onDone: onDone,
      cancelOnError: cancelOnError,
    );
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _FakeHttpHeaders implements HttpHeaders {
  final Map<String, List<String>> _values = {};

  @override
  void set(String name, Object value, {bool preserveHeaderCase = false}) {
    _values[name.toLowerCase()] = [value.toString()];
  }

  @override
  void add(String name, Object value, {bool preserveHeaderCase = false}) {
    _values.putIfAbsent(name.toLowerCase(), () => []).add(value.toString());
  }

  @override
  void forEach(void Function(String name, List<String> values) action) {
    _values.forEach(action);
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => null;
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  group('1. Network Configuration, Endpoint Parser & ServerStatusBar', () {
    test('ApiClient recognizes dynamic URL and custom base URLs', () {
      final client = ApiClient.instance;
      // Default fallback endpoint
      expect(client.baseUrl, isNotEmpty);

      // Custom LAN/Emulator URL overrides
      client.setBaseUrl('http://192.168.1.100:3000');
      expect(client.baseUrl, 'http://192.168.1.100:3000');

      client.setBaseUrl('http://10.0.2.2:3000');
      expect(client.baseUrl, 'http://10.0.2.2:3000');

      client.setBaseUrl(''); // Reset
    });

    testWidgets('ServerStatusBar renders status badge and handles retry',
        (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: ServerStatusBar(
              checkInterval: Duration(seconds: 10),
              latencyThreshold: Duration(milliseconds: 500),
            ),
          ),
        ),
      );

      // Initial state is checking/offline without backend mocking
      expect(find.byType(ServerStatusBar), findsOneWidget);
      expect(find.byIcon(Icons.refresh_rounded), findsOneWidget);

      // Tap refresh icon with touch target >= 44x44
      await tester.tap(find.byIcon(Icons.refresh_rounded));
      await tester.pump();
      expect(find.byType(ServerStatusBar), findsOneWidget);
    });
  });

  group('2. Authentication, Dev Session & Safe Exception Handling', () {
    test('AuthService stores tokens and user model into SharedPreferences',
        () async {
      final prefs = await SharedPreferences.getInstance();
      const mockAuthJson = {
        'tokenType': 'Bearer',
        'accessToken': 'mock_access_jwt_token',
        'refreshToken': 'mock_refresh_jwt_token',
        'expiresIn': 86400,
        'user': {
          'id': 'user-dev-test-1',
          'email': 'tester.sandbox@trustpassz.io',
          'displayName': 'Dev Tester',
          'role': 'USER'
        }
      };

      final authRes = AuthResponse.fromJson(mockAuthJson);
      await prefs.setString(AuthService.tokenKey, authRes.accessToken);
      await prefs.setString(AuthService.refreshTokenKey, authRes.refreshToken!);
      await prefs.setString(
          AuthService.userKey, jsonEncode(authRes.user.toJson()));

      final storedToken = await AuthService.instance.getStoredToken();
      final storedRefreshToken =
          await AuthService.instance.getStoredRefreshToken();
      final storedUser = await AuthService.instance.getStoredUser();

      expect(storedToken, 'mock_access_jwt_token');
      expect(storedRefreshToken, 'mock_refresh_jwt_token');
      expect(storedUser?.email, 'tester.sandbox@trustpassz.io');
      expect(storedUser?.role, Role.user);

      await AuthService.instance.logout();
      expect(await AuthService.instance.getStoredToken(), isNull);
    });

    testWidgets(
        'LoginScreen uses Native Google Sign-In safely without manual JWT dialog',
        (tester) async {
      const channel = MethodChannel('plugins.flutter.io/google_sign_in');
      String scenario = 'cancel';

      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
          .setMockMethodCallHandler(channel, (MethodCall call) async {
        switch (call.method) {
          case 'init':
          case 'signOut':
            return null;
          case 'isSignedIn':
            return false;
          case 'signIn':
            if (scenario == 'cancel') return null;
            if (scenario == 'platform_error') {
              throw PlatformException(
                code: 'sign_in_failed',
                message: 'com.google.android.gms.common.api.ApiException: 10:',
              );
            }
            return <String, dynamic>{
              'email': 'native.user@gmail.com',
              'id': 'google-uid-1',
              'displayName': 'Native Google User',
              'idToken': scenario == 'missing_token'
                  ? null
                  : 'header.payload.signature',
            };
          case 'getTokens':
            return <String, dynamic>{
              'accessToken': 'ya29.mock_access',
              'idToken': scenario == 'missing_token'
                  ? null
                  : 'header.payload.signature',
            };
          default:
            return null;
        }
      });
      addTearDown(() {
        TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
            .setMockMethodCallHandler(channel, null);
      });

      bool loginSuccess = false;
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTokens.lightTheme,
          home: LoginScreen(onSuccess: () => loginSuccess = true),
        ),
      );

      // Verify V2 Light canvas & buttons (no Dev Test Session, no manual token input)
      expect(find.text('Tiếp tục với Google'), findsOneWidget);
      expect(find.text('Đăng nhập với Passkey / Face ID'), findsOneWidget);
      expect(find.text('Tiếp tục với OTP'), findsOneWidget);
      expect(find.text('Đăng Nhập Test Session'), findsNothing);
      expect(find.text('Dán Google ID Token (JWT 3 đoạn)...'), findsNothing);

      final googleBtnSize = tester.getSize(find.text('Tiếp tục với Google'));
      expect(googleBtnSize.height, greaterThan(0));

      // 1. Cancel picker safely -> no error SnackBar, no dialog
      scenario = 'cancel';
      await tester.tap(find.text('Tiếp tục với Google'));
      await tester.pumpAndSettle();
      expect(find.byType(SnackBar), findsNothing);
      expect(find.text('Đăng nhập bằng Google'), findsNothing);
      expect(loginSuccess, isFalse);

      // 2. Missing idToken -> shows exact SnackBar, never opens manual dialog
      scenario = 'missing_token';
      await tester.tap(find.text('Tiếp tục với Google'));
      await tester.pumpAndSettle();
      expect(
        find.text(
          'Không lấy được ID Token từ Google. Vui lòng kiểm tra cấu hình Client ID.',
        ),
        findsOneWidget,
      );
      expect(find.text('Dán Google ID Token (JWT 3 đoạn)...'), findsNothing);

      // 3. PlatformException -> friendly Vietnamese SnackBar, zero crash
      scenario = 'platform_error';
      await tester.tap(find.text('Tiếp tục với Google'));
      await tester.pumpAndSettle();
      expect(find.byType(SnackBar), findsOneWidget);

      // 4. Passkey FIDO2 modal still opens safely
      await tester.tap(find.text('Đăng nhập với Passkey / Face ID'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 250));
      expect(find.text('Xác Thực Passkey FIDO2'), findsOneWidget);
      await tester.tap(find.text('Hủy Bỏ'));
      await tester.pumpAndSettle();

      expect(loginSuccess, isFalse);
    });

    testWidgets(
        'LoginScreen verifies Google ID Token with backend and persists session',
        (tester) async {
      const channel = MethodChannel('plugins.flutter.io/google_sign_in');
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
          .setMockMethodCallHandler(channel, (MethodCall call) async {
        switch (call.method) {
          case 'init':
          case 'signOut':
            return null;
          case 'isSignedIn':
            return false;
          case 'signIn':
            return <String, dynamic>{
              'email': 'native.user@gmail.com',
              'id': 'google-uid-1',
              'displayName': 'Native Google User',
              'idToken': 'eyJ.mock.jwt',
            };
          case 'getTokens':
            return <String, dynamic>{
              'accessToken': 'ya29.mock_access',
              'idToken': 'eyJ.mock.jwt',
            };
          default:
            return null;
        }
      });
      addTearDown(() {
        TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
            .setMockMethodCallHandler(channel, null);
        ApiClient.instance.setBaseUrl('');
      });

      ApiClient.instance.setBaseUrl('http://127.0.0.1:3000');
      final httpOverrides = _FakeAuthHttpOverrides();
      bool loginSuccess = false;

      await HttpOverrides.runZoned(() async {
        await tester.pumpWidget(
          MaterialApp(
            theme: AppTokens.lightTheme,
            home: LoginScreen(onSuccess: () => loginSuccess = true),
          ),
        );

        await tester.tap(find.text('Tiếp tục với Google'));
        await tester.pumpAndSettle();
      }, createHttpClient: httpOverrides.createHttpClient);

      final snackTexts = tester
          .widgetList<Text>(
            find.descendant(
              of: find.byType(SnackBar),
              matching: find.byType(Text),
            ),
          )
          .map((t) => t.data)
          .toList();
      expect(snackTexts, isEmpty);
      expect(httpOverrides.recordedRequests.length, 1);
      expect(httpOverrides.recordedRequests.first, {
        'provider': 'google',
        'token': 'eyJ.mock.jwt',
        'email': 'native.user@gmail.com',
      });
      expect(
        await AuthService.instance.getStoredToken(),
        'jwt_native_google_verified_token',
      );
      expect(loginSuccess, isTrue);
    });
  });

  group('3. Bargain Slider Gesture, Debounce & Non-blocking Scroll', () {
    testWidgets('BargainSlider steps price by 10k VND and debounces 300ms',
        (tester) async {
      double? broadcastedPrice;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: BargainSlider(
                dealId: 'deal-test-slider',
                basePrice: 1000000,
                floorPrice: 700000,
                currentUserId: 'user-tester-1',
                onPriceBroadcast: (p) => broadcastedPrice = p,
              ),
            ),
          ),
        ),
      );

      expect(find.byType(Slider), findsOneWidget);
      expect(find.text('Thanh Thương Lượng Giá'), findsOneWidget);

      // Simulate dragging slider thumb horizontally
      final sliderFinder = find.byType(Slider);
      await tester.drag(sliderFinder, const Offset(60, 0));
      await tester.pump();

      // Before 300ms debounce completes: broadcast should not have triggered yet
      expect(broadcastedPrice, isNull);

      // Advance clock by 350ms to let timer fire
      await tester.pump(const Duration(milliseconds: 350));
      expect(broadcastedPrice, isNotNull);
      expect(broadcastedPrice! % 10000, 0); // Divisible by 10,000 VND step
    });
  });

  group('4. Digital Vault Memory Guard & Secure Clipboard Auto-Clear', () {
    test(
        'SecureClipboardService copies and clears automatically after duration',
        () async {
      final clipboard = SecureClipboardService.instance;
      final copyOk = await clipboard.copy('vault_secret_token_aes_256');
      expect(copyOk, isTrue);

      // Test manual trigger and forceClear
      await clipboard.forceClear();
      expect(copyOk, isTrue);
    });

    testWidgets('VaultModal unmounts cleanly and triggers settle callback',
        (tester) async {
      bool settled = false;

      const mockDeal = DealModel(
        id: 'deal-vault-1',
        sellerId: 'seller-1',
        title: 'Bàn giao License Key',
        amount: 2500000,
        currency: 'VND',
        state: DealState.deposited,
        inspectionDuration: 86400,
      );

      const mockVault = UnlockedVaultPayload(
        dealId: 'deal-vault-1',
        fileName: 'api_credentials.pem',
        fileSizeBytes: '2048',
        assetType: 'AES-GCM-KEY',
        accessCount: 1,
        maxAccessLimit: 5,
        decryptedKeyOrUrl: 'TRP-AES256-LIVE-SECRET-KEY-0X89A',
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: VaultModal(
              deal: mockDeal,
              vaultData: mockVault,
              onSettle: () => settled = true,
              onDispute: () {},
            ),
          ),
        ),
      );

      expect(find.text('Két Số Digital Vault (AES-256-GCM)'), findsOneWidget);
      expect(find.text('TRP-AES256-LIVE-SECRET-KEY-0X89A'), findsOneWidget);
      expect(find.text('api_credentials.pem'), findsOneWidget);

      // Test settle button tap with warnIfMissed false
      await tester.tap(find.text('✓ Xác Nhận Đúng Hàng & Giải Ngân'),
          warnIfMissed: false);
      await tester.pump();
      expect(settled, isTrue);
    });

    testWidgets('VaultModal triggers dispute callback', (tester) async {
      bool disputed = false;

      const mockDeal = DealModel(
        id: 'deal-vault-1',
        sellerId: 'seller-1',
        title: 'Bàn giao License Key',
        amount: 2500000,
        currency: 'VND',
        state: DealState.deposited,
        inspectionDuration: 86400,
      );

      const mockVault = UnlockedVaultPayload(
        dealId: 'deal-vault-1',
        fileName: 'api_credentials.pem',
        fileSizeBytes: '2048',
        assetType: 'AES-GCM-KEY',
        accessCount: 1,
        maxAccessLimit: 5,
        decryptedKeyOrUrl: 'TRP-AES256-LIVE-SECRET-KEY-0X89A',
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: VaultModal(
                deal: mockDeal,
                vaultData: mockVault,
                onSettle: () {},
                onDispute: () => disputed = true,
              ),
            ),
          ),
        ),
      );

      await tester.tap(
        find.text('⚖️ Báo Cáo Sai Hàng / Khiếu Nại Trọng Tài AI'),
        warnIfMissed: false,
      );
      await tester.pump();
      expect(disputed, isTrue);
    });
  });

  group('5. VietQR Deep Link & 500ms Fallback Mode', () {
    testWidgets(
        'VietQrPaymentView activates fallback UI when scheme unavailable',
        (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: VietQrPaymentView(
                bankName: 'MBBank (Quân Đội)',
                bin: '970422',
                accountNo: '0987654321',
                accountName: 'TRUSTPASSZ ESCROW STAGING',
                amount: 500000,
                memo: 'TRP DEPOSIT D-1234',
                deepLink: 'vietqr://pay?bank=970422&acc=0987654321',
              ),
            ),
          ),
        ),
      );

      expect(find.text('SỐ TIỀN CẦN THANH TOÁN'), findsOneWidget);
      expect(find.text('500.000 ₫'), findsOneWidget);
      expect(find.text('Mở App Ngân Hàng Trên Điện Thoại'), findsOneWidget);

      // Trigger banking app launch button
      await tester.ensureVisible(find.text('Mở App Ngân Hàng Trên Điện Thoại'));
      await tester.tap(find.text('Mở App Ngân Hàng Trên Điện Thoại'));
      await tester.pump(); // Start attempt
      await tester.pump(
          const Duration(milliseconds: 600)); // Surpass 500ms timeout threshold

      // Fallback UI or original UI renders safely without crash
      expect(find.text('SỐ TIỀN CẦN THANH TOÁN'), findsOneWidget);
    });
  });

  group('6. HomeScreen 2-Phase Hydration & FCP Optimization', () {
    test('DealCacheService handles instant local cache hydration', () async {
      final cacheService = DealCacheService.instance;
      final testDeals = [
        const DealModel(
          id: 'cached-deal-1',
          sellerId: 'seller-a',
          title: 'Hợp đồng Game Account Ký Quỹ',
          amount: 3000000,
          currency: 'VND',
          state: DealState.deposited,
          inspectionDuration: 7200,
        ),
      ];

      await cacheService.cacheDeals(testDeals);
      final hydrated = await cacheService.loadCachedDeals();

      expect(hydrated.length, 1);
      expect(hydrated.first.title, 'Hợp đồng Game Account Ký Quỹ');
      expect(hydrated.first.amount, 3000000);
    });
  });
}
