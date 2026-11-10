import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../theme/app_tokens.dart';
import '../theme/theme_provider.dart';
import '../widgets/modals/google_oauth_dialog.dart';
import '../widgets/modals/passkey_dialog.dart';
import 'profile/profile_bank_sheet.dart';
import 'profile/profile_summary_card.dart';

/// Screen 11: Security Center, Trust Score, VietQR Withdrawal Bank Config & Theme Switcher.
class ProfileSettingsScreen extends StatefulWidget {
  final VoidCallback onLogout;
  final VoidCallback? onBack;

  const ProfileSettingsScreen({
    super.key,
    required this.onLogout,
    this.onBack,
  });

  @override
  State<ProfileSettingsScreen> createState() => _ProfileSettingsScreenState();
}

class _ProfileSettingsScreenState extends State<ProfileSettingsScreen> {
  static const String _bankNameKey = 'tpz_withdraw_bank_name';
  static const String _bankAccKey = 'tpz_withdraw_bank_account';
  static const String _biometricKey = 'tpz_biometric_vault_enabled';
  static const String _aiAlertsKey = 'tpz_ai_arbitrator_alerts';

  UserModel? _user;
  String _bankName = 'MB Bank';
  String _bankAccount = '09876543210';
  bool _biometricEnabled = true;
  bool _aiAlertsEnabled = true;

  @override
  void initState() {
    super.initState();
    _loadProfileAndPrefs();
  }

  Future<void> _loadProfileAndPrefs() async {
    final user = await AuthService.instance.getStoredUser();
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    setState(() {
      _user = user;
      _bankName = prefs.getString(_bankNameKey) ?? 'MB Bank';
      _bankAccount = prefs.getString(_bankAccKey) ?? '09876543210';
      _biometricEnabled = prefs.getBool(_biometricKey) ?? true;
      _aiAlertsEnabled = prefs.getBool(_aiAlertsKey) ?? true;
    });
  }

