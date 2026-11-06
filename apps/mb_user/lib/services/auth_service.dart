import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import 'api_client.dart';

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
    String? walletAddress,
    String? signature,
    String? nonce,
  }) async {
    final payload = <String, dynamic>{
      'provider': provider.toLowerCase().trim(),
      'token': token.trim(),
    };
    if (email != null && email.isNotEmpty) {
      payload['email'] = email.trim();
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

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(tokenKey, authRes.accessToken);
    if (authRes.refreshToken != null && authRes.refreshToken!.isNotEmpty) {
      await prefs.setString(refreshTokenKey, authRes.refreshToken!);
    }
    await prefs.setString(userKey, jsonEncode(authRes.user.toJson()));

    return authRes;
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
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(tokenKey);
    await prefs.remove(refreshTokenKey);
    await prefs.remove(userKey);

    try {
      await ApiClient.instance.post('/api/v1/auth/logout');
    } catch (_) {
      // Ignore network error on logout
    }
  }
}
