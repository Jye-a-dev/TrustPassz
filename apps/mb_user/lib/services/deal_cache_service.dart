import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/deal_model.dart';

class EscrowBalanceSummary {
  final double lockedBalance;
  final double availableBalance;
  final double disputedBalance;
  final int activeDealsCount;

  const EscrowBalanceSummary({
    required this.lockedBalance,
    required this.availableBalance,
    required this.disputedBalance,
    required this.activeDealsCount,
  });

  double get totalBalance => lockedBalance + availableBalance;

  factory EscrowBalanceSummary.fromDeals(List<DealModel> deals) {
    double locked = 0.0;
    double available = 0.0;
    double disputed = 0.0;
    int activeCount = 0;

    for (final deal in deals) {
      switch (deal.state) {
        case DealState.deposited:
        case DealState.inInspection:
          locked += deal.amount;
          activeCount++;
          break;
        case DealState.pending:
          activeCount++;
          break;
        case DealState.settled:
          available += deal.amount;
          break;
        case DealState.disputed:
          disputed += deal.amount;
          activeCount++;
          break;
        case DealState.refunded:
          break;
      }
    }

    return EscrowBalanceSummary(
      lockedBalance: locked,
      availableBalance: available,
      disputedBalance: disputed,
      activeDealsCount: activeCount,
    );
  }
}

class DealCacheService {
  DealCacheService._internal();
  static final DealCacheService instance = DealCacheService._internal();

  static const String _cacheKey = 'trustpassz_cached_deals_v1';
  List<DealModel>? _memoryCache;
  DateTime? _lastSyncTime;

  List<DealModel>? get inMemoryDeals => _memoryCache;
  DateTime? get lastSyncTime => _lastSyncTime;

  Future<List<DealModel>> loadCachedDeals() async {
    if (_memoryCache != null && _memoryCache!.isNotEmpty) {
      return _memoryCache!;
    }

    try {
      final prefs = await SharedPreferences.getInstance();
      final rawJson = prefs.getString(_cacheKey);
      if (rawJson == null || rawJson.isEmpty) {
        return [];
      }

      final decoded = jsonDecode(rawJson);
      if (decoded is List) {
        final list = decoded
            .map((item) => DealModel.fromJson(item as Map<String, dynamic>))
            .toList();
        _memoryCache = list;
        return list;
      }
    } catch (_) {
      // Fallback gracefully on parsing/storage error
    }

    return [];
  }

  Future<void> cacheDeals(List<DealModel> deals) async {
    _memoryCache = deals;
    _lastSyncTime = DateTime.now();

    try {
      final prefs = await SharedPreferences.getInstance();
      final rawJson = jsonEncode(deals.map((d) => d.toJson()).toList());
      await prefs.setString(_cacheKey, rawJson);
    } catch (_) {
      // Keep in-memory cache if SharedPreferences write encounters issues
    }
  }

  Future<void> clearCache() async {
    _memoryCache = null;
    _lastSyncTime = null;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_cacheKey);
    } catch (_) {
      // Ignore cache clearing error
    }
  }
}

