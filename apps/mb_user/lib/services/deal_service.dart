import 'package:http/http.dart' as http;
import '../models/deal_model.dart';
import 'api_client.dart';

class DealService {
  DealService._internal();
  static final DealService instance = DealService._internal();

  Future<List<DealModel>> fetchDeals({
    int page = 1,
    int limit = 50,
    String? status,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };
    if (status != null && status != 'ALL') {
      queryParams['status'] = status;
    }

    final queryString = Uri(queryParameters: queryParams).query;
    final endpoint = '/api/v1/deals?$queryString';

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

  Future<DealModel> fetchDealById(String id) async {
    final response = await ApiClient.instance.get('/api/v1/deals/$id');
    if (response is Map<String, dynamic>) {
      final data = response['data'] is Map<String, dynamic>
          ? response['data'] as Map<String, dynamic>
          : response;
      return DealModel.fromJson(data);
    }
    throw ApiException(500, 'Không tìm thấy dữ liệu kèo $id');
  }

  Future<Map<String, dynamic>> proposeBargain({
    required String dealId,
    required double offerPrice,
    String? message,
  }) async {
    final body = {
      'dealId': dealId,
      'offerPrice': offerPrice.toInt(),
      'message': message ??
          'Khách hàng đề xuất mức giá: ${offerPrice.toInt()} VND',
      'expiresInHours': 24,
    };

    final response = await ApiClient.instance.post('/api/v1/bargains', body: body);
    if (response is Map<String, dynamic>) {
      return response;
    }
    return {'status': 'SUCCESS'};
  }

  Future<UnlockedVaultPayload> unlockDealVault(String dealId) async {
    final response = await ApiClient.instance.post('/api/v1/deals/$dealId/vault/unlock');
    if (response is Map<String, dynamic>) {
      final payloadData = response['data'] is Map<String, dynamic>
          ? response['data'] as Map<String, dynamic>
          : response;
      return UnlockedVaultPayload.fromJson(payloadData);
    }
    throw ApiException(500, 'Dữ liệu két số không hợp lệ');
  }

  Future<bool> settleEscrowDeal(String dealId) async {
    final response = await ApiClient.instance.post('/api/v1/deals/$dealId/settle');
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

