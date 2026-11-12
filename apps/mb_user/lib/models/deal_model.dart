enum DealState {
  pending,
  deposited,
  inInspection,
  settled,
  refunded,
  disputed;

  String get label {
    switch (this) {
      case DealState.pending:
        return 'PENDING';
      case DealState.deposited:
        return 'DEPOSITED';
      case DealState.inInspection:
        return 'IN_INSPECTION';
      case DealState.settled:
        return 'SETTLED';
      case DealState.refunded:
        return 'REFUNDED';
      case DealState.disputed:
        return 'DISPUTED';
    }
  }

  String get vietnameseLabel {
    switch (this) {
      case DealState.pending:
        return 'Chờ Ký Quỹ';
      case DealState.deposited:
        return 'Đã Khóa Tiền';
      case DealState.inInspection:
        return 'Đồng Kiểm';
      case DealState.settled:
        return 'Hoàn Tất';
      case DealState.refunded:
        return 'Đã Hoàn Tiền';
      case DealState.disputed:
        return 'Tranh Chấp';
    }
  }
}

DealState parseDealState(String? state) {
  switch (state?.toUpperCase()) {
    case 'DEPOSITED':
      return DealState.deposited;
    case 'IN_INSPECTION':
      return DealState.inInspection;
    case 'SETTLED':
      return DealState.settled;
    case 'REFUNDED':
      return DealState.refunded;
    case 'DISPUTED':
      return DealState.disputed;
    default:
      return DealState.pending;
  }
}

class DigitalAsset {
  final String id;
  final String dealId;
  final String assetType;
  final String fileName;
  final String? fileSizeBytes;
  final String? encryptedContent;
  final String? encryptionIv;
  final String? authTag;
  final String? contentHash;

  const DigitalAsset({
    required this.id,
    required this.dealId,
    required this.assetType,
    required this.fileName,
    this.fileSizeBytes,
    this.encryptedContent,
    this.encryptionIv,
    this.authTag,
    this.contentHash,
  });

  factory DigitalAsset.fromJson(Map<String, dynamic> json) {
    return DigitalAsset(
      id: json['id'] as String? ?? '',
      dealId: json['dealId'] as String? ?? '',
      assetType: json['assetType'] as String? ?? 'SOURCE_CODE',
      fileName: json['fileName'] as String? ?? 'vault_file.zip',
      fileSizeBytes: json['fileSizeBytes']?.toString(),
      encryptedContent: json['encryptedContent'] as String?,
      encryptionIv: json['encryptionIv'] as String?,
      authTag: json['authTag'] as String?,
      contentHash: json['contentHash'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'dealId': dealId,
      'assetType': assetType,
      'fileName': fileName,
      'fileSizeBytes': fileSizeBytes,
      'encryptedContent': encryptedContent,
      'encryptionIv': encryptionIv,
      'authTag': authTag,
      'contentHash': contentHash,
    };
  }
}

class DealModel {
  final String id;
  final String sellerId;
  final String? buyerId;
  final String title;
  final String? description;
  final double amount;
  final String currency;
  final DealState state;
  final int inspectionDuration;
  final String? createdAt;
  final String? updatedAt;
  final String? inspectionDeadline;
  final String? depositTxHash;
  final String? settleTxHash;
  final String? onchainDealId;
  final String? sellerName;
  final String? buyerName;
  final DigitalAsset? digitalAsset;

  const DealModel({
    required this.id,
    required this.sellerId,
    this.buyerId,
    required this.title,
    this.description,
    required this.amount,
    required this.currency,
    required this.state,
    required this.inspectionDuration,
    this.createdAt,
    this.updatedAt,
    this.inspectionDeadline,
    this.depositTxHash,
    this.settleTxHash,
    this.onchainDealId,
    this.sellerName,
    this.buyerName,
    this.digitalAsset,
  });

  String? get primaryTxHash =>
      settleTxHash ?? depositTxHash ?? onchainDealId;