  Future<void> _toggleBiometric(bool val) async {
    setState(() => _biometricEnabled = val);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_biometricKey, val);
  }

  Future<void> _toggleAiAlerts(bool val) async {
    setState(() => _aiAlertsEnabled = val);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_aiAlertsKey, val);
  }

  Future<void> _editBank() async {
    final updated = await showVietQrBankEditSheet(
      context,
      currentBankName: _bankName,
      currentAccountNo: _bankAccount,
    );
    if (updated == null || !mounted) return;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_bankNameKey, updated.bankName);
    await prefs.setString(_bankAccKey, updated.accountNo);
    if (mounted) {
      setState(() {
        _bankName = updated.bankName;
        _bankAccount = updated.accountNo;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.tp;

    return Scaffold(
      backgroundColor: c.canvas,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      if (widget.onBack != null) ...[
                        SizedBox(
                          width: 44,
                          height: 44,
                          child: OutlinedButton(
                            onPressed: widget.onBack,
                            style: OutlinedButton.styleFrom(
                              padding: EdgeInsets.zero,
                              minimumSize: const Size(44, 44),
                              backgroundColor: c.surface,
                              side: BorderSide(color: c.border),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: Icon(
                              Icons.arrow_back_rounded,
                              size: 18,
                              color: c.textPrimary,
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                      ],
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Trung Tâm Bảo Mật',
                            style: TextStyle(
                              color: c.textPrimary,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            'Hồ sơ cá nhân & Xác thực',
                            style: AppTokens.monoStyle(
                              color: c.textMuted,
                              fontSize: 10.5,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: c.emeraldSoft,
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: c.emeraldBorder),
                    ),
                    child: Text(
                      'eKYC VIP',
                      style: AppTokens.monoStyle(
                        color: c.emeraldText,
                        fontSize: 10.5,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              ProfileSummaryCard(user: _user),
              const SizedBox(height: 14),

              Container(
                padding: const EdgeInsets.all(16),
                decoration: AppTokens.cardDecoration(c, radius: 22),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'PHƯƠNG THỨC XÁC THỰC & RÚT TIỀN',
                      style: AppTokens.monoStyle(
                        color: c.textMuted,
                        fontSize: 10.5,
                        letterSpacing: 0.6,
                      ),
                    ),
                    const SizedBox(height: 12),
                    ProfileMethodTile(
                      icon: Icons.account_circle_outlined,
                      iconBg: c.surfaceSubtle,
                      iconColor: AppTokens.googleBlue,
                      title: 'Google OAuth',
                      subtitle: _user?.email != null
                          ? 'Đã kết nối (${_user!.email})'
                          : 'Kiểm tra trạng thái kết nối',
                      trailing: OutlinedButton(
                        onPressed: () => GoogleOAuthDialog.show(
                          context,
                          currentUser: _user,
                        ),
                        style: AppTokens.outlinedButtonStyle(c),
                        child: Text(
                          'Kiểm tra',
                          style: TextStyle(color: c.cyanText, fontSize: 11.5),
                        ),
                      ),
                    ),
                    Divider(height: 20, color: c.border),
                    ProfileMethodTile(
                      icon: Icons.fingerprint_rounded,
                      iconBg: c.cyanSoft,
                      iconColor: c.cyanText,
                      title: 'Khóa Passkey Phần Cứng',
                      subtitle: 'FIDO2 / Sinh trắc học thiết bị',
                      trailing: OutlinedButton(
                        onPressed: () => PasskeyDialog.show(context),
                        style: AppTokens.outlinedButtonStyle(c),
                        child: Text(
                          'Thiết lập',
                          style: TextStyle(color: c.cyanText, fontSize: 11.5),
                        ),
                      ),
                    ),
                    Divider(height: 20, color: c.border),
                    ProfileMethodTile(
                      icon: Icons.account_balance_outlined,
                      iconBg: c.emeraldSoft,
                      iconColor: c.emeraldText,
                      title: 'Tài Khoản Rút Tiền VietQR',
                      subtitle: '$_bankName • $_bankAccount',
                      trailing: OutlinedButton(
                        onPressed: _editBank,
                        style: AppTokens.outlinedButtonStyle(c),
                        child: Text(
                          'Sửa',
                          style: TextStyle(color: c.cyanText, fontSize: 11.5),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              Container(
                padding: const EdgeInsets.all(16),
                decoration: AppTokens.cardDecoration(c, radius: 22),
                child: Material(
                  type: MaterialType.transparency,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'GIAO DIỆN & BẢO MẬT HỆ THỐNG',
                      style: AppTokens.monoStyle(
                        color: c.textMuted,
                        fontSize: 10.5,
                        letterSpacing: 0.6,
                      ),
                    ),
                    const SizedBox(height: 8),
                    AnimatedBuilder(
                      animation: ThemeProvider.instance,
                      builder: (context, _) {
                        final isDark = ThemeProvider.instance.isDarkMode;
                        return SwitchListTile(
                          contentPadding: EdgeInsets.zero,
                          value: isDark,
                          activeThumbColor: AppTokens.emerald,
                          onChanged: (_) =>
                              ThemeProvider.instance.toggleTheme(),
                          title: Text(
                            'Chế Độ Tối (Dark Cyber-Escrow)',
                            style: TextStyle(
                              color: c.textPrimary,
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          subtitle: Text(
                            isDark
                                ? 'Đang bật nền tối #080C14'
                                : 'Đang bật nền sáng mặc định #FAFAFB',
                            style: TextStyle(color: c.textMuted, fontSize: 11),
                          ),
                        );
                      },
                    ),
                    Divider(height: 8, color: c.border),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      value: _biometricEnabled,
                      activeThumbColor: AppTokens.emerald,
                      onChanged: _toggleBiometric,
                      title: Text(
                        'Bảo Mật Sinh Trắc Học Két Số',
                        style: TextStyle(
                          color: c.textPrimary,
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      subtitle: Text(
                        'Yêu cầu Face ID / PIN trước khi giải mã AES-256',
                        style: TextStyle(color: c.textMuted, fontSize: 11),
                      ),
                    ),
                    Divider(height: 8, color: c.border),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      value: _aiAlertsEnabled,
                      activeThumbColor: AppTokens.emerald,
                      onChanged: _toggleAiAlerts,
                      title: Text(
                        'Thông Báo Trọng Tài AI',
                        style: TextStyle(
                          color: c.textPrimary,
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      subtitle: Text(
                        'Cảnh báo trước khi hết cửa sổ đồng kiểm',
                        style: TextStyle(color: c.textMuted, fontSize: 11),
                      ),
                    ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 18),

              OutlinedButton.icon(
                onPressed: widget.onLogout,
                icon: Icon(Icons.logout_rounded, size: 18, color: c.roseText),
                label: Text(
                  'Đăng Xuất Khỏi Thiết Bị',
                  style: TextStyle(
                    color: c.roseText,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
                style: AppTokens.outlinedButtonStyle(
                  c,
                  backgroundColor: c.roseSoft,
                  borderColor: c.roseBorder,
                  minHeight: 48,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
