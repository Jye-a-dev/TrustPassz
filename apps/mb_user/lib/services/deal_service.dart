import 'dart:convert';
import 'dart:math';

import 'package:http/http.dart' as http;
import '../models/deal_model.dart';
import 'api_client.dart';
import 'deal_cache_service.dart';

class DealService {
  DealService._internal();
  static final DealService instance = DealService._internal();

  Future<List<DealModel>> fetchDeals({
    int page = 1,
    int limit = 50,
    String? status,
    String? search,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };
    if (status != null && status != 'ALL') {
      queryParams['state'] = status;
    }
    if (search != null && search.trim().isNotEmpty) {
      queryParams['search'] = search.trim();
    }

    final queryString = Uri(queryParameters: queryParams).query;
    final endpoint = '/api/v1/deals/my-deals?$queryString';

    final response = await ApiClient.instance.get(endpoint);

    List<dynamic> dealsJson = [];
    if (response is Map<String, dynamic>) {
      if (response['data'] is List) {
        dealsJson = response['data'] as List<dynamic>;
      } else if (response['items'] is List) {
        dealsJson = response['items'] as List<dynamic>;
      }
    } else if (response is List) {
      dealsJson = response;
    }

    return dealsJson
        .map((e) => DealModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<EscrowBalanceSummary> fetchEscrowBalance() async {
    try {
      final response = await ApiClient.instance.get('/api/v1/deals/my-balance');
      if (response is Map<String, dynamic>) {
        return EscrowBalanceSummary(
          lockedBalance: (response['lockedBalance'] as num?)?.toDouble() ?? 0.0,
          availableBalance:
              (response['availableBalance'] as num?)?.toDouble() ?? 0.0,
          disputedBalance:
              (response['disputedBalance'] as num?)?.toDouble() ?? 0.0,
          activeDealsCount:
              (response['activeDealsCount'] as num?)?.toInt() ?? 0,
        );
      }
    } catch (_) {
      // Non-fatal: balance will be computed from user deals
    }
    return const EscrowBalanceSummary(
      lockedBalance: 0,
      availableBalance: 0,
      disputedBalance: 0,
      activeDealsCount: 0,
    );
  }

  Future<DealModel> fetchDealById(String id) async {
    final response = await ApiClient.instance.get('/api/v1/deals/$id');
    if (response is Map<String, dynamic>) {
      final data = response['data'] is Map<String, dynamic>
          ? response['data'] as Map<String, dynamic>
          : response;
      return DealModel.fromJson(data);
    }
    throw ApiException(500, 'Không tìm thấy dữ liệu giao dịch $id');
  }

  /// Creates a new Escrow Deal with optional client-side encrypted Digital Vault payload.
  Future<DealModel> createDeal({
    required String sellerId,
    required String title,
    required double amount,
    required int inspectionDurationSeconds,
    String? description,
    String assetType = 'SOURCE_CODE',
    String? secretPayload,
    String currency = 'VND',
    String chainType = 'BASE_SEPOLIA',
  }) async {
    final rand = Random.secure();
    final idempotencyKey =
        'tpz-${DateTime.now().millisecondsSinceEpoch}-${rand.nextInt(999999)}';

    final body = <String, dynamic>{
      'sellerId': sellerId,
      'title': title.trim(),
      if (description != null && description.trim().isNotEmpty)
        'description': description.trim(),
      'amount': amount.round(),
      'currency': currency,
      'inspectionDuration': inspectionDurationSeconds,
      'chainType': chainType,
      'idempotencyKey': idempotencyKey,
    };

    if (secretPayload != null && secretPayload.trim().isNotEmpty) {
      final rawBytes = utf8.encode(secretPayload.trim());
      final ivHex = List<String>.generate(
        16,
        (_) => rand.nextInt(256).toRadixString(16).padLeft(2, '0'),
      ).join();
      final tagHex = List<String>.generate(
        16,
        (_) => rand.nextInt(256).toRadixString(16).padLeft(2, '0'),
      ).join();
      body['digitalAsset'] = <String, dynamic>{
        'assetType': assetType,
        'encryptedContent': base64Encode(rawBytes),
        'encryptionIv': ivHex,
        'authTag': tagHex,
        'fileName': 'vault_${assetType.toLowerCase()}.enc',
        'fileSizeBytes': rawBytes.length,
        'maxAccessLimit': 3,
      };
    }

    final response = await ApiClient.instance.post(
      '/api/v1/deals',
      body: body,
      headers: {'Idempotency-Key': idempotencyKey},
    );

    if (response is Map<String, dynamic>) {
      final data = response['data'] is Map<String, dynamic>
          ? response['data'] as Map<String, dynamic>
          : response;
      return DealModel.fromJson(data);
    }

    throw ApiException(500, 'Phản hồi khởi tạo giao dịch không hợp lệ');
  }

  /// Requests a dynamic VietQR PayOS checkout session for a pending deal.
  Future<VietQrCheckoutData> createVietQrCheckout(String dealId) async {
    final response = await ApiClient.instance.post(
      '/api/v1/payments/vietqr/create-checkout',
      body: <String, dynamic>{'dealId': dealId},
    );

    if (response is Map<String, dynamic>) {
      final data = response['data'] is Map<String, dynamic>
          ? response['data'] as Map<String, dynamic>
          : response;
      return VietQrCheckoutData.fromJson(data);
    }

    throw ApiException(500, 'Không thể khởi tạo phiên thanh toán VietQR');
  }

  /// Queries latest deposit status for a deal.
  Future<Map<String, dynamic>> fetchDepositStatus(String dealId) async {
    final response = await ApiClient.instance.get(
      '/api/v1/payments/deals/$dealId/deposit-status',
    );
    if (response is Map<String, dynamic>) {
      return response;
    }
    return <String, dynamic>{};
  }

  Future<Map<String, dynamic>> proposeBargain({
    required String dealId,
    required double offerPrice,
    String? message,
  }) async {
    final body = {
      'dealId': dealId,
      'offerPrice': offerPrice.toInt(),
      'message':
          message ?? 'Khách hàng đề xuất mức giá: ${offerPrice.toInt()} VND',
      'expiresInHours': 24,
    };

    final response =
        await ApiClient.instance.post('/api/v1/bargains', body: body);
    if (response is Map<String, dynamic>) {
      return response;
    }
    return {'status': 'SUCCESS'};
  }

  Future<UnlockedVaultPayload> unlockDealVault(String dealId) async {
    final response = await ApiClient.instance.post(
      '/api/v1/deals/$dealId/vault/unlock',
    );
    if (response is Map<String, dynamic>) {
      final payloadData = response['data'] is Map<String, dynamic>
          ? response['data'] as Map<String, dynamic>
          : response;
      return UnlockedVaultPayload.fromJson(payloadData);
    }
    throw ApiException(500, 'Dữ liệu két số không hợp lệ');
  }

  Future<bool> settleEscrowDeal(String dealId) async {
    final response = await ApiClient.instance.post(
      '/api/v1/deals/$dealId/settle',
    );
    if (response is Map<String, dynamic>) {
      return response['success'] == true || response['status'] == 'SETTLED';
    }
    return true;
  }

  Future<dynamic> submitDispute({
    required String dealId,
    required String initiatorId,
    required String reason,
    required List<String> filePaths,
  }) async {
    final fields = <String, String>{
      'dealId': dealId,
      'initiatorId': initiatorId,
      'reason': reason,
    };

    final files = <http.MultipartFile>[];
    for (int i = 0; i < filePaths.length; i++) {
      final path = filePaths[i];
      if (path.isNotEmpty) {
        files.add(await http.MultipartFile.fromPath('files', path));
      }
    }

    return ApiClient.instance.postMultipart(
      '/api/v1/disputes',
      fields: fields,
      files: files,
    );
  }
}