  factory DealModel.fromJson(Map<String, dynamic> json) {
    final rawAmount = json['amount'] ?? json['price'];
    final parsedAmount = (rawAmount is num)
        ? rawAmount.toDouble()
        : double.tryParse(rawAmount?.toString() ?? '0') ?? 0.0;

    final sellerObj = json['seller'];
    final buyerObj = json['buyer'];

    return DealModel(
      id: json['id'] as String? ?? '',
      sellerId: json['sellerId'] as String? ?? '',
      buyerId: json['buyerId'] as String?,
      title: json['title'] as String? ?? 'Giao dịch ký quỹ',
      description: json['description'] as String?,
      amount: parsedAmount,
      currency: json['currency'] as String? ?? 'VND',
      state: parseDealState(json['state'] as String?),
      inspectionDuration: (json['inspectionDuration'] as num?)?.toInt() ?? 86400,
      createdAt: json['createdAt'] as String?,
      updatedAt: json['updatedAt'] as String?,
      inspectionDeadline: json['inspectionDeadline'] as String?,
      depositTxHash: json['depositTxHash'] as String?,
      settleTxHash: json['settleTxHash'] as String?,
      onchainDealId: json['onchainDealId'] as String?,
      sellerName: sellerObj is Map<String, dynamic>
          ? sellerObj['displayName'] as String?
          : json['sellerName'] as String?,
      buyerName: buyerObj is Map<String, dynamic>
          ? buyerObj['displayName'] as String?
          : json['buyerName'] as String?,
      digitalAsset: json['digitalAsset'] != null
          ? DigitalAsset.fromJson(json['digitalAsset'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'sellerId': sellerId,
      'buyerId': buyerId,
      'title': title,
      'description': description,
      'amount': amount,
      'currency': currency,
      'state': state.label,
      'inspectionDuration': inspectionDuration,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      'inspectionDeadline': inspectionDeadline,
      'depositTxHash': depositTxHash,
      'settleTxHash': settleTxHash,
      'onchainDealId': onchainDealId,
      'sellerName': sellerName,
      'buyerName': buyerName,
      'digitalAsset': digitalAsset?.toJson(),
    };
  }
}

class UnlockedVaultPayload {
  final String dealId;
  final String assetType;
  final String fileName;
  final String? fileSizeBytes;
  final String? encryptedPayload;
  final String? iv;
  final String? authTag;
  final int accessCount;
  final int maxAccessLimit;
  final String? decryptedKeyOrUrl;

  const UnlockedVaultPayload({
    required this.dealId,
    required this.assetType,
    required this.fileName,
    this.fileSizeBytes,
    this.encryptedPayload,
    this.iv,
    this.authTag,
    required this.accessCount,
    required this.maxAccessLimit,
    this.decryptedKeyOrUrl,
  });

  factory UnlockedVaultPayload.fromJson(Map<String, dynamic> json) {
    return UnlockedVaultPayload(
      dealId: json['dealId'] as String? ?? '',
      assetType: json['assetType'] as String? ?? 'SOURCE_CODE',
      fileName: json['fileName'] as String? ?? 'unlocked_asset',
      fileSizeBytes: json['fileSizeBytes']?.toString(),
      encryptedPayload: (json['encryptedPayload'] ?? json['encryptedContent'])
          as String?,
      iv: (json['iv'] ?? json['encryptionIv']) as String?,
      authTag: json['authTag'] as String?,
      accessCount: (json['accessCount'] as num?)?.toInt() ?? 1,
      maxAccessLimit: (json['maxAccessLimit'] as num?)?.toInt() ?? 5,
      decryptedKeyOrUrl: json['decryptedKeyOrUrl'] as String?,
    );
  }
}

class VietQrCheckoutData {
  final String? qrCodeUrl;
  final String? paymentUrl;
  final int? orderCode;
  final double amount;
  final String memo;
  final String bin;
  final String bankName;
  final String accountNumber;
  final String accountName;
  final String? status;

  const VietQrCheckoutData({
    this.qrCodeUrl,
    this.paymentUrl,
    this.orderCode,
    required this.amount,
    required this.memo,
    this.bin = '970422',
    this.bankName = 'MBBank (Quân Đội)',
    this.accountNumber = '0385966888',
    this.accountName = 'TRUSTPASSZ ESCROW',
    this.status,
  });

  String get deepLink =>
      'vietqr://pay?acc=$accountNumber&bin=$bin&amount=${amount.toInt()}&memo=${Uri.encodeComponent(memo)}';

  factory VietQrCheckoutData.fromJson(Map<String, dynamic> json) {
    final rawAmount = json['amount'];
    final parsedAmount = (rawAmount is num)
        ? rawAmount.toDouble()
        : double.tryParse(rawAmount?.toString() ?? '0') ?? 0.0;
    final bin = json['bin'] as String? ?? '970422';
    final bankName = bin == '970415'
        ? 'VietinBank (ICB)'
        : bin == '970422'
            ? 'MBBank (Quân Đội)'
            : 'Napas 24/7 ($bin)';
    return VietQrCheckoutData(
      qrCodeUrl: json['qrCodeUrl'] as String?,
      paymentUrl: json['paymentUrl'] as String?,
      orderCode: (json['orderCode'] as num?)?.toInt(),
      amount: parsedAmount,
      memo: json['memo'] as String? ?? 'TPZ ESCROW',
      bin: bin,
      bankName: bankName,
      accountNumber: json['accountNumber'] as String? ?? '0385966888',
      accountName: json['accountName'] as String? ?? 'TRUSTPASSZ ESCROW',
      status: json['status'] as String?,
    );
  }
}
