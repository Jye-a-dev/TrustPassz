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

  // Environment variables injected via --dart-define
  static const String _envApiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: String.fromEnvironment('API_BASE_URL'),
  );
  static const String _envLanIp = String.fromEnvironment('LAN_IP');
  static const String _envPort = String.fromEnvironment('BACKEND_PORT', defaultValue: '3000');
  static const bool _isPhysicalDevice = bool.fromEnvironment('IS_PHYSICAL_DEVICE', defaultValue: false);

  String? _customBaseUrl;

  /// Dynamically computes the primary base URL based on platform and environment
  String get baseUrl {
    if (_customBaseUrl != null && _customBaseUrl!.isNotEmpty) {
      return _customBaseUrl!;
    }

    // Priority 1: Explicit --dart-define=API_URL=... or API_BASE_URL=...
    if (_envApiUrl.isNotEmpty) {
      return _envApiUrl;
    }

    // Priority 2: Web runtime
    if (kIsWeb) {
      return 'http://localhost:$_envPort';
    }

    // Priority 3 & 4: Mobile and Desktop platforms
    try {
      if (Platform.isAndroid) {
        if (_isPhysicalDevice) {
          // Physical device via Wi-Fi if explicitly requested with LAN_IP
          if (_envLanIp.isNotEmpty && const bool.fromEnvironment('USE_WIFI', defaultValue: false)) {
            return 'http://$_envLanIp:$_envPort';
          }
          // Physical device via USB reverse (adb reverse tcp:3000 tcp:3000)
          return 'http://localhost:$_envPort';
        }

        // Standard Android Emulator loopback to host machine
        return 'http://10.0.2.2:$_envPort';
      }

      // iOS Simulator or macOS / Windows / Linux desktop
      if (Platform.isIOS || Platform.isMacOS || Platform.isWindows || Platform.isLinux) {
        return 'http://localhost:$_envPort';
      }
    } catch (_) {
      // Fallback for non-standard runtimes
    }

    return 'http://localhost:$_envPort';
  }

  void setBaseUrl(String url) {
    _customBaseUrl = url;
  }

  /// List of candidate fallback URLs to probe when resolving connectivity
  List<String> get candidateUrls {
    final list = <String>[];
    if (_customBaseUrl != null && _customBaseUrl!.isNotEmpty) {
      list.add(_customBaseUrl!);
    }
    if (_envApiUrl.isNotEmpty && !list.contains(_envApiUrl)) {
      list.add(_envApiUrl);
    }

    if (kIsWeb) {
      list.add('http://localhost:$_envPort');
      return list;
    }

    try {
      if (Platform.isAndroid) {
        if (_isPhysicalDevice) {
          list.add('http://localhost:$_envPort');
          if (_envLanIp.isNotEmpty) {
            list.add('http://$_envLanIp:$_envPort');
          }
          list.add('http://10.0.2.2:$_envPort');
        } else {
          list.add('http://10.0.2.2:$_envPort');
          list.add('http://localhost:$_envPort');
          if (_envLanIp.isNotEmpty) {
            list.add('http://$_envLanIp:$_envPort');
          }
        }
      } else {
        list.add('http://localhost:$_envPort');
        if (_envLanIp.isNotEmpty) {
          list.add('http://$_envLanIp:$_envPort');
        }
      }
    } catch (_) {
      list.add('http://localhost:$_envPort');
    }

    return list.toSet().toList();
  }

  /// Pings /api/v1/health or custom endpoint, returning latency in ms.
  /// If the primary baseUrl fails and no custom URL was manually forced,
  /// this seamlessly probes candidate fallback URLs and locks in the working one.
  Future<int> checkHealthLatency({
    String endpoint = '/api/v1/health',
    Duration timeout = const Duration(milliseconds: 500),
  }) async {
    final stopwatch = Stopwatch()..start();
    try {
      await get(endpoint, skipAuth: true, timeout: timeout);
      stopwatch.stop();
      return stopwatch.elapsedMilliseconds;
    } catch (e) {
      // If primary failed and baseUrl was not manually pinned, auto-probe fallback candidates
      if (_customBaseUrl == null) {
        for (final candidate in candidateUrls) {
          if (candidate == baseUrl) continue;
          try {
            final uri = Uri.parse('$candidate${endpoint.startsWith('/') ? endpoint : '/$endpoint'}');
            final reqHeaders = await _buildHeaders(skipAuth: true);
            final res = await http.get(uri, headers: reqHeaders).timeout(timeout);
            if (res.statusCode >= 200 && res.statusCode < 400) {
              setBaseUrl(candidate);
              stopwatch.stop();
              return stopwatch.elapsedMilliseconds;
            }
          } catch (_) {
            // Continue probing next candidate
          }
        }
      }
      rethrow;
    }
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
    final normalizedEndpoint =
        endpoint.startsWith('/') ? endpoint : '/$endpoint';
    return Uri.parse('$baseUrl$normalizedEndpoint');
  }

  Future<dynamic> get(
    String endpoint, {
    bool skipAuth = false,
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 15),
  }) async {
    final uri = _resolveUri(endpoint);
    final reqHeaders =
        await _buildHeaders(skipAuth: skipAuth, extraHeaders: headers);

    try {
      final response =
          await http.get(uri, headers: reqHeaders).timeout(timeout);
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
    final reqHeaders =
        await _buildHeaders(skipAuth: skipAuth, extraHeaders: headers);
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
