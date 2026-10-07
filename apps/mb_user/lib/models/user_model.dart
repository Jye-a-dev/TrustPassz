enum Role { user, seller, buyer, admin }

Role parseRole(String? role) {
  switch (role?.toUpperCase()) {
    case 'SELLER':
      return Role.seller;
    case 'BUYER':
      return Role.buyer;
    case 'ADMIN':
      return Role.admin;
    default:
      return Role.user;
  }
}

class UserModel {
  final String id;
  final String? email;
  final String? walletAddress;
  final String displayName;
  final String? avatarUrl;
  final Role role;

  const UserModel({
    required this.id,
    this.email,
    this.walletAddress,
    required this.displayName,
    this.avatarUrl,
    required this.role,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String? ?? '',
      email: json['email'] as String?,
      walletAddress: json['walletAddress'] as String?,
      displayName: json['displayName'] as String? ?? 'TrustPassz User',
      avatarUrl: json['avatarUrl'] as String?,
      role: parseRole(json['role'] as String?),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'walletAddress': walletAddress,
      'displayName': displayName,
      'avatarUrl': avatarUrl,
      'role': role.name.toUpperCase(),
    };
  }
}

class AuthResponse {
  final String tokenType;
  final String accessToken;
  final int expiresIn;
  final UserModel user;

  const AuthResponse({
    required this.tokenType,
    required this.accessToken,
    required this.expiresIn,
    required this.user,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      tokenType: json['tokenType'] as String? ?? 'Bearer',
      accessToken: json['accessToken'] as String? ?? '',
      expiresIn: (json['expiresIn'] as num?)?.toInt() ?? 86400,
      user: UserModel.fromJson(
        (json['user'] as Map<String, dynamic>?) ?? <String, dynamic>{},
      ),
    );
  }
}

