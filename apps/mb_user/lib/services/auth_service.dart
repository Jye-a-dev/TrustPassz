import 'dart:async';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import 'api_client.dart';
import 'notification_service.dart';

class AuthService {
  AuthService._internal();
  static final AuthService instance = AuthService._internal();

  static const String tokenKey = 'trustpassz_auth_token';
  static const String refreshTokenKey = 'trustpassz_refresh_token';
  static const String userKey = 'trustpassz_user_profile';

  Future<AuthResponse> verifyAndAuthenticate({
    required String provider,
    required String token,
    String? email,
    String? password,
    String? displayName,
    String? walletAddress,
    String? signature,
    String? nonce,
  }) async {
    final payload = <String, dynamic>{
      'provider': provider.toLowerCase().trim(),
      if (token.trim().isNotEmpty) 'token': token.trim(),
    };
    if (email != null && email.trim().isNotEmpty) {
      payload['email'] = email.trim();
    }
    if (password != null && password.isNotEmpty) {
      payload['password'] = password;
    }
    if (displayName != null && displayName.trim().isNotEmpty) {
      payload['displayName'] = displayName.trim();
    }
    if (walletAddress != null && walletAddress.isNotEmpty) {
      payload['walletAddress'] = walletAddress.trim();
    }
    if (signature != null && signature.isNotEmpty) {
      payload['signature'] = signature.trim();
    }
    if (nonce != null && nonce.isNotEmpty) {
      payload['nonce'] = nonce.trim();
    }

    final response = await ApiClient.instance.post(
      '/api/v1/auth/verify',
      body: payload,
      skipAuth: true,
    );

    if (response is! Map<String, dynamic>) {
      throw ApiException(500, 'Định dạng phản hồi xác thực không hợp lệ');
    }

    final authRes = AuthResponse.fromJson(response);
    await _persistSession(authRes);
    return authRes;
  }

  /// Authenticates an email/password account (or registers if [displayName] is given).
  Future<AuthResponse> authenticateWithEmailPassword({
    required String email,
    required String password,
    String? displayName,
  }) async {
    return verifyAndAuthenticate(
      provider: 'email',
      token: '',
      email: email,
      password: password,
      displayName: displayName,
    );
  }

  /// Verifies a 6-digit OTP code against the auth verification endpoint.
  Future<AuthResponse> verifyOtp({
    required String identifier,
    required String otpCode,
  }) async {
    final trimmed = identifier.trim();
    final isEmail = trimmed.contains('@');
    return verifyAndAuthenticate(
      provider: 'otp',
      token: otpCode.trim(),
      email: isEmail ? trimmed : null,
    );
  }

  Future<void> _persistSession(AuthResponse authRes) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(tokenKey, authRes.accessToken);
    if (authRes.refreshToken != null && authRes.refreshToken!.isNotEmpty) {
      await prefs.setString(refreshTokenKey, authRes.refreshToken!);
    }
    await prefs.setString(userKey, jsonEncode(authRes.user.toJson()));

    unawaited(
      NotificationService.instance.syncDeviceTokenOnLogin(
        userId: authRes.user.id,
      ),
    );
  }

  Future<String?> getStoredToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(tokenKey);
  }

  Future<String?> getStoredRefreshToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(refreshTokenKey);
  }

  Future<UserModel?> getStoredUser() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(userKey);
    if (raw == null || raw.isEmpty) return null;

    try {
      final decoded = jsonDecode(raw) as Map<String, dynamic>;
      return UserModel.fromJson(decoded);
    } catch (_) {
      return null;
    }
  }

  Future<void> logout() async {
    final storedUser = await getStoredUser();
    try {
      await NotificationService.instance
          .revokeDeviceTokenOnLogout(userId: storedUser?.id)
          .timeout(const Duration(seconds: 3));
    } catch (_) {
      // Non-fatal on offline or unit test logout
    }

    try {
      await ApiClient.instance
          .post('/api/v1/auth/logout')
          .timeout(const Duration(seconds: 3));
    } catch (_) {
      // Ignore network error on logout
    }

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(tokenKey);
    await prefs.remove(refreshTokenKey);
    await prefs.remove(userKey);
  }
}
