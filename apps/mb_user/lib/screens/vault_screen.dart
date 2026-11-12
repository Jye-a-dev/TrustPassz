import 'package:flutter/material.dart';
import 'digital_vault_screen.dart';

/// Legacy route entrypoint `/vault` delegating directly to [DigitalVaultScreen] (V2).
class VaultScreen extends StatelessWidget {
  final String dealId;
  final String? vaultId;
  final String? inspectionDeadline;
  final VoidCallback onBack;
  final ValueChanged<String> onOpenDispute;

  const VaultScreen({
    super.key,
    required this.dealId,
    this.vaultId,
    this.inspectionDeadline,
    required this.onBack,
    required this.onOpenDispute,
  });

  @override
  Widget build(BuildContext context) {
    return DigitalVaultScreen(
      dealId: dealId,
      vaultId: vaultId,
      inspectionDeadline: inspectionDeadline,
      onBack: onBack,
      onOpenDispute: onOpenDispute,
    );
  }
}
