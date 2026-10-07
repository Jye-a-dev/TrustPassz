import 'dart:convert';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiException implements Exception {
  final int statusCode;
  final String message;

  ApiException(this.statusCode, this.message);

  @override
  String toString() => '[API $statusCode] $message';
}

class ApiClient {
  ApiClient._internal();
  static final ApiClient instance = ApiClient._internal();

  static const String tokenKey = 'trustpassz_auth_token';

  String? _customBaseUrl;

  String get baseUrl {
    if (_customBaseUrl != null && _customBaseUrl!.isNotEmpty) {
      return _customBaseUrl!;
    }

    const envUrl = String.fromEnvironment('API_BASE_URL');
    if (envUrl.isNotEmpty) {
      return envUrl;
    }

    if (kIsWeb) {
      return 'http://localhost:3000';
    }

    try {
      if (Platform.isAndroid) {
        // Standard Android emulator loopback to host machine
        return 'http://10.0.2.2:3000';
      }
    } catch (_) {
      // Fallback for non-standard runtimes
    }

    return 'http://localhost:3000';
  }

  void setBaseUrl(String url) {
    _customBaseUrl = url;
  }

  Future<Map<String, String>> _buildHeaders({
    bool skipAuth = false,
    Map<String, String>? extraHeaders,
  }) async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (!skipAuth) {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString(tokenKey);
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    if (extraHeaders != null) {
      headers.addAll(extraHeaders);
    }

    return headers;
  }

  Uri _resolveUri(String endpoint) {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return Uri.parse(endpoint);
    }
    final normalizedEndpoint = endpoint.startsWith('/') ? endpoint : '/$endpoint';
    return Uri.parse('$baseUrl$normalizedEndpoint');
  }

  Future<dynamic> get(
    String endpoint, {
    bool skipAuth = false,
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 15),
  }) async {
    final uri = _resolveUri(endpoint);
    final reqHeaders = await _buildHeaders(skipAuth: skipAuth, extraHeaders: headers);

    try {
      final response = await http.get(uri, headers: reqHeaders).timeout(timeout);
      return _handleResponse(response);
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(0, 'Kết nối thất bại tới $uri: $e');
    }
  }

  Future<dynamic> post(
    String endpoint, {
    dynamic body,
    bool skipAuth = false,
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 15),
  }) async {
    final uri = _resolveUri(endpoint);
    final reqHeaders = await _buildHeaders(skipAuth: skipAuth, extraHeaders: headers);
    final encodedBody = body != null ? jsonEncode(body) : null;

    try {
      final response = await http
          .post(uri, headers: reqHeaders, body: encodedBody)
          .timeout(timeout);
      return _handleResponse(response);
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(0, 'Kết nối thất bại tới $uri: $e');
    }
  }

  Future<dynamic> postMultipart(
    String endpoint, {
    required Map<String, String> fields,
    required List<http.MultipartFile> files,
    bool skipAuth = false,
    Duration timeout = const Duration(seconds: 30),
  }) async {
    final uri = _resolveUri(endpoint);
    final request = http.MultipartRequest('POST', uri);

    final reqHeaders = await _buildHeaders(skipAuth: skipAuth);
    // Remove content-type so multipart boundary is auto-generated
    reqHeaders.remove('Content-Type');
    request.headers.addAll(reqHeaders);

    request.fields.addAll(fields);
    request.files.addAll(files);

    try {
      final streamedResponse = await request.send().timeout(timeout);
      final response = await http.Response.fromStream(streamedResponse);
      return _handleResponse(response);
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(0, 'Tải lên bằng chứng thất bại: $e');
    }
  }

  dynamic _handleResponse(http.Response response) {
    final utf8Body = utf8.decode(response.bodyBytes);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (utf8Body.isEmpty) return null;
      try {
        return jsonDecode(utf8Body);
      } catch (_) {
        return utf8Body;
      }
    }

    String errorMessage = utf8Body;
    try {
      final decoded = jsonDecode(utf8Body);
      if (decoded is Map<String, dynamic>) {
        errorMessage = decoded['message']?.toString() ??
            decoded['error']?.toString() ??
            utf8Body;
      }
    } catch (_) {
      // Use raw text body
    }

    throw ApiException(response.statusCode, errorMessage);
  }
}

